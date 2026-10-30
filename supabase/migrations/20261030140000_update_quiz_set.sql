-- Admins can edit question packs from /admin.

-- Choices added before positions existed have none, and the game screens now
-- sort by position. Number them in the order they've been showing up in.
update public.choices
  set position = numbered.position
  from (
    select id, row_number() over (partition by question_id order by ctid) - 1 as position
    from public.choices
    where question_id in (select question_id from public.choices where position is null)
  ) as numbered
  where choices.id = numbered.id;

-- Change a quiz set to match what's given, in one transaction. Takes the same
-- questions as create_quiz_set, and questions and choices that already exist also
-- give their id. Existing rows are updated rather than replaced, because answers
-- cascade from questions and game_results adds up answers: replacing them would
-- wipe the scores of past games. Questions left out are deleted, along with their
-- answers. Questions are renumbered in the order given.
create function public.update_quiz_set(quiz_set_id uuid, name text, description text, questions jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  question record;
  choice record;
  saved_question_id uuid;
  saved_choice_id uuid;
  kept_choice_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit question packs' using errcode = '42501';
  end if;

  if jsonb_typeof(update_quiz_set.questions) is distinct from 'array'
    or jsonb_array_length(update_quiz_set.questions) = 0 then
    raise exception 'A question pack needs at least one question';
  end if;

  update public.quiz_sets as pack
    set name = update_quiz_set.name,
      description = nullif(btrim(update_quiz_set.description), '')
    where pack.id = update_quiz_set.quiz_set_id;
  if not found then
    raise exception 'That question pack no longer exists';
  end if;

  delete from public.questions as existing
    where existing.quiz_set_id = update_quiz_set.quiz_set_id
      and existing.id not in (
        select (given.value->>'id')::uuid
        from jsonb_array_elements(update_quiz_set.questions) as given
        where given.value ? 'id'
      );

  for question in
    select value as data, ordinality - 1 as question_order
    from jsonb_array_elements(update_quiz_set.questions) with ordinality
  loop
    if question.data ? 'id' then
      saved_question_id := (question.data->>'id')::uuid;
      update public.questions as existing
        set body = question.data->>'body',
          "order" = question.question_order,
          type = (question.data->>'type')::public.question_type,
          settings = coalesce(question.data->'settings', '{}'::jsonb),
          time_limit_seconds = coalesce((question.data->>'time_limit_seconds')::smallint, 20)
        where existing.id = saved_question_id
          and existing.quiz_set_id = update_quiz_set.quiz_set_id;
      if not found then
        raise exception 'This pack was changed somewhere else. Reload and try again';
      end if;
    else
      insert into public.questions (body, "order", quiz_set_id, type, settings, time_limit_seconds)
      values (
        question.data->>'body',
        question.question_order,
        update_quiz_set.quiz_set_id,
        (question.data->>'type')::public.question_type,
        coalesce(question.data->'settings', '{}'::jsonb),
        coalesce((question.data->>'time_limit_seconds')::smallint, 20)
      )
      returning id into saved_question_id;
    end if;

    kept_choice_ids := '{}';
    for choice in
      select value as data, ordinality - 1 as choice_position
      from jsonb_array_elements(coalesce(question.data->'choices', '[]'::jsonb)) with ordinality
    loop
      if choice.data ? 'id' then
        saved_choice_id := (choice.data->>'id')::uuid;
        update public.choices as existing
          set body = choice.data->>'body',
            is_correct = coalesce((choice.data->>'is_correct')::boolean, false),
            position = choice.choice_position
          where existing.id = saved_choice_id
            and existing.question_id = saved_question_id;
        if not found then
          raise exception 'This pack was changed somewhere else. Reload and try again';
        end if;
      else
        insert into public.choices (question_id, body, is_correct, position)
        values (
          saved_question_id,
          choice.data->>'body',
          coalesce((choice.data->>'is_correct')::boolean, false),
          choice.choice_position
        )
        returning id into saved_choice_id;
      end if;
      kept_choice_ids := kept_choice_ids || saved_choice_id;
    end loop;

    delete from public.choices as existing
      where existing.question_id = saved_question_id
        and not (existing.id = any(kept_choice_ids));
  end loop;
end;
$$;

revoke execute on function public.update_quiz_set(uuid, text, text, jsonb) from public, anon;
grant execute on function public.update_quiz_set(uuid, text, text, jsonb) to authenticated;
