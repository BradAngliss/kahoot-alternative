-- A blank typed answer is accepted and graded as wrong, so players who type
-- nothing before time runs out still have an answer recorded.
-- Only the type_answer branch differs from 20261028180000_more_question_types.sql.

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
      if jsonb_typeof(response->'text') is distinct from 'string' then
        raise exception 'Type an answer';
      end if;
      -- A blank answer is wrong
      if btrim(response->>'text') = '' then
        return 0;
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
