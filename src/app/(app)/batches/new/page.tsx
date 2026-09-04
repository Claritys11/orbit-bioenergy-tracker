import { CanteenRegisterForm } from "@/components/canteen-register-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/services/authz";

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ containerId?: string }>;
}) {
  const user = await requireUser("create_waste_record");
  const { containerId: preselectedContainerId } = await searchParams;

  const [containers, sources, categories] = await Promise.all([
    user.organisationId
      ? prisma.wasteContainer.findMany({
          where: { organisationId: user.organisationId, isActive: true },
          include: { source: true, category: true },
          orderBy: { containerCode: "asc" },
        })
      : [],
    user.organisationId
      ? prisma.wasteSource.findMany({ where: { organisationId: user.organisationId } })
      : prisma.wasteSource.findMany(),
    prisma.feedstockCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Register Waste Container"
        description="Mark your assigned reusable organic drum ready for school pickup. Calibrated weighing and contamination inspection will be performed at the Community Facility."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Waste Batches", href: "/batches" },
          { label: "Register Container" },
        ]}
      />
      <CanteenRegisterForm
        containers={containers}
        sources={sources}
        categories={categories}
        preselectedContainerId={preselectedContainerId}
      />
    </div>
  );
}
