import { Card, LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/services/authz";

const steps = [
  "Confirm organisation membership and role",
  "Review feedstock categories and demo yield assumptions",
  "Create or inspect the first QR waste batch",
  "Finalise allocation only after verified gas exists",
];

export default async function OnboardingPage() {
  const user = await requireUser();
  return (
    <div className="grid gap-6">
      <PageHeader title="Onboarding" description="A quick operational checklist for the current demo role." />
      <Card>
        <h2 className="text-lg font-bold">Welcome, {user.name}</h2>
        <ol className="mt-4 grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="rounded-md border border-slate-200 p-3 text-sm">
              <span className="font-semibold text-teal-800">{index + 1}. </span>{step}
            </li>
          ))}
        </ol>
        <LinkButton href="/dashboard" className="mt-5">Continue to dashboard</LinkButton>
      </Card>
    </div>
  );
}
