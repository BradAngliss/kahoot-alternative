-- More question types. What each one expects:
--   true_false    choices: True and False. response: {"choice_ids": [id]}
--   multi_select  choices, several correct. response: {"choice_ids": [id, ...]}, scores only if exactly the correct set
--   type_answer   no choices. settings: {"accepted_answers": ["..."]}. response: {"text": "..."}
--   slider        no choices. settings: {"min", "max", "step", "answer", "margin", "unit"}. response: {"value": n}
--   ordering      choices in the correct order. response: {"choice_ids": [every id, in order]}, partial credit per position
--   poll          choices, none correct. response: {"choice_ids": [id]}, never scores

alter type public.question_type add value 'true_false';
alter type public.question_type add value 'multi_select';
alter type public.question_type add value 'type_answer';
alter type public.question_type add value 'slider';
alter type public.question_type add value 'ordering';
alter type public.question_type add value 'poll';

-- Where each choice was listed when the question was added. For ordering
-- questions this is the correct order.
alter table public.choices
  add column position smallint;

-- add_question now records each choice's position, lets choices be left out
-- for types that have none, and treats a missing is_correct as false.
drop function public.add_question(uuid, text, int, json[], public.question_type, jsonb);

create function public.add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[] default '{}', -- i.e. [{"body": "Postgres", "is_correct": true},{"body": "MySQL", "is_correct": false}]
  type public.question_type default 'multiple_choice',
  settings jsonb default '{}'::jsonb
) returns void language plpgsql as $$
declare
  question_id uuid;
  choice json;
  choice_position smallint := 0;
begin
  insert into public.questions(body, "order", quiz_set_id, type, settings)
  values (add_question.body, add_question."order", add_question.quiz_set_id, add_question.type, add_question.settings)
  returning id into question_id;

  foreach choice in array choices
  loop
    insert into public.choices
        (question_id, body, is_correct, position)
        values (question_id, choice->>'body', coalesce((choice->>'is_correct')::boolean, false), choice_position);
    choice_position := choice_position + 1;
  end loop;
end;
$$ security invoker;

-- How correct a response is, from 0 (wrong) to 1 (fully correct).
create or replace function public.grade_answer(question public.questions, response jsonb)
returns real language plpgsql stable set search_path = '' as $$
declare
  config jsonb := question.settings;
  picked_ids uuid[];
  correct_ids uuid[];
  guess numeric;
  margin numeric;
begin
  if question.type in ('multiple_choice', 'true_false', 'multi_select', 'ordering', 'poll') then
    if jsonb_typeof(response->'choice_ids') is distinct from 'array' then
      raise exception 'Pick a choice';
    end if;

    select coalesce(array_agg(picked.id::uuid order by picked.n), '{}')
      into picked_ids
      from jsonb_array_elements_text(response->'choice_ids') with ordinality as picked(id, n);

    if exists (
      select 1 from unnest(picked_ids) as picked(id)
      where picked.id not in (select choices.id from public.choices where choices.question_id = question.id)
    ) then
      raise exception 'That choice is not part of this question';
    end if;

    if cardinality(picked_ids) <> (select count(distinct picked.id) from unnest(picked_ids) as picked(id)) then
      raise exception 'Each choice can only be picked once';
    end if;
  end if;

  case question.type
    when 'multiple_choice', 'true_false' then
      if cardinality(picked_ids) <> 1 then
        raise exception 'Pick exactly one choice';
      end if;
      return case when exists (
        select 1 from public.choices where choices.id = picked_ids[1] and choices.is_correct
      ) then 1 else 0 end;

    when 'poll' then
      if cardinality(picked_ids) <> 1 then
        raise exception 'Pick exactly one choice';
      end if;
      return 0;

    when 'multi_select' then
      if cardinality(picked_ids) = 0 then
        raise exception 'Pick at least one choice';
      end if;
      select coalesce(array_agg(choices.id), '{}') into correct_ids
        from public.choices where choices.question_id = question.id and choices.is_correct;
      return case when picked_ids @> correct_ids and correct_ids @> picked_ids then 1 else 0 end;

    when 'ordering' then
      select coalesce(array_agg(choices.id order by choices.position), '{}') into correct_ids
        from public.choices where choices.question_id = question.id;
      if cardinality(picked_ids) <> cardinality(correct_ids) then
        raise exception 'Put every item in order';
      end if;
      return (
        select count(*) from generate_subscripts(correct_ids, 1) as i
        where correct_ids[i] = picked_ids[i]
      )::real / cardinality(correct_ids);

    when 'type_answer' then
      if jsonb_typeof(response->'text') is distinct from 'string' or btrim(response->>'text') = '' then
        raise exception 'Type an answer';
      end if;
      -- Ignore case and extra spaces
      return case when exists (
        select 1 from jsonb_array_elements_text(config->'accepted_answers') as accepted(answer)
        where lower(regexp_replace(btrim(accepted.answer), '\s+', ' ', 'g'))
          = lower(regexp_replace(btrim(response->>'text'), '\s+', ' ', 'g'))
      ) then 1 else 0 end;

    when 'slider' then
      if jsonb_typeof(response->'value') is distinct from 'number' then
        raise exception 'Pick a number';
      end if;
      guess := (response->>'value')::numeric;
      if guess < (config->>'min')::numeric or guess > (config->>'max')::numeric then
        raise exception 'That number is out of range';
      end if;
      -- Full points for the exact answer, dropping to none at margin away.
      -- Default margin is a quarter of the range.
      margin := coalesce(
        (config->>'margin')::numeric,
        ((config->>'max')::numeric - (config->>'min')::numeric) / 4
      );
      if margin <= 0 then
        return case when guess = (config->>'answer')::numeric then 1 else 0 end;
      end if;
      return greatest(0, 1 - abs(guess - (config->>'answer')::numeric) / margin);
  end case;
end;
$$;

-- submit_answer also returns how correct the answer was, so players can be
-- told when they were close. The return type changes, so it is recreated.
drop function public.submit_answer(uuid, uuid, jsonb);

create function public.submit_answer(participant_id uuid, question_id uuid, response jsonb)
returns table (is_correct boolean, correctness real, score smallint)
language plpgsql security definer set search_path = '' as $$
declare
  participant public.participants;
  game public.games;
  question public.questions;
  answer_correctness real;
  elapsed_fraction real;
  answer_score smallint;
begin
  select * into participant from public.participants
    where participants.id = submit_answer.participant_id
      and participants.user_id = auth.uid();
  if not found then
    raise exception 'You are not a player in this game';
  end if;

  select * into game from public.games where games.id = participant.game_id;
  if game.phase <> 'quiz' or game.is_answer_revealed then
    raise exception 'Answers are closed for this question';
  end if;

  select * into question from public.questions
    where questions.id = submit_answer.question_id
      and questions.quiz_set_id = game.quiz_set_id
      and questions."order" = game.current_question_sequence;
  if not found then
    raise exception 'This is not the current question';
  end if;

  answer_correctness := public.grade_answer(question, response);

  elapsed_fraction := greatest(0, least(1,
    extract(epoch from now() - coalesce(game.question_started_at, now())) / 20.0
  ));
  answer_score := round(answer_correctness * (1000 - round(elapsed_fraction * 1000)));

  begin
    insert into public.answers (participant_id, question_id, choice_id, response, score)
    values (
      participant.id,
      question.id,
      -- Single-choice types also fill in choice_id
      case when question.type in ('multiple_choice', 'true_false', 'poll')
        then (response->'choice_ids'->>0)::uuid end,
      response,
      answer_score
    );
  exception when unique_violation then
    raise exception 'You have already answered this question';
  end;

  return query select answer_correctness = 1, answer_correctness, answer_score;
end;
$$;

revoke execute on function public.submit_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_answer(uuid, uuid, jsonb) to authenticated;
