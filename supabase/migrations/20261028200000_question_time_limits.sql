-- Each question has its own time limit, 20 seconds unless set.

alter table public.questions
  add column time_limit_seconds smallint default 20 not null
    constraint questions_time_limit_seconds_check check (time_limit_seconds between 5 and 600);

-- add_question takes an optional time limit. Dropped first because a new
-- signature would otherwise add a second add_question next to the old one.
drop function public.add_question(uuid, text, int, json[], public.question_type, jsonb);

create function public.add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[] default '{}', -- i.e. [{"body": "Postgres", "is_correct": true},{"body": "MySQL", "is_correct": false}]
  type public.question_type default 'multiple_choice',
  settings jsonb default '{}'::jsonb,
  time_limit_seconds int default 20
) returns void language plpgsql as $$
declare
  question_id uuid;
  choice json;
  choice_position smallint := 0;
begin
  insert into public.questions(body, "order", quiz_set_id, type, settings, time_limit_seconds)
  values (
    add_question.body,
    add_question."order",
    add_question.quiz_set_id,
    add_question.type,
    add_question.settings,
    add_question.time_limit_seconds
  )
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

-- Score by the question's own time limit instead of a fixed 20 seconds.
-- Otherwise the same as in 20261028180000_more_question_types.sql.
create or replace function public.submit_answer(participant_id uuid, question_id uuid, response jsonb)
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
    extract(epoch from now() - coalesce(game.question_started_at, now())) / question.time_limit_seconds
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
