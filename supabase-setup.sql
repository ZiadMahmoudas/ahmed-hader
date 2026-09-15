-- Ahmed & Hader shared guestbook
-- Run this ONCE in Supabase Dashboard -> SQL Editor.

create table if not exists public.wedding_wishes (
  id bigint generated always as identity primary key,
  event_slug text not null,
  name text not null,
  message text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),

  constraint wedding_wishes_name_length
    check (char_length(btrim(name)) between 1 and 30),

  constraint wedding_wishes_message_length
    check (char_length(btrim(message)) between 1 and 180)
);

create index if not exists wedding_wishes_event_id_idx
  on public.wedding_wishes (event_slug, id);

alter table public.wedding_wishes enable row level security;

-- Visitors only need to read and add wishes.
revoke all on table public.wedding_wishes from anon, authenticated;
grant select, insert on table public.wedding_wishes to anon, authenticated;

-- Identity sequence permission for public inserts.
grant usage, select on sequence public.wedding_wishes_id_seq to anon, authenticated;

drop policy if exists "public can read wedding wishes" on public.wedding_wishes;
create policy "public can read wedding wishes"
on public.wedding_wishes
for select
to anon, authenticated
using (
  is_visible = true
  and event_slug = 'ahmed-hadder'
);

drop policy if exists "public can add wedding wishes" on public.wedding_wishes;
create policy "public can add wedding wishes"
on public.wedding_wishes
for insert
to anon, authenticated
with check (
  is_visible = true
  and event_slug = 'ahmed-hadder'
  and char_length(btrim(name)) between 1 and 30
  and char_length(btrim(message)) between 1 and 180
);

-- No public update/delete policies are created.
-- Moderation stays in the Supabase dashboard.

comment on table public.wedding_wishes is
'Shared wedding guestbook for Ahmed & Hader. Public can read visible wishes and insert new wishes only.';
