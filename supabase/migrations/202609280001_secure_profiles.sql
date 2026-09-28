-- Existing databases may still have the original self-update policy.
-- A restaurant owner must not be able to promote their own profile to admin.
drop policy if exists profiles_self_update on public.profiles;
