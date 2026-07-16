-- Remove employer parameter from create_public_submission.
-- Employer is no longer collected; the column still exists in submissions
-- (default 'N/A') for backward compatibility with existing rows.

create or replace function public.create_public_submission(
  p_request_id uuid, p_first_name text, p_middle_name text, p_last_name text, p_suffix text, p_full_name text, p_email text, p_oec_number text,
  p_gender text, p_category text, p_philippine_address text, p_province text, p_region text,
  p_position text, p_jobsite text,
  p_contact_number text, p_departure_date date, p_details text, p_issued_at timestamptz, p_expires_at timestamptz, p_receipt_token_hash text,
  p_receipt_token_ciphertext text, p_ip_key_hash text, p_email_key_hash text, p_max_attempts integer, p_window_minutes integer
) returns table (submission_id uuid, reference text, expires_at timestamptz, receipt_token_ciphertext text, was_existing boolean)
language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
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
    or p_region is null or char_length(trim(p_region)) not between 1 and 100
    or p_position is null or char_length(trim(p_position)) not between 1 and 150 or p_jobsite is null or char_length(trim(p_jobsite)) not between 1 and 200
    or p_contact_number is null or char_length(trim(p_contact_number)) not between 1 and 40 or p_departure_date is null or p_details is null or char_length(p_details) > 2000
    or p_expires_at <= p_issued_at or p_receipt_token_hash !~ '^[a-f0-9]{64}$' or p_receipt_token_ciphertext is null then raise exception 'invalid_submission'; end if;
  v_bucket := date_trunc('minute', now()) - (extract(minute from now())::integer % greatest(p_window_minutes, 1)) * interval '1 minute';
  insert into rate_limit_buckets(key_hash, bucket_start, attempts) values (p_ip_key_hash, v_bucket, 1) on conflict (key_hash,bucket_start) do update set attempts = rate_limit_buckets.attempts + 1 returning attempts into v_attempts;
  if v_attempts > p_max_attempts then return query select null::uuid, null::text, null::timestamptz, null::text, true; return; end if;
  insert into rate_limit_buckets(key_hash, bucket_start, attempts) values (p_email_key_hash, v_bucket, 1) on conflict (key_hash,bucket_start) do update set attempts = rate_limit_buckets.attempts + 1 returning attempts into v_attempts;
  if v_attempts > p_max_attempts then return query select null::uuid, null::text, null::timestamptz, null::text, true; return; end if;
  insert into public.submissions as inserted(reference,first_name,middle_name,last_name,suffix,full_name,email,oec_number,gender,category,philippine_address,province,region,employer,position,jobsite,contact_number,departure_date,details,issued_at,expires_at,receipt_token_hash,receipt_token_ciphertext,request_id,consented_at,consent_version)
    values ('OEC-' || extract(year from now())::text || '-' || upper(encode(gen_random_bytes(5),'hex')), trim(p_first_name), trim(coalesce(p_middle_name,'')), trim(p_last_name), trim(coalesce(p_suffix,'')), trim(p_full_name), lower(trim(p_email)), trim(p_oec_number), trim(p_gender), trim(p_category), trim(p_philippine_address), trim(p_province), trim(p_region), 'N/A', trim(p_position), trim(p_jobsite), trim(p_contact_number), p_departure_date, p_details, p_issued_at, p_expires_at, p_receipt_token_hash, p_receipt_token_ciphertext, p_request_id, now(), 'oec-privacy-v1')
    returning inserted.id, inserted.reference, inserted.expires_at, inserted.receipt_token_ciphertext into v_id, v_reference, v_expires, v_cipher;
  insert into public.submission_requests(request_id) values (p_request_id);
  insert into public.audit_logs(action,submission_id,metadata) values ('submission_created',v_id,jsonb_build_object('channel','public'));
  return query select v_id, v_reference, v_expires, v_cipher, false;
end $$;
revoke all on function public.create_public_submission(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,timestamptz,timestamptz,text,text,text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.create_public_submission(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,timestamptz,timestamptz,text,text,text,text,integer,integer) to service_role;
