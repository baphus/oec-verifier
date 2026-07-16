-- Allow evaluators to soft-delete (discard) submissions.
-- Discarding is a terminal status transition from 'pending' that removes the
-- submission from the active evaluator workflow while preserving the row and
-- its audit trail.

alter type public.submission_status add value if not exists 'discarded';

-- Extend transition_submission to accept the new 'discarded' status.
-- Only a 'pending' submission may be discarded, and no email is queued for it.
create or replace function public.transition_submission(p_submission_id uuid, p_status public.submission_status, p_actor uuid, p_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$ declare v_id uuid;
begin
  if not exists (select 1 from profiles where id=p_actor and active=true and role in ('evaluator','admin')) then raise exception 'not_authorized'; end if;
  if p_status = 'rejected' and nullif(trim(coalesce(p_reason,'')), '') is null then raise exception 'reason_required'; end if;
  if p_status = 'revoked' and nullif(trim(coalesce(p_reason,'')), '') is null then raise exception 'reason_required'; end if;
  update submissions set status=p_status, decision_reason=nullif(trim(p_reason),''), decided_by=p_actor, decided_at=now() where id=p_submission_id and status = case when p_status='revoked' then 'verified'::submission_status else 'pending'::submission_status end returning id into v_id;
  if v_id is null then raise exception 'already_decided'; end if;
  insert into public.audit_logs(actor_id,action,submission_id,metadata) values (p_actor, p_status::text, v_id, jsonb_build_object('result','success'));
  if p_status <> 'discarded' then
    insert into public.email_deliveries(submission_id,kind) values (v_id,'decision_' || p_status::text) on conflict (submission_id,kind) do update set status='pending', available_at=now(), last_error_code=null where public.email_deliveries.status in ('failed','pending');
  end if;
  return v_id;
end $$;
revoke all on function public.transition_submission(uuid,public.submission_status,uuid,text) from public, anon, authenticated;
grant execute on function public.transition_submission(uuid,public.submission_status,uuid,text) to service_role;
