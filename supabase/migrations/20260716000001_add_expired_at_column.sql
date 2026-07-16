-- Add expired_at timestamp to track when a verified OEC submission has expired
alter table public.submissions add column if not exists expired_at timestamp with time zone;

