-- Admins can delete question packs from /admin. Foreign keys cascade, so this
-- also removes the pack's questions and choices, and every game played with it
-- along with that game's participants and answers.
create function public.delete_quiz_set(quiz_set_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete question packs' using errcode = '42501';
  end if;

  delete from public.quiz_sets where quiz_sets.id = delete_quiz_set.quiz_set_id;
  if not found then
    raise exception 'That question pack no longer exists';
  end if;
end;
$$;

revoke execute on function public.delete_quiz_set(uuid) from public, anon;
grant execute on function public.delete_quiz_set(uuid) to authenticated;
