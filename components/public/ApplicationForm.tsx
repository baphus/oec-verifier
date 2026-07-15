"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPublicApplication } from "@/lib/actions/submissions";
import { PRIVACY_CONSENT_VERSION } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Errors = Record<string, string>;
const required = ["email", "lastName", "firstName", "gender", "category", "philippineAddress", "province", "region", "position", "jobsite", "contactNumber", "oecNumber", "departureDate", "employer"];
const labels: Record<string, string> = { email: "Email address", lastName: "Surname", firstName: "First name", gender: "Gender", category: "Application category", philippineAddress: "Full Philippine address", province: "Province", region: "Region", position: "OEC job position", jobsite: "Jobsite / destination", contactNumber: "International contact", oecNumber: "OEC number", departureDate: "Departure date", employer: "Employer or recruitment agency" };

function newRequestId() { return globalThis.crypto?.randomUUID?.() ?? ""; }

export default function ApplicationForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => { const timer = window.setTimeout(() => setRequestId(newRequestId()), 0); return () => window.clearTimeout(timer); }, []);

  function validate(data: FormData) {
    const next: Errors = {};
    required.forEach((name) => { if (!String(data.get(name) || "").trim()) next[name] = `${labels[name]} is required.`; });
    if (data.get("email") && !/^\S+@\S+\.\S+$/.test(String(data.get("email")))) next.email = "Enter a valid email address.";
    if (data.get("oecNumber") && !/^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$/.test(String(data.get("oecNumber")))) next.oecNumber = "Enter a valid OEC number.";
    if (!data.get("consent")) next.consent = "Consent is required to submit your application.";
    return next;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("requestId", requestId);
    const fullName = [data.get("firstName"), data.get("middleName"), data.get("lastName"), data.get("suffix")].map(String).map((value) => value.trim()).filter(Boolean).join(" ");
    data.set("fullName", fullName);
    const next = validate(data);
    setErrors(next); setFormError("");
    if (Object.keys(next).length || !requestId) { if (!requestId) setFormError("Please wait a moment and try again."); return; }
    startTransition(async () => {
      const toastId = "public-application-submit";
      toast.loading("Submitting your application…", { id: toastId });
      try {
        const result = await submitPublicApplication(data);
        if ("referenceNumber" in result && result.referenceNumber) {
          toast.dismiss(toastId);
          setRequestId(newRequestId());
          router.push(result.emailWarning ? "/apply/success?emailWarning=1" : "/apply/success");
        } else {
          toast.error("We could not submit your application.", { id: toastId });
          setFormError(result.error || "We could not submit your application. Please try again."); setErrors(result.fieldErrors || {});
        }
      } catch {
        toast.error("We could not submit your application. Please try again.", { id: toastId });
        setFormError("We could not submit your application. Please try again.");
      }
    });
  }

  return <form className="application-form" onSubmit={onSubmit} noValidate aria-describedby={formError ? "form-error" : undefined}>
    <input type="hidden" name="requestId" value={requestId} />
    <div className="form-intro"><span>APPLICATION DETAILS</span><span>STEP 1 OF 1</span></div>{Object.keys(errors).length > 0 && <ErrorSummary errors={errors} />}
    <div className="form-grid">
      <Field name="email" label="Email address" type="email" autoComplete="email" error={errors.email} />
      <Field name="lastName" label="Surname" autoComplete="family-name" error={errors.lastName} />
      <Field name="firstName" label="First name" autoComplete="given-name" error={errors.firstName} />
      <Field name="middleName" label="Middle name" autoComplete="additional-name" error={errors.middleName} optional />
      <SelectField name="gender" label="Gender" error={errors.gender} options={["Female", "Male", "Prefer not to say"]} />
      <SelectField name="category" label="Application category" error={errors.category} options={["New application", "Renewal", "Update"]} />
      <Field name="philippineAddress" label="Full Philippine address" error={errors.philippineAddress} wide />
      <Field name="province" label="Province" error={errors.province} />
      <Field name="region" label="Region" error={errors.region} />
      <Field name="employer" label="Employer or recruitment agency" error={errors.employer} wide />
      <Field name="position" label="OEC job position" error={errors.position} />
      <Field name="jobsite" label="Jobsite / destination" error={errors.jobsite} />
      <Field name="contactNumber" label="International contact" error={errors.contactNumber} wide />
      <Field name="oecNumber" label="OEC number" error={errors.oecNumber} wide />
      <Field name="departureDate" label="Departure date" type="date" error={errors.departureDate} />
      <div className="field field-wide"><Label htmlFor="details">Additional details <span className="optional">Optional</span></Label><Textarea id="details" name="details" rows={4} maxLength={2000} aria-invalid={!!errors.details} aria-describedby={errors.details ? "details-error" : undefined} />{errors.details && <p className="field-error" id="details-error" role="alert">{errors.details}</p>}</div>
    </div>
    <div className="consent-row"><Checkbox id="consent" name="consent" value={PRIVACY_CONSENT_VERSION} aria-invalid={!!errors.consent} aria-describedby="consent-copy consent-error" /><Label htmlFor="consent" id="consent-copy">I consent to OEC Verify using this information to review my application and contact me about it.</Label></div>
    {errors.consent && <p className="field-error" id="consent-error" role="alert">{errors.consent}</p>}
    {formError && <p className="form-error" id="form-error" role="alert">{formError}</p>}
    <div className="form-submit"><p>Your information is handled securely and is only used for this application.</p><Button type="submit" size="lg" disabled={isPending}>{isPending ? "Submitting…" : "Submit application"}<span aria-hidden="true">→</span></Button></div>
  </form>;
}

function Field({ name, label, type = "text", autoComplete, error, wide, optional }: { name: string; label: string; type?: string; autoComplete?: string; error?: string; wide?: boolean; optional?: boolean }) {
  return <div className={wide ? "field field-wide" : "field"}><Label htmlFor={name}>{label}{optional && <span className="optional">Optional</span>}{!optional && <span aria-hidden="true"> *</span>}</Label><Input id={name} name={name} type={type} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} />{error && <p className="field-error" id={`${name}-error`} role="alert">{error}</p>}</div>;
}

function SelectField({ name, label, options, error }: { name: string; label: string; options: string[]; error?: string }) {
  return <div className="field"><Label htmlFor={name}>{label}<span aria-hidden="true"> *</span></Label><Select name={name} defaultValue=""><SelectTrigger id={name} className="w-full" aria-invalid={!!error}><SelectValue placeholder="Select one" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem value={option} key={option}>{option}</SelectItem>)}</SelectContent></Select>{error && <p className="field-error" id={`${name}-error`} role="alert">{error}</p>}</div>;
}

function ErrorSummary({ errors }: { errors: Errors }) {
  return <Alert variant="destructive" className="my-5"><AlertTitle>Please check the highlighted fields.</AlertTitle><AlertDescription><ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#${field}`}>{labels[field] || (field === "consent" ? "Privacy consent" : field)}</a>: {message}</li>)}</ul></AlertDescription></Alert>;
}
