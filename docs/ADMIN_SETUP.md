# Platform admin setup

The public migrations do not create an admin account or a fixed password.

1. In your Supabase project, open **Authentication → Users → Add user**. Create
   your own account with a strong unique password and confirm its email.
2. Open **SQL Editor** and run the statement below with that account's email.
   Use an account you own; it will have platform-wide access to restaurants.

```sql
insert into public.profiles (id, role, restaurant_id)
select id, 'admin', null
from auth.users
where email = 'you@example.com'
on conflict (id) do update
set role = 'admin', restaurant_id = null;
```

3. Check that exactly one row exists for this email and `role = 'admin'`.
4. Sign in at `/login` and verify that `/admin` opens. Never publish a real
   password, service-role key, or `.env.local` file.

If you are upgrading an earlier database, apply
`202609280001_secure_profiles.sql` before enabling owner accounts.
