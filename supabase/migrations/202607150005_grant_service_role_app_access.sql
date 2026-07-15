grant usage on schema public to service_role;
grant select, insert, update, delete on table public.profiles, public.submissions, public.audit_logs, public.rate_limit_buckets, public.submission_requests, public.email_deliveries to service_role;
grant usage, select on all sequences in schema public to service_role;
