-- Additive upgrade for installations that ran 202607150001_foundation.sql before
-- the full OFW and delivery contract was introduced. It is safe to run after the
-- current foundation too; all schema additions are guarded.
alter table public.submissions add column if not exists first_name text;
alter table public.submissions add column if not exists middle_name text not null default '';
alter table public.submissions add column if not exists last_name text;
alter table public.submissions add column if not exists suffix text not null default '';
alter table public.submissions add column if not exists gender text;
alter table public.submissions add column if not exists category text;
alter table public.submissions add column if not exists philippine_address text;
alter table public.submissions add column if not exists province text;
alter table public.submissions add column if not exists region text;
alter table public.submissions add column if not exists jobsite text;
alter table public.submissions add column if not exists contact_number text;
alter table public.submissions add column if not exists departure_date date;
alter table public.submissions add column if not exists details text not null default '';
alter table public.submissions add column if not exists receipt_token_ciphertext text;
alter table public.submissions add column if not exists request_id uuid;
alter table public.submissions add column if not exists consented_at timestamptz;
alter table public.submissions add column if not exists consent_version text;
create unique index if not exists submissions_request_id_idx on public.submissions(request_id) where request_id is not null;
create table if not exists public.submission_requests (request_id uuid primary key, created_at timestamptz not null default now());
insert into public.submission_requests(request_id,created_at) select s.request_id,coalesce(s.created_at,now()) from public.submissions s where s.request_id is not null on conflict(request_id) do nothing;
create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions(id) on delete cascade,
  kind text not null check (kind in ('initial','decision_verified','decision_rejected','decision_revoked','resend')), status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0, available_at timestamptz not null default now(), locked_at timestamptz, claim_token uuid not null default gen_random_uuid(), sent_at timestamptz,
  last_error_code text, created_at timestamptz not null default now(), unique(submission_id,kind)
);
alter table public.email_deliveries add column if not exists claim_token uuid not null default gen_random_uuid();
alter table public.email_deliveries drop constraint if exists email_deliveries_kind_check;
delete from public.email_deliveries legacy using public.submissions s where legacy.submission_id=s.id and legacy.kind='decision' and exists(select 1 from public.email_deliveries existing where existing.submission_id=s.id and existing.kind=case when s.status='rejected' then 'decision_rejected' else 'decision_verified' end);
update public.email_deliveries e set kind=case when s.status='rejected' then 'decision_rejected' else 'decision_verified' end from public.submissions s where e.submission_id=s.id and e.kind='decision';
alter table public.email_deliveries add constraint email_deliveries_kind_check check (kind in ('initial','decision_verified','decision_rejected','decision_revoked','resend'));
insert into public.email_deliveries(submission_id,kind,status) select s.id,'decision_revoked','pending' from public.submissions s where s.status='revoked' and not exists(select 1 from public.email_deliveries e where e.submission_id=s.id and e.kind='decision_revoked') on conflict(submission_id,kind) do nothing;
alter table public.submissions enable row level security;
alter table public.submission_requests enable row level security;
alter table public.email_deliveries enable row level security;
revoke all on public.submission_requests, public.email_deliveries from anon, authenticated;

-- Remove the pre-hardening callable overload so old callers cannot bypass required fields.
drop function if exists public.create_public_submission(uuid,text,text,text,text,text,timestamptz,timestamptz,text,text,text,text,integer,integer);

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
  select s.id,s.reference,s.expires_at,s.receipt_token_ciphertext into v_id,v_reference,v_expires,v_cipher from public.submissions as s where s.request_id=p_request_id;
  if v_id is not null then return query select v_id,v_reference,v_expires,v_cipher,true; return; end if;
  if p_request_id is null or p_first_name is null or char_length(trim(p_first_name)) not between 1 and 80 or p_last_name is null or char_length(trim(p_last_name)) not between 1 and 80
    or p_full_name is null or char_length(trim(p_full_name)) not between 1 and 150 or p_email is null or char_length(trim(p_email)) not between 3 and 254
    or p_oec_number is null or p_oec_number !~ '^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$' or p_gender is null or char_length(trim(p_gender)) not between 1 and 40
    or p_category is null or char_length(trim(p_category)) not between 1 and 100 or p_philippine_address is null or char_length(trim(p_philippine_address)) not between 1 and 300
    or p_province is null or char_length(trim(p_province)) not between 1 and 100 or p_region is null or char_length(trim(p_region)) not between 1 and 100
    or p_employer is null or char_length(trim(p_employer)) not between 1 and 200 or p_position is null or char_length(trim(p_position)) not between 1 and 150
    or p_jobsite is null or char_length(trim(p_jobsite)) not between 1 and 200 or p_contact_number is null or char_length(trim(p_contact_number)) not between 1 and 40
    or p_departure_date is null or p_details is null or char_length(p_details)>2000 or p_expires_at<=p_issued_at or p_receipt_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_submission'; end if;
  v_bucket := date_trunc('minute',now())-(extract(minute from now())::integer%greatest(p_window_minutes,1))*interval '1 minute';
  insert into public.rate_limit_buckets(key_hash,bucket_start,attempts) values(p_ip_key_hash,v_bucket,1) on conflict(key_hash,bucket_start) do update set attempts=public.rate_limit_buckets.attempts+1 returning attempts into v_attempts;
  if v_attempts>p_max_attempts then return query select null::uuid,null::text,null::timestamptz,null::text,true; return; end if;
  insert into public.rate_limit_buckets(key_hash,bucket_start,attempts) values(p_email_key_hash,v_bucket,1) on conflict(key_hash,bucket_start) do update set attempts=public.rate_limit_buckets.attempts+1 returning attempts into v_attempts;
  if v_attempts>p_max_attempts then return query select null::uuid,null::text,null::timestamptz,null::text,true; return; end if;
  insert into public.submissions as inserted(reference,first_name,middle_name,last_name,suffix,full_name,email,oec_number,gender,category,philippine_address,province,region,employer,position,jobsite,contact_number,departure_date,details,issued_at,expires_at,receipt_token_hash,receipt_token_ciphertext,request_id,consented_at,consent_version)
  values('OEC-'||extract(year from now())::text||'-'||upper(encode(gen_random_bytes(5),'hex')),trim(p_first_name),trim(coalesce(p_middle_name,'')),trim(p_last_name),trim(coalesce(p_suffix,'')),trim(p_full_name),lower(trim(p_email)),trim(p_oec_number),trim(p_gender),trim(p_category),trim(p_philippine_address),trim(p_province),trim(p_region),trim(p_employer),trim(p_position),trim(p_jobsite),trim(p_contact_number),p_departure_date,p_details,p_issued_at,p_expires_at,p_receipt_token_hash,p_receipt_token_ciphertext,p_request_id,now(),'oec-privacy-v1')
  returning inserted.id,inserted.reference,inserted.expires_at,inserted.receipt_token_ciphertext into v_id,v_reference,v_expires,v_cipher;
  insert into public.submission_requests(request_id) values(p_request_id);
  insert into public.audit_logs(action,submission_id,metadata) values('submission_created',v_id,jsonb_build_object('channel','public'));
  insert into public.email_deliveries(submission_id,kind) values(v_id,'initial');
  return query select v_id,v_reference,v_expires,v_cipher,false;
end $$;
revoke all on function public.create_public_submission(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,timestamptz,timestamptz,text,text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.create_public_submission(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,timestamptz,timestamptz,text,text,text,text,integer,integer) to service_role;

create or replace function public.transition_submission(p_submission_id uuid, p_status public.submission_status, p_actor uuid, p_reason text default null)
returns uuid language plpgsql security definer set search_path=public as $$ declare v_id uuid;
begin
  if not exists(select 1 from public.profiles where id=p_actor and active=true and role in('evaluator','admin')) then raise exception 'not_authorized'; end if;
  if p_status in('rejected','revoked') and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'reason_required'; end if;
  update public.submissions set status=p_status,decision_reason=nullif(trim(p_reason),''),decided_by=p_actor,decided_at=now() where id=p_submission_id and status=case when p_status='revoked' then 'verified'::public.submission_status else 'pending'::public.submission_status end returning id into v_id;
  if v_id is null then raise exception 'already_decided'; end if;
  insert into public.audit_logs(actor_id,action,submission_id,metadata) values(p_actor,p_status::text,v_id,jsonb_build_object('result','success'));
  insert into public.email_deliveries(submission_id,kind) values(v_id,'decision_' || p_status::text) on conflict(submission_id,kind) do update set status='pending',available_at=now(),last_error_code=null where public.email_deliveries.status in('failed','pending');
  return v_id;
end $$;
revoke all on function public.transition_submission(uuid,public.submission_status,uuid,text) from public,anon,authenticated;
grant execute on function public.transition_submission(uuid,public.submission_status,uuid,text) to service_role;

drop function if exists public.claim_email_delivery(uuid,text,integer);
create or replace function public.claim_email_delivery(p_submission_id uuid,p_kind text,p_lease_seconds integer)
returns table(delivery_id uuid,claim_token uuid,recipient text,reference text,expires_at timestamptz,submission_status public.submission_status,receipt_token_ciphertext text,full_name text,evaluator_name text,decision_reason text,decided_at timestamptz,jobsite text)
language plpgsql security definer set search_path=public as $$ declare v_id uuid; v_token uuid;
begin
  select e.id into v_id from public.email_deliveries e join public.submissions s on s.id=e.submission_id where e.submission_id=p_submission_id and e.kind=p_kind and((e.status in('pending','failed') and e.available_at<=now()) or(e.status='sending' and e.locked_at<=now()-make_interval(secs=>greatest(p_lease_seconds,60)))) and(p_kind<>'resend' or(s.status='verified' and s.expires_at>now())) for update of e skip locked limit 1;
  if v_id is null then return; end if;
  update public.email_deliveries as claimed set status='sending',locked_at=now(),attempts=attempts+1,claim_token=gen_random_uuid() where claimed.id=v_id returning claimed.claim_token into v_token;
  return query select e.id,e.claim_token,s.email,s.reference,s.expires_at,s.status,s.receipt_token_ciphertext,s.full_name,p.display_name,s.decision_reason,s.decided_at,s.jobsite from public.email_deliveries e join public.submissions s on s.id=e.submission_id left join public.profiles p on p.id=s.decided_by where e.id=v_id;
end $$;
revoke all on function public.claim_email_delivery(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.claim_email_delivery(uuid,text,integer) to service_role;

create or replace function public.complete_email_delivery(p_delivery_id uuid,p_claim_token uuid,p_success boolean,p_error_code text default null)
returns boolean language plpgsql security definer set search_path=public as $$ begin
  if p_success then update public.email_deliveries set status='sent',sent_at=now(),locked_at=null,last_error_code=null where id=p_delivery_id and claim_token=p_claim_token and status='sending';
  else update public.email_deliveries set status='failed',available_at=now()+interval '5 minutes',locked_at=null,last_error_code=case when p_error_code~'^[a-z_]{1,50}$' then p_error_code else 'delivery_failed' end where id=p_delivery_id and claim_token=p_claim_token and status='sending'; end if; return found; end $$;
revoke all on function public.complete_email_delivery(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.complete_email_delivery(uuid,uuid,boolean,text) to service_role;

create or replace function public.request_email_resend(p_submission_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$ declare v_status public.submission_status; v_expires timestamptz;
begin select status,expires_at into v_status,v_expires from public.submissions where id=p_submission_id for update; if v_status is null or v_status<>'verified' or v_expires<=now() then return false; end if;
  insert into public.email_deliveries(submission_id,kind,status,available_at) values(p_submission_id,'resend','pending',now()) on conflict(submission_id,kind) do update set status='pending',available_at=now(),last_error_code=null where public.email_deliveries.status in('sent','failed','pending'); return true; end $$;
revoke all on function public.request_email_resend(uuid) from public,anon,authenticated;
grant execute on function public.request_email_resend(uuid) to service_role;
