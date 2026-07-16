-- Add all submission fields needed for rich email receipt templates
-- so sendReceiptEmail can render full applicant details in styled HTML.

drop function if exists public.claim_email_delivery(uuid,text,integer);

create or replace function public.claim_email_delivery(p_submission_id uuid,p_kind text,p_lease_seconds integer)
returns table(
  delivery_id uuid,
  claim_token uuid,
  recipient text,
  reference text,
  expires_at timestamptz,
  submission_status public.submission_status,
  receipt_token_ciphertext text,
  full_name text,
  evaluator_name text,
  decision_reason text,
  decided_at timestamptz,
  jobsite text,
  -- new rich receipt fields
  oec_number text,
  issued_at timestamptz,
  first_name text,
  middle_name text,
  last_name text,
  suffix text,
  employer text,
  "position" text,
  gender text,
  category text,
  philippine_address text,
  province text,
  region text,
  contact_number text,
  departure_date date,
  details text,
  created_at timestamptz,
  consented_at timestamptz
)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_token uuid;
begin
  select e.id into v_id from public.email_deliveries e join public.submissions s on s.id=e.submission_id
    where e.submission_id=p_submission_id and e.kind=p_kind
      and ((e.status in('pending','failed') and e.available_at<=now()) or (e.status='sending' and e.locked_at<=now()-make_interval(secs=>greatest(p_lease_seconds,60))))
      and (p_kind<>'resend' or (s.status='verified' and s.expires_at>now()))
    for update of e skip locked limit 1;
  if v_id is null then return; end if;
  update public.email_deliveries as claimed
    set status='sending',locked_at=now(),attempts=attempts+1,claim_token=gen_random_uuid()
    where claimed.id=v_id
    returning claimed.claim_token into v_token;
  return query select
    e.id,e.claim_token,
    s.email,s.reference,s.expires_at,s.status,s.receipt_token_ciphertext,s.full_name,
    p.display_name,s.decision_reason,s.decided_at,s.jobsite,
    -- rich receipt fields
    s.oec_number,s.issued_at,
    s.first_name,s.middle_name,s.last_name,s.suffix,
    s.employer,s."position",
    s.gender,s.category,
    s.philippine_address,s.province,s.region,
    s.contact_number,s.departure_date,s.details,
    s.created_at,s.consented_at
  from public.email_deliveries e
    join public.submissions s on s.id=e.submission_id
    left join public.profiles p on p.id=s.decided_by
  where e.id=v_id;
end $$;
revoke all on function public.claim_email_delivery(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.claim_email_delivery(uuid,text,integer) to service_role;
