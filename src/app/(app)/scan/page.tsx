import { ContainerReceiver } from "@/components/container-receiver";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/services/authz";

export default async function ScanPage() {
  await requireUser("receive_container");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Receive Container"
        description="Receive incoming organic waste containers delivered from schools. Identify container codes to queue batches for calibrated weighing and inspection."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Receive Container" },
        ]}
      />
      <ContainerReceiver />
    </div>
  );
}
