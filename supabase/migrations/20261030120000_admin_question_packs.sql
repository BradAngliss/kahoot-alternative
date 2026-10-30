-- Admins can create question packs from /admin. Being signed in isn't enough:
-- anonymous players and hosts are signed in too, so admins are listed by user id.
--
-- To make an account an admin, run this as the database owner (Studio's SQL editor):
--   insert into public.admins (user_id)
--     select id from auth.users where email = 'you@example.com';

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade on update cascade,
  created_at timestamp with time zone default now() not null
);

-- No policies: nobody can read or change this table through the API.
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where admins.user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Create a quiz set and all its questions in one transaction, so a failure can't
-- leave a half-made pack. Questions are numbered in the order given, which is
-- what the game screens rely on. Each question looks like:
--   {"body": "...", "type": "slider", "settings": {...}, "time_limit_seconds": 20,
--    "choices": [{"body": "...", "is_correct": true}]}
-- See 20261028180000_more_question_types.sql for what each type expects.
create function public.create_quiz_set(name text, description text, questions jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_quiz_set_id uuid;
  new_question_id uuid;
  question record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create question packs' using errcode = '42501';
  end if;

  if jsonb_typeof(create_quiz_set.questions) is distinct from 'array'
    or jsonb_array_length(create_quiz_set.questions) = 0 then
    raise exception 'A question pack needs at least one question';
  end if;

  insert into public.quiz_sets (name, description)
  values (create_quiz_set.name, nullif(btrim(create_quiz_set.description), ''))
  returning id into new_quiz_set_id;

  for question in
    select value as data, ordinality - 1 as question_order
    from jsonb_array_elements(create_quiz_set.questions) with ordinality
  loop
    insert into public.questions (body, "order", quiz_set_id, type, settings, time_limit_seconds)
    values (
      question.data->>'body',
      question.question_order,
      new_quiz_set_id,
      (question.data->>'type')::public.question_type,
      coalesce(question.data->'settings', '{}'::jsonb),
      coalesce((question.data->>'time_limit_seconds')::smallint, 20)
    )
    returning id into new_question_id;

    insert into public.choices (question_id, body, is_correct, position)
    select
      new_question_id,
      choice.value->>'body',
      coalesce((choice.value->>'is_correct')::boolean, false),
      choice.ordinality - 1
    from jsonb_array_elements(coalesce(question.data->'choices', '[]'::jsonb)) with ordinality as choice;
  end loop;

  return new_quiz_set_id;
end;
$$;

revoke execute on function public.create_quiz_set(text, text, jsonb) from public, anon;
grant execute on function public.create_quiz_set(text, text, jsonb) to authenticated;
