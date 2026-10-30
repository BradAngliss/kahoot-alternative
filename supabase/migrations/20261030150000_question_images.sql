-- A question can have one picture, shown on the host's screen. It lives in the
-- question-images bucket and questions.image_url, which nothing used until now,
-- is its public URL.

-- Anyone can view the pictures by URL, as a host's anonymous session needs to.
-- Only image types, so an upload can't serve a page from this domain.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "Admins can list question images" on storage.objects
  for select to authenticated
  using (bucket_id = 'question-images' and public.is_admin());

create policy "Admins can upload question images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'question-images' and public.is_admin());

create policy "Admins can delete question images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'question-images' and public.is_admin());

-- The same functions as before, now saving image_url too. Questions may give
-- {"image_url": "..."}, and leaving it out means no picture.
create or replace function public.create_quiz_set(name text, description text, questions jsonb)
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
    insert into public.questions (body, "order", quiz_set_id, type, settings, time_limit_seconds, image_url)
    values (
      question.data->>'body',
      question.question_order,
      new_quiz_set_id,
      (question.data->>'type')::public.question_type,
      coalesce(question.data->'settings', '{}'::jsonb),
      coalesce((question.data->>'time_limit_seconds')::smallint, 20),
      question.data->>'image_url'
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

create or replace function public.update_quiz_set(quiz_set_id uuid, name text, description text, questions jsonb)
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
          time_limit_seconds = coalesce((question.data->>'time_limit_seconds')::smallint, 20),
          image_url = question.data->>'image_url'
        where existing.id = saved_question_id
          and existing.quiz_set_id = update_quiz_set.quiz_set_id;
      if not found then
        raise exception 'This pack was changed somewhere else. Reload and try again';
      end if;
    else
      insert into public.questions (body, "order", quiz_set_id, type, settings, time_limit_seconds, image_url)
      values (
        question.data->>'body',
        question.question_order,
        update_quiz_set.quiz_set_id,
        (question.data->>'type')::public.question_type,
        coalesce(question.data->'settings', '{}'::jsonb),
        coalesce((question.data->>'time_limit_seconds')::smallint, 20),
        question.data->>'image_url'
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
