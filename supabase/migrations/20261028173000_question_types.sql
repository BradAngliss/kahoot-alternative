-- Question types: each question has a type and type-specific settings, players
-- submit a type-specific response, and the database grades and scores answers.

create type public.question_type as enum ('multiple_choice');

alter table public.questions
  add column type public.question_type default 'multiple_choice' not null,
  add column settings jsonb default '{}'::jsonb not null;

-- What the player submitted. For multiple choice: {"choice_ids": ["<uuid>"]}.
-- choice_id is still filled in for multiple choice so the host's vote bars and
-- existing rows keep working.
alter table public.answers
  add column response jsonb default '{}'::jsonb not null;

update public.answers
  set response = jsonb_build_object('choice_ids', jsonb_build_array(choice_id))
  where choice_id is not null;

-- When the current question's choices are shown and answering opens.
alter table public.games
  add column question_started_at timestamp with time zone;

-- Set question_started_at whenever a question opens: when the game starts and
-- each time the host moves to the next question. Players see the choices
-- after a 5 second countdown (TIME_TIL_CHOICE_REVEAL in src/constants.ts).
create or replace function public.set_question_started_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.phase = 'quiz' and old.phase is distinct from 'quiz')
    or new.current_question_sequence is distinct from old.current_question_sequence then
    new.question_started_at := now() + interval '5 seconds';
  end if;
  return new;
end;
$$;

create trigger set_question_started_at
  before update on public.games
  for each row execute function public.set_question_started_at();

-- How correct a response is, from 0 (wrong) to 1 (fully correct).
-- Each question type adds a branch here.
create or replace function public.grade_answer(question public.questions, response jsonb)
returns real language plpgsql stable set search_path = '' as $$
begin
  case question.type
    when 'multiple_choice' then
      if jsonb_typeof(response->'choice_ids') <> 'array'
        or jsonb_array_length(response->'choice_ids') <> 1 then
        raise exception 'Pick exactly one choice';
      end if;

      return case when exists (
        select 1 from public.choices
        where choices.question_id = question.id
          and choices.id = (response->'choice_ids'->>0)::uuid
          and choices.is_correct
      ) then 1 else 0 end;
  end case;
end;
$$;

-- Grade and save a player's answer to the current question. Score is up to
-- 1000, less the longer the player took (QUESTION_ANSWER_TIME in
-- src/constants.ts), times how correct the answer was.
create or replace function public.submit_answer(participant_id uuid, question_id uuid, response jsonb)
returns table (is_correct boolean, score smallint)
language plpgsql security definer set search_path = '' as $$
declare
  participant public.participants;
  game public.games;
  question public.questions;
  correctness real;
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

  correctness := public.grade_answer(question, response);

  elapsed_fraction := greatest(0, least(1,
    extract(epoch from now() - coalesce(game.question_started_at, now())) / 20.0
  ));
  answer_score := round(correctness * (1000 - round(elapsed_fraction * 1000)));

  begin
    insert into public.answers (participant_id, question_id, choice_id, response, score)
    values (
      participant.id,
      question.id,
      case when question.type = 'multiple_choice'
        then (response->'choice_ids'->>0)::uuid end,
      response,
      answer_score
    );
  exception when unique_violation then
    raise exception 'You have already answered this question';
  end;

  return query select correctness = 1, answer_score;
end;
$$;

-- grade_answer is only called from submit_answer, which runs as the function owner.
revoke execute on function public.grade_answer(public.questions, jsonb) from public, anon, authenticated;
revoke execute on function public.submit_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_answer(uuid, uuid, jsonb) to authenticated;

-- Answers can only be saved through submit_answer, so players can't set their own score.
drop policy "Participants can insert their own answers" on public.answers;

-- add_question gains optional type and settings. Dropped first because a new
-- signature would otherwise add a second add_question next to the old one.
drop function public.add_question(uuid, text, int, json[]);

create function public.add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[], -- i.e. [{"body": "Postgres", "is_correct": true},{"body": "MySQL", "is_correct": false}]
  type public.question_type default 'multiple_choice',
  settings jsonb default '{}'::jsonb
) returns void language plpgsql as $$
declare
  question_id uuid;
  choice json;
begin
  insert into public.questions(body, "order", quiz_set_id, type, settings)
  values (add_question.body, add_question."order", add_question.quiz_set_id, add_question.type, add_question.settings)
  returning id into question_id;

  foreach choice in array choices
  loop
    insert into public.choices
        (question_id, body, is_correct)
        values (question_id, choice->>'body', (choice->>'is_correct')::boolean);
  end loop;
end;
$$ security invoker;
