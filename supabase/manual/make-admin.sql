-- Perla: назначить администратора. Запускается вручную, в миграции не входит.
-- Supabase → SQL Editor → New query. Замените ВСТАВЬТЕ_ВАШУ_ПОЧТУ и нажмите Run.

-- Сначала создайте себе пользователя: Authentication → Users → Add user → Create new user
-- (почта + пароль, галочка Auto Confirm User). Потом впишите эту почту ниже и запустите файл.
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('ВСТАВЬТЕ_ВАШУ_ПОЧТУ')
on conflict do nothing;
