-- OEC Verify foundation. The service-role key is never sent to browsers.
create extension if not exists pgcrypto;
create type public.submission_status as enum ('pending','verified','rejected','revoked');
create type public.profile_role as enum ('evaluator','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 150),
  role public.profile_role not null default 'evaluator', active boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(), reference text not null unique,
  first_name text not null check (char_length(first_name) between 1 and 80), middle_name text not null default '' check (char_length(middle_name) <= 80), last_name text not null check (char_length(last_name) between 1 and 80), suffix text not null default '' check (char_length(suffix) <= 30),
  full_name text not null check (char_length(full_name) between 1 and 150), email text not null check (char_length(email) between 3 and 254),
  oec_number text not null check (oec_number ~ '^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$'), employer text not null, position text not null,
  gender text not null check (char_length(gender) between 1 and 40), category text not null check (char_length(category) between 1 and 100), philippine_address text not null check (char_length(philippine_address) between 1 and 300), province text not null check (char_length(province) between 1 and 100), region text not null check (char_length(region) between 1 and 100), jobsite text not null check (char_length(jobsite) between 1 and 200), contact_number text not null check (char_length(contact_number) between 1 and 40), departure_date date not null, details text not null default '' check (char_length(details) <= 2000),
  issued_at timestamptz not null, expires_at timestamptz not null, status public.submission_status not null default 'pending',
  receipt_token_hash text not null unique check (receipt_token_hash ~ '^[a-f0-9]{64}$'), receipt_token_ciphertext text not null,
  request_id uuid not null unique, consented_at timestamptz not null, consent_version text not null check (consent_version = 'oec-privacy-v1'), initial_email_sent_at timestamptz,
  decision_reason text, decided_by uuid references public.profiles(id), decided_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (expires_at > issued_at)
);
create table public.rate_limit_buckets (
  key_hash text not null, bucket_start timestamptz not null, attempts integer not null default 0 check (attempts >= 0),
  primary key (key_hash, bucket_start)
);
create table public.submission_requests (
  request_id uuid primary key references public.submissions(request_id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions(id) on delete cascade,
  kind text not null check (kind in ('initial','decision_verified','decision_rejected','decision_revoked','resend')), status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0 check (attempts >= 0), available_at timestamptz not null default now(), locked_at timestamptz,
  claim_token uuid not null default gen_random_uuid(),
  sent_at timestamptz, last_error_code text check (last_error_code is null or last_error_code ~ '^[a-z_]{1,50}$'), created_at timestamptz not null default now(),
  unique (submission_id, kind)
);
create table public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action ~ '^[a-z_]{3,50}$'), submission_id uuid references public.submissions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index submissions_status_created_idx on public.submissions(status, created_at desc);
create index submissions_reference_idx on public.submissions(reference);
create index submissions_email_idx on public.submissions(lower(email));
create index audit_submission_created_idx on public.audit_logs(submission_id, created_at desc);
create index rate_limit_bucket_cleanup_idx on public.rate_limit_buckets(bucket_start);

alter table public.profiles enable row level security; alter table public.submissions enable row level security; alter table public.audit_logs enable row level security;
alter table public.rate_limit_buckets enable row level security; alter table public.submission_requests enable row level security; alter table public.email_deliveries enable row level security;
-- No public table reads/inserts/updates/deletes. API routes use service role only after validation/authz.
create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
-- Profile creation/role changes are deliberately outside the client: provision manually or via a trusted admin job.
-- Example: insert into public.profiles (id,display_name,role,active) values ('AUTH-USER-UUID','Jane Evaluator','evaluator',true);
-- Example admin: update public.profiles set role='admin', active=true where id='AUTH-USER-UUID';

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker as $$ begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger submissions_updated_at before update on public.submissions for each row execute function public.set_updated_at();

-- Controlled RPC is intentionally not granted to anon; it is available to service_role only.
revoke all on public.profiles, public.submissions, public.audit_logs, public.rate_limit_buckets, public.submission_requests, public.email_deliveries from anon, authenticated;
revoke all on function public.set_updated_at() from public;

-- Public creation and evaluator decisions are transactionally coupled to their audit row.
create or replace function public.create_public_submission(
  p_request_id uuid, p_first_name text, p_middle_name text, p_last_name text, p_suffix text, p_full_name text, p_email text, p_oec_number text,
  p_gender text, p_category text, p_philippine_address text, p_province text, p_region text, p_employer text, p_position text, p_jobsite text,
  p_contact_number text, p_departure_date date, p_details text, p_issued_at timestamptz, p_expires_at timestamptz, p_receipt_token_hash text,
  p_receipt_token_ciphertext text, p_ip_key_hash text, p_email_key_hash text, p_max_attempts integer, p_window_minutes integer
) returns table (submission_id uuid, reference text, expires_at timestamptz, receipt_token_ciphertext text, was_existing boolean)
language plpgsql security definer set search_path = public as $$
declare v_bucket timestamptz; v_attempts integer; v_id uuid; v_reference text; v_expires timestamptz; v_cipher text;
begin
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_request_id::text,''), 0));
  select s.id, s.reference, s.expires_at, s.receipt_token_ciphertext into v_id, v_reference, v_expires, v_cipher from public.submissions as s where s.request_id = p_request_id;
  if v_id is not null then return query select v_id, v_reference, v_expires, v_cipher, true; return; end if;
  if p_request_id is null or p_first_name is null or char_length(trim(p_first_name)) not between 1 and 80 or char_length(coalesce(p_middle_name,'')) > 80
    or p_last_name is null or char_length(trim(p_last_name)) not between 1 and 80 or char_length(coalesce(p_suffix,'')) > 30
    or p_full_name is null or char_length(trim(p_full_name)) not between 1 and 150
    or p_email is null or char_length(trim(p_email)) not between 3 and 254
    or p_oec_number is null or p_oec_number !~ '^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$'
    or p_gender is null or char_length(trim(p_gender)) not between 1 and 40 or p_category is null or char_length(trim(p_category)) not between 1 and 100
    or p_philippine_address is null or char_length(trim(p_philippine_address)) not between 1 and 300 or p_province is null or char_length(trim(p_province)) not between 1 and 100
    or p_region is null or char_length(trim(p_region)) not between 1 and 100 or p_employer is null or char_length(trim(p_employer)) not between 1 and 200
    or p_position is null or char_length(trim(p_position)) not between 1 and 150 or p_jobsite is null or char_length(trim(p_jobsite)) not between 1 and 200
    or p_contact_number is null or char_length(trim(p_contact_number)) not between 1 and 40 or p_departure_date is null or p_details is null or char_length(p_details) > 2000
    or p_expires_at <= p_issued_at or p_receipt_token_hash !~ '^[a-f0-9]{64}$' or p_receipt_token_ciphertext is null then raise exception 'invalid_submission'; end if;
  v_bucket := date_trunc('minute', now()) - (extract(minute from now())::integer % greatest(p_window_minutes, 1)) * interval '1 minute';
  insert into rate_limit_buckets(key_hash, bucket_start, attempts) values (p_ip_key_hash, v_bucket, 1) on conflict (key_hash,bucket_start) do update set attempts = rate_limit_buckets.attempts + 1 returning attempts into v_attempts;
  if v_attempts > p_max_attempts then return query select null::uuid, null::text, null::timestamptz, null::text, true; return; end if;
  insert into rate_limit_buckets(key_hash, bucket_start, attempts) values (p_email_key_hash, v_bucket, 1) on conflict (key_hash,bucket_start) do update set attempts = rate_limit_buckets.attempts + 1 returning attempts into v_attempts;
  if v_attempts > p_max_attempts then return query select null::uuid, null::text, null::timestamptz, null::text, true; return; end if;
  insert into public.submissions as inserted(reference,first_name,middle_name,last_name,suffix,full_name,email,oec_number,gender,category,philippine_address,province,region,employer,position,jobsite,contact_number,departure_date,details,issued_at,expires_at,receipt_token_hash,receipt_token_ciphertext,request_id,consented_at,consent_version)
    values ('OEC-' || extract(year from now())::text || '-' || upper(encode(gen_random_bytes(5),'hex')), trim(p_first_name), trim(coalesce(p_middle_name,'')), trim(p_last_name), trim(coalesce(p_suffix,'')), trim(p_full_name), lower(trim(p_email)), trim(p_oec_number), trim(p_gender), trim(p_category), trim(p_philippine_address), trim(p_province), trim(p_region), trim(p_employer), trim(p_position), trim(p_jobsite), trim(p_contact_number), p_departure_date, p_details, p_issued_at, p_expires_at, p_receipt_token_hash, p_receipt_token_ciphertext, p_request_id, now(), 'oec-privacy-v1')
    returning inserted.id, inserted.reference, inserted.expires_at, inserted.receipt_token_ciphertext into v_id, v_reference, v_expires, v_cipher;
  insert into public.submission_requests(request_id) values (p_request_id);
  insert into public.audit_logs(action,submission_id,metadata) values ('submission_created',v_id,jsonb_build_object('channel','public'));
  insert into public.email_deliveries(submission_id,kind) values (v_id,'initial');
  return query select v_id, v_reference, v_expires, v_cipher, false;
end $$;
revoke all on function public.create_public_submission(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,timestamptz,timestamptz,text,text,text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.create_public_submission(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,timestamptz,timestamptz,text,text,text,text,integer,integer) to service_role;

create or replace function public.transition_submission(p_submission_id uuid, p_status public.submission_status, p_actor uuid, p_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$ declare v_id uuid;
begin
  if not exists (select 1 from profiles where id=p_actor and active=true and role in ('evaluator','admin')) then raise exception 'not_authorized'; end if;
  if p_status = 'rejected' and nullif(trim(coalesce(p_reason,'')), '') is null then raise exception 'reason_required'; end if;
  if p_status = 'revoked' and nullif(trim(coalesce(p_reason,'')), '') is null then raise exception 'reason_required'; end if;
  update submissions set status=p_status, decision_reason=nullif(trim(p_reason),''), decided_by=p_actor, decided_at=now() where id=p_submission_id and status = case when p_status='revoked' then 'verified'::submission_status else 'pending'::submission_status end returning id into v_id;
  if v_id is null then raise exception 'already_decided'; end if;
  insert into public.audit_logs(actor_id,action,submission_id,metadata) values (p_actor, p_status::text, v_id, jsonb_build_object('result','success'));
  insert into public.email_deliveries(submission_id,kind) values (v_id,'decision_' || p_status::text) on conflict (submission_id,kind) do update set status='pending', available_at=now(), last_error_code=null where public.email_deliveries.status in ('failed','pending');
  return v_id;
end $$;
revoke all on function public.transition_submission(uuid,public.submission_status,uuid,text) from public, anon, authenticated;
grant execute on function public.transition_submission(uuid,public.submission_status,uuid,text) to service_role;

-- A sending row is reclaimable only after the caller-configured lease; the same
-- delivery id produces the same Message-ID, limiting duplicate sends after a crash.
create or replace function public.claim_email_delivery(p_submission_id uuid, p_kind text, p_lease_seconds integer)
returns table(delivery_id uuid, claim_token uuid, recipient text, reference text, expires_at timestamptz, submission_status public.submission_status, receipt_token_ciphertext text, full_name text, evaluator_name text, decision_reason text, decided_at timestamptz, jobsite text)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_token uuid;
begin
  select e.id into v_id from public.email_deliveries e join public.submissions s on s.id=e.submission_id
    where e.submission_id=p_submission_id and e.kind=p_kind and ((e.status in ('pending','failed') and e.available_at <= now()) or (e.status='sending' and e.locked_at <= now() - make_interval(secs => greatest(p_lease_seconds,60))))
      and (p_kind <> 'resend' or (s.status='verified' and s.expires_at > now())) for update of e skip locked limit 1;
  if v_id is null then return; end if;
  update public.email_deliveries as claimed set status='sending',locked_at=now(),attempts=attempts+1,claim_token=gen_random_uuid() where claimed.id=v_id returning claimed.claim_token into v_token;
  return query select e.id, e.claim_token, s.email, s.reference, s.expires_at, s.status, s.receipt_token_ciphertext, s.full_name, p.display_name, s.decision_reason, s.decided_at, s.jobsite from public.email_deliveries e join public.submissions s on s.id=e.submission_id left join public.profiles p on p.id=s.decided_by where e.id=v_id;
end $$;
revoke all on function public.claim_email_delivery(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.claim_email_delivery(uuid,text,integer) to service_role;

create or replace function public.complete_email_delivery(p_delivery_id uuid, p_claim_token uuid, p_success boolean, p_error_code text default null)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_success then update public.email_deliveries set status='sent',sent_at=now(),locked_at=null,last_error_code=null where id=p_delivery_id and claim_token=p_claim_token and status='sending';
  else update public.email_deliveries set status='failed',available_at=now()+interval '5 minutes',locked_at=null,last_error_code=case when p_error_code ~ '^[a-z_]{1,50}$' then p_error_code else 'delivery_failed' end where id=p_delivery_id and claim_token=p_claim_token and status='sending'; end if;
  return found;
end $$;
revoke all on function public.complete_email_delivery(uuid,uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.complete_email_delivery(uuid,uuid,boolean,text) to service_role;

create or replace function public.request_email_resend(p_submission_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_status public.submission_status; v_expires timestamptz; v_state text;
begin
  select status, expires_at into v_status, v_expires from public.submissions where id=p_submission_id for update;
  if v_status is null or v_status <> 'verified' or v_expires <= now() then return false; end if;
  insert into public.email_deliveries(submission_id,kind,status,available_at) values (p_submission_id,'resend','pending',now()) on conflict (submission_id,kind) do update set status='pending',available_at=now(),last_error_code=null where public.email_deliveries.status in ('sent','failed','pending');
  return true;
end $$;
revoke all on function public.request_email_resend(uuid) from public, anon, authenticated;
grant execute on function public.request_email_resend(uuid) to service_role;
