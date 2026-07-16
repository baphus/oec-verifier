import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const BLUE = "#093CA8";
const DARK = "#111827";
const GRAY = "#526174";
const LIGHT_GRAY = "#D8DFEB";
const MUTED = "#8896A8";

const styles = StyleSheet.create({
  page: {
    padding: "35 45",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
  },

  // ── header ──────────────────────────────────────
  header: {
    marginBottom: 6,
    borderBottom: `2 solid ${BLUE}`,
    paddingBottom: 10,
  },
  republic: {
    fontSize: 8,
    color: GRAY,
    textAlign: "center",
    marginBottom: 2,
  },
  dept: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    textAlign: "center",
    marginBottom: 2,
  },
  system: {
    fontSize: 6.5,
    color: BLUE,
    textAlign: "center",
    letterSpacing: 1,
  },

  // ── title ───────────────────────────────────────
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 6,
    color: DARK,
  },
  refLine: {
    fontSize: 8,
    color: GRAY,
    textAlign: "center",
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: "center",
    padding: "3 12",
    borderWidth: 1,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  // ── divider ─────────────────────────────────────
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_GRAY,
    marginVertical: 8,
  },

  // ── sections ────────────────────────────────────
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_GRAY,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "30%",
    fontSize: 6,
    color: MUTED,
    textTransform: "uppercase",
    paddingTop: 2,
  },
  value: {
    width: "70%",
    fontSize: 8.5,
    color: DARK,
    fontWeight: 600,
  },
  fullWidthField: {
    marginBottom: 4,
  },
  fullLabel: {
    fontSize: 6,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  fullValue: {
    fontSize: 8.5,
    color: DARK,
    fontWeight: 600,
  },

  // ── QR ──────────────────────────────────────────
  qrSection: {
    alignItems: "center",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
  },
  qrBox: {
    padding: 6,
    backgroundColor: "#F8F9FB",
    borderWidth: 0.5,
    borderColor: LIGHT_GRAY,
    marginBottom: 6,
  },
  qrLabel: {
    fontSize: 6.5,
    color: GRAY,
    textAlign: "center",
    marginBottom: 2,
  },
  qrUrl: {
    fontSize: 6,
    color: BLUE,
    textAlign: "center",
  },

  // ── footer ──────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 35,
    left: 45,
    right: 45,
    borderTopWidth: 1.5,
    borderTopColor: BLUE,
    paddingTop: 6,
    alignItems: "center",
  },
  footerDept: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    marginBottom: 2,
  },
  footerAddr: {
    fontSize: 6.5,
    color: GRAY,
    textAlign: "center",
    marginBottom: 1,
  },
});

// ── status colors ────────────────────────────────────
const STATUS: Record<string, { color: string; bg: string }> = {
  VALID: { color: "#146B3A", bg: "#E3F3EA" },
  EXPIRED: { color: "#765A00", bg: "#FFF6D5" },
  REVOKED: { color: "#B30B22", bg: "#FCE8EB" },
  INVALID: { color: "#B30B22", bg: "#FCE8EB" },
};

// ── data type ────────────────────────────────────────
export type ReceiptData = {
  referenceNumber?: string;
  state?: "valid" | "expired" | "revoked" | "invalid";
  issuedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  oecNumber?: string;
  email?: string;
  gender?: string;
  category?: string;
  philippineAddress?: string;
  province?: string;
  region?: string;
  position?: string;
  jobsite?: string;
  contactNumber?: string;
  departureDate?: string | null;
  decisionReason?: string | null;
  decidedAt?: string | null;
  qrCodeDataUrl?: string;
  verifyUrl?: string;
};

// ── helpers ──────────────────────────────────────────
const fmt = (value: string | undefined | null) => {
  if (!value) return "\u2014";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};

const safe = (val: string | undefined | null) =>
  val && val !== "N/A" ? val : "\u2014";

// ── components ───────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function FullField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fullWidthField}>
      <Text style={styles.fullLabel}>{label}</Text>
      <Text style={styles.fullValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ── document ─────────────────────────────────────────
export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const state = (data.state ?? "INVALID").toUpperCase();
  const knownState = ["VALID", "EXPIRED", "REVOKED"].includes(state) ? state : "INVALID";
  const sc = STATUS[knownState] ?? STATUS.INVALID;

  const displayName =
    data.fullName && data.fullName !== "N/A"
      ? data.fullName
      : [data.firstName, data.middleName, data.lastName, data.suffix]
          .filter(Boolean)
          .join(" ") || "\u2014";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* ── header ──────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.republic}>Republic of the Philippines</Text>
          <Text style={styles.dept}>Department of Migrant Workers</Text>
          <Text style={styles.system}>OEC VERIFY — SECURE APPLICATION INTAKE</Text>
        </View>

        {/* ── title ───────────────────────────────── */}
        <Text style={styles.title}>OFFICIAL OEC RECEIPT</Text>
        <Text style={styles.refLine}>Reference: {safe(data.referenceNumber)}</Text>

        {/* ── status badge ────────────────────────── */}
        <View style={[styles.statusBadge, { borderColor: sc.color, backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.color }]}>STATUS: {knownState}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── receipt info ────────────────────────── */}
        <Section title="Receipt Information">
          <Field label="Date Issued" value={fmt(data.issuedAt)} />
          <Field label="Valid Through" value={fmt(data.expiresAt)} />
          <Field label="Submitted At" value={fmt(data.submittedAt)} />
        </Section>

        {/* ── applicant info ──────────────────────── */}
        <Section title="Applicant Information">
          <FullField label="Full Name" value={displayName} />
          <Field label="OEC Number" value={safe(data.oecNumber)} />
          <Field label="Email" value={safe(data.email)} />
          <Field label="Contact No." value={safe(data.contactNumber)} />
          <Field label="Gender" value={safe(data.gender)} />
          <Field label="Category" value={safe(data.category)} />
          <Field label="Position" value={safe(data.position)} />
          <Field label="Jobsite" value={safe(data.jobsite)} />
          <FullField label="Philippine Address" value={safe(data.philippineAddress)} />
          <Field label="Province" value={safe(data.province)} />
          <Field label="Region" value={safe(data.region)} />
          <Field label="Departure Date" value={fmt(data.departureDate)} />
        </Section>

        {/* ── decision details ────────────────────── */}
        {(data.decidedAt || data.decisionReason) && (
          <Section title="Decision Details">
            {data.decidedAt && <Field label="Decision Date" value={fmt(data.decidedAt)} />}
            {data.decisionReason && <FullField label="Reason" value={data.decisionReason} />}
          </Section>
        )}

        {/* ── QR code ─────────────────────────────── */}
        {data.qrCodeDataUrl && (
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <Image src={data.qrCodeDataUrl} style={{ width: 80, height: 80 }} />
            </View>
            <Text style={styles.qrLabel}>Scan the QR code or visit this link to verify:</Text>
            <Text style={styles.qrUrl}>{data.verifyUrl}</Text>
          </View>
        )}

        {/* ── footer ──────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerDept}>Department of Migrant Workers</Text>
          <Text style={styles.footerAddr}>
            Blas F. Ople Building, Ortigas Avenue Corner Meralco Avenue, Pasig City, Metro Manila, Philippines
          </Text>
          <Text style={styles.footerAddr}>Tel: (02) 8721-0140  |  Website: www.dmw.gov.ph</Text>
        </View>

      </Page>
    </Document>
  );
}
