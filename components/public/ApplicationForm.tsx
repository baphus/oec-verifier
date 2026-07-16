"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPublicApplication } from "@/lib/actions/submissions";
import { PRIVACY_CONSENT_VERSION } from "@/lib/types";
import { regions, provincesByRegion } from "@/lib/data/philippines";
import { jobsiteCountries } from "@/lib/data/countries";
import { commonPositions } from "@/lib/data/positions";
import { countryCodes } from "@/lib/data/country-codes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Errors = Record<string, string>;
const required = ["email", "lastName", "firstName", "middleName", "gender", "category", "philippineAddress", "province", "region", "position", "jobsite", "contactNumber", "oecNumber"];
const labels: Record<string, string> = {
  email: "Email",
  lastName: "SURNAME (LAST NAME)",
  firstName: "FIRST NAME",
  middleName: "MIDDLE NAME",
  gender: "GENDER",
  category: "CATEGORY",
  philippineAddress: "COMPLETE ADDRESS (IN THE PHILIPPINES)",
  province: "PROVINCE",
  region: "REGION",
  position: "POSITION (JOB POSITION IN OEC)",
  jobsite: "JOBSITE\n(DESTINATION)",
  contactNumber: "CONTACT NUMBER (+COUNTRY CODE)",
  oecNumber: "OEC NUMBER",
};
const categoryOptions = [
  "BALIK-MANGGAGAWA",
  "LANDBASED - AGENCY HIRE (ABOUT TO START WITH HIS / HER EMPLOYER)",
  "LANDBASED - DIRECT HIRE (ABOUT TO START WITH HIS / HER EMPLOYER)",
  "SEABASED (FOR SEAFARERS)",
] as const;

function newRequestId() { return globalThis.crypto?.randomUUID?.() ?? ""; }

export default function ApplicationForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedRegion, setSelectedRegion] = useState("");
  const router = useRouter();
  useEffect(() => { const timer = window.setTimeout(() => setRequestId(newRequestId()), 0); return () => window.clearTimeout(timer); }, []);

  function validate(data: FormData) {
    const next: Errors = {};
    required.forEach((name) => { if (!String(data.get(name) || "").trim()) next[name] = `${labels[name].replace("\n", " ")} is required.`; });
    if (data.get("email") && !/^\S+@\S+\.\S+$/.test(String(data.get("email")))) next.email = "Enter a valid email address.";
    if (data.get("oecNumber") && !/^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$/.test(String(data.get("oecNumber")))) next.oecNumber = "Enter a valid OEC number.";
    if (!data.get("consent")) next.consent = "Consent is required to submit your application.";
    return next;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("requestId", requestId);
    const fullName = [data.get("firstName"), data.get("middleName"), data.get("lastName")].map(String).map((value) => value.trim()).filter(Boolean).join(" ");
    data.set("fullName", fullName);
    // Concatenate country code + phone number into contactNumber
    const dialCode = countryCodes.find((c) => c.code === data.get("contactDialCode"))?.dial ?? "+63";
    const number = String(data.get("contactNumber") || "").trim();
    data.set("contactNumber", number ? `${dialCode}${number}` : "");
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
          router.push("/apply/success");
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
      <Field name="email" label="Email" type="email" autoComplete="email" error={errors.email} wide placeholder="This is a required question" />

      <Field name="lastName" label="SURNAME (LAST NAME)" autoComplete="family-name" error={errors.lastName} placeholder="This is a required question" />
      <Field name="firstName" label="FIRST NAME" autoComplete="given-name" error={errors.firstName} placeholder="This is a required question" />

      <Field name="middleName" label="MIDDLE NAME" autoComplete="additional-name" error={errors.middleName} placeholder="This is a required question" />
      <SelectField name="gender" label="GENDER" error={errors.gender} options={["MALE", "FEMALE"]} />

      <SelectField name="category" label="CATEGORY" error={errors.category} options={[...categoryOptions]} wide />

      <Field name="philippineAddress" label="COMPLETE ADDRESS (IN THE PHILIPPINES)" error={errors.philippineAddress} wide asTextarea placeholder="This is a required question" />

      <SelectField name="region" label="REGION" error={errors.region} options={[...regions]} onValueChange={setSelectedRegion} />
      <SelectField key={`province-${selectedRegion}`} name="province" label="PROVINCE" error={errors.province} options={selectedRegion ? [...(provincesByRegion[selectedRegion] ?? [])] : []} />

      <ComboBoxField name="position" label="POSITION (JOB POSITION IN OEC)" error={errors.position} options={[...commonPositions]} wide placeholder="This is a required question" />

      <JobsiteField error={errors.jobsite} />

      <PhoneField error={errors.contactNumber} />

      <Field name="oecNumber" label="OEC NUMBER" error={errors.oecNumber} wide placeholder="This is a required question" />
    </div>
    <div className="consent-row"><Checkbox id="consent" name="consent" value={PRIVACY_CONSENT_VERSION} aria-invalid={!!errors.consent} aria-describedby="consent-copy consent-error" /><Label htmlFor="consent" id="consent-copy">I consent to OEC Verify using this information to review my application and contact me about it.</Label></div>
    {errors.consent && <p className="field-error" id="consent-error" role="alert">{errors.consent}</p>}
    {formError && <p className="form-error" id="form-error" role="alert">{formError}</p>}
    <div className="form-submit"><p>Your information is handled securely and is only used for this application.</p><Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto">{isPending ? "Submitting…" : "Submit application"}<span aria-hidden="true">→</span></Button></div>
  </form>;
}

function Field({ name, label, type = "text", autoComplete, error, wide, placeholder, description, asTextarea }: {
  name: string; label: string; type?: string; autoComplete?: string; error?: string; wide?: boolean; placeholder?: string; description?: string; asTextarea?: boolean;
}) {
  const inputId = name;
  const descId = description ? `${name}-desc` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [errorId, descId].filter(Boolean).join(" ") || undefined;
  return <div className={wide ? "field field-wide" : "field"}>
    <Label htmlFor={inputId}>{label}<span aria-hidden="true"> *</span></Label>
    {asTextarea
      ? <Textarea id={inputId} name={name} rows={3} maxLength={300} aria-invalid={!!error} aria-describedby={describedBy} placeholder={placeholder} />
      : <Input id={inputId} name={name} type={type} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={describedBy} placeholder={placeholder} />}
    {description && <p className="field-hint" id={descId}>{description}</p>}
    {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
  </div>;
}

function SelectField({ name, label, options, error, wide, onValueChange }: { name: string; label: string; options: string[]; error?: string; wide?: boolean; onValueChange?: (value: string) => void }) {
  return <div className={wide ? "field field-wide" : "field"}>
    <Label htmlFor={name}>{label}<span aria-hidden="true"> *</span></Label>
    <Select name={name} defaultValue="" onValueChange={onValueChange}><SelectTrigger id={name} className="w-full" aria-invalid={!!error}><SelectValue placeholder={options.length ? "Select one" : "Select a region first"} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem value={option} key={option}>{option}</SelectItem>)}</SelectContent></Select>
    {error && <p className="field-error" id={`${name}-error`} role="alert">{error}</p>}
  </div>;
}

function ComboBoxField({ name, label, options, error, wide, placeholder }: {
  name: string; label: string; options: string[]; error?: string; wide?: boolean; placeholder?: string;
}) {
  const listId = `${name}-list`;
  return <div className={wide ? "field field-wide" : "field"}>
    <Label htmlFor={name}>{label}<span aria-hidden="true"> *</span></Label>
    <input id={name} name={name} list={listId} placeholder={placeholder}
      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} />
    <datalist id={listId}>{options.map((option) => <option value={option} key={option} />)}</datalist>
    {error && <p className="field-error" id={`${name}-error`} role="alert">{error}</p>}
  </div>;
}

function PhoneField({ error }: { error?: string }) {
  const [selected, setSelected] = useState("PH");
  const cc = countryCodes.find((c) => c.code === selected);
  const descId = "contactNumber-desc";
  const errorId = error ? "contactNumber-error" : undefined;
  return <div className="field field-wide">
    <Label htmlFor="contactDialCode">CONTACT NUMBER (+COUNTRY CODE)<span aria-hidden="true"> *</span></Label>
    <div className="phone-field-row">
      <Select name="contactDialCode" defaultValue="PH" onValueChange={setSelected}>
        <SelectTrigger id="contactDialCode" className="phone-code-trigger" aria-invalid={!!error}>
          <SelectValue>{cc?.flag} {cc?.dial}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((cc) => (
            <SelectItem value={cc.code} key={cc.code}>
              <span className="phone-option">{cc.flag} {cc.dial} <span className="phone-country-name">{cc.name}</span></span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input id="contactNumber" name="contactNumber" type="tel" placeholder="Phone number"
        className="phone-number-input" aria-invalid={!!error}
        aria-describedby={[errorId, descId].filter(Boolean).join(" ") || undefined} />
    </div>
    <p className="field-hint" id={descId}>Philippine or foreign numbers are accepted</p>
    {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
  </div>;
}

/** Build a country-name → flag emoji lookup from countryCodes data. */
function buildFlagLookup(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cc of countryCodes) {
    // Exact match by the full name in country-codes
    map[cc.name] = cc.flag;
    // Also index by the primary name before " / " (e.g. "United States / Canada" → "United States")
    const slashIdx = cc.name.indexOf(" / ");
    if (slashIdx > 0) map[cc.name.slice(0, slashIdx)] = cc.flag;
  }
  // Manual overrides / additions for entries that don't align with country-codes naming
  map["Worldwide"] = "🌐";
  map["Czech Republic"] = "🇨🇿";
  map["South Korea"] = "🇰🇷";
  map["United Kingdom"] = "🇬🇧";
  map["U.S. Virgin Islands"] = "🇻🇮";
  map["Ethiopia"] = "🇪🇹";
  map["Seychelles"] = "🇸🇨";
  map["Mauritius"] = "🇲🇺";
  map["Guam"] = "🇬🇺";
  map["Northern Mariana Islands"] = "🇲🇵";
  map["Cuba"] = "🇨🇺";
  map["Venezuela"] = "🇻🇪";
  return map;
}

const jobsiteFlags = buildFlagLookup();

function JobsiteField({ error }: { error?: string }) {
  const descId = "jobsite-desc";
  return <div className="field field-wide">
    <Label htmlFor="jobsite">JOBSITE (DESTINATION)<span aria-hidden="true"> *</span></Label>
    <Select name="jobsite" defaultValue="">
      <SelectTrigger id="jobsite" className="w-full" aria-invalid={!!error}>
        <SelectValue placeholder="Select one" />
      </SelectTrigger>
      <SelectContent>
        {jobsiteCountries.map((country) => (
          <SelectItem value={country} key={country}>
            <span className="phone-option">{jobsiteFlags[country] ?? ""} {country}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && <p className="field-error" id="jobsite-error" role="alert">{error}</p>}
  </div>;
}

function ErrorSummary({ errors }: { errors: Errors }) {
  return <Alert variant="destructive" className="my-5"><AlertTitle>Please check the highlighted fields.</AlertTitle><AlertDescription><ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#${field}`}>{labels[field] || (field === "consent" ? "Privacy consent" : field)}</a>: {message}</li>)}</ul></AlertDescription></Alert>;
}
