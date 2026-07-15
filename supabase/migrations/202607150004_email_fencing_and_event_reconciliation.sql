-- Final additive hardening for deployments that may already have 001-003.
-- A legacy generic decision event is conservatively treated as the original
-- verification/rejection event. It is never allowed to satisfy revocation.
alter table public.email_deliveries add column if not exists claim_token uuid not null default gen_random_uuid();
alter table public.email_deliveries drop constraint if exists email_deliveries_kind_check;
delete from public.email_deliveries legacy using public.submissions s where legacy.submission_id=s.id and legacy.kind='decision_revoked' and s.status='revoked' and legacy.created_at <= s.decided_at and exists(select 1 from public.email_deliveries existing where existing.submission_id=s.id and existing.kind='decision_verified');
update public.email_deliveries e set kind=case when s.status='rejected' then 'decision_rejected' else 'decision_verified' end
from public.submissions s where e.submission_id=s.id and e.kind='decision';
-- Rows incorrectly converted by the earlier migration are restored as the
-- original verification event when they predate the revocation decision.
update public.email_deliveries e set kind='decision_verified',last_error_code='legacy_reconciled'
from public.submissions s where e.submission_id=s.id and s.status='revoked' and e.kind='decision_revoked' and e.created_at <= s.decided_at;
alter table public.email_deliveries add constraint email_deliveries_kind_check check (kind in ('initial','decision_verified','decision_rejected','decision_revoked','resend'));
insert into public.email_deliveries(submission_id,kind,status) select s.id,'decision_revoked','pending' from public.submissions s where s.status='revoked' and not exists (select 1 from public.email_deliveries e where e.submission_id=s.id and e.kind='decision_revoked') on conflict(submission_id,kind) do nothing;

drop function if exists public.claim_email_delivery(uuid,text);
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

drop function if exists public.complete_email_delivery(uuid,boolean,text);
create or replace function public.complete_email_delivery(p_delivery_id uuid,p_claim_token uuid,p_success boolean,p_error_code text default null)
returns boolean language plpgsql security definer set search_path=public as $$ begin
  if p_success then update public.email_deliveries set status='sent',sent_at=now(),locked_at=null,last_error_code=null where id=p_delivery_id and claim_token=p_claim_token and status='sending';
  else update public.email_deliveries set status='failed',available_at=now()+interval '5 minutes',locked_at=null,last_error_code=case when p_error_code~'^[a-z_]{1,50}$' then p_error_code else 'delivery_failed' end where id=p_delivery_id and claim_token=p_claim_token and status='sending'; end if; return found; end $$;
revoke all on function public.complete_email_delivery(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.complete_email_delivery(uuid,uuid,boolean,text) to service_role;
