import { QrScanner } from "@/components/qr-scanner";
import { PageHeader } from "@/components/ui";

export default function ScanPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="QR Scanner"
        description="Scan permitted ORBIT QR labels. Students see only safe traceability information and never gas-equipment instructions."
      />
      <QrScanner />
    </div>
  );
}
