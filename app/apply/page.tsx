import { PageFrame } from "@/components/public/Shell";
import ApplicationForm from "@/components/public/ApplicationForm";

export default function ApplyPage() {
  return <PageFrame eyebrow="Public application" title="Start your application" intro="Tell us what we need to know. Fields marked with an asterisk are required."><ApplicationForm /></PageFrame>;
}
