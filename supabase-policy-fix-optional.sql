-- Optional robustness patch. The updated app already uses 'ahmed-hadder',
-- so your existing policy can work without rerunning this.
-- Run this only if you also want both spellings accepted by the database.

drop policy if exists "public can read wedding wishes" on public.wedding_wishes;
create policy "public can read wedding wishes"
on public.wedding_wishes
for select
to anon, authenticated
using (
  is_visible = true
  and event_slug in ('ahmed-hadder', 'ahmed-hadeer')
);

drop policy if exists "public can add wedding wishes" on public.wedding_wishes;
create policy "public can add wedding wishes"
on public.wedding_wishes
for insert
to anon, authenticated
with check (
  is_visible = true
  and event_slug in ('ahmed-hadder', 'ahmed-hadeer')
  and char_length(btrim(name)) between 1 and 30
  and char_length(btrim(message)) between 1 and 180
);
