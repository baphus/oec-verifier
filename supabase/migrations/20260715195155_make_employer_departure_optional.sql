-- Make employer default to 'N/A' so the frontend can omit it
alter table public.submissions alter column employer set default 'N/A';

-- Make departure_date nullable (no longer collected from the form)
alter table public.submissions alter column departure_date drop not null;
