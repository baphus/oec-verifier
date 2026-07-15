-- Additive upgrade for deployments that already applied 202607150002.
-- Safe after the current 001+002 sequence as well.
alter table public.email_deliveries drop constraint if exists email_deliveries_kind_check;
delete from public.email_deliveries legacy using public.submissions s where legacy.submission_id=s.id and legacy.kind='decision' and exists(select 1 from public.email_deliveries existing where existing.submission_id=s.id and existing.kind=case when s.status='rejected' then 'decision_rejected' else 'decision_verified' end);
update public.email_deliveries e set kind=case when s.status='rejected' then 'decision_rejected' else 'decision_verified' end from public.submissions s where e.submission_id=s.id and e.kind='decision';
alter table public.email_deliveries add constraint email_deliveries_kind_check check (kind in ('initial','decision_verified','decision_rejected','decision_revoked','resend'));
insert into public.email_deliveries(submission_id,kind,status) select s.id,'decision_revoked','pending' from public.submissions s where s.status='revoked' and not exists(select 1 from public.email_deliveries e where e.submission_id=s.id and e.kind='decision_revoked') on conflict(submission_id,kind) do nothing;

create or replace function public.transition_submission(p_submission_id uuid,p_status public.submission_status,p_actor uuid,p_reason text default null)
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

-- A sending row is reclaimable only after the caller-configured lease. The
-- application uses a stable delivery-id Message-ID across a reclaim.
drop function if exists public.claim_email_delivery(uuid,text);
drop function if exists public.claim_email_delivery(uuid,text,integer);
create or replace function public.claim_email_delivery(p_submission_id uuid,p_kind text,p_lease_seconds integer)
returns table(delivery_id uuid,recipient text,reference text,expires_at timestamptz,submission_status public.submission_status,receipt_token_ciphertext text,full_name text,evaluator_name text,decision_reason text,decided_at timestamptz,jobsite text)
language plpgsql security definer set search_path=public as $$ declare v_id uuid;
begin
  select e.id into v_id from public.email_deliveries e join public.submissions s on s.id=e.submission_id where e.submission_id=p_submission_id and e.kind=p_kind and((e.status in('pending','failed') and e.available_at<=now()) or(e.status='sending' and e.locked_at<=now()-make_interval(secs=>greatest(p_lease_seconds,60)))) and(p_kind<>'resend' or(s.status='verified' and s.expires_at>now())) for update of e skip locked limit 1;
  if v_id is null then return; end if;
  update public.email_deliveries set status='sending',locked_at=now(),attempts=attempts+1 where id=v_id;
  return query select e.id,s.email,s.reference,s.expires_at,s.status,s.receipt_token_ciphertext,s.full_name,p.display_name,s.decision_reason,s.decided_at,s.jobsite from public.email_deliveries e join public.submissions s on s.id=e.submission_id left join public.profiles p on p.id=s.decided_by where e.id=v_id;
end $$;
revoke all on function public.claim_email_delivery(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.claim_email_delivery(uuid,text,integer) to service_role;
