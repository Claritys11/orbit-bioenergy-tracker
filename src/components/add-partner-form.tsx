"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { createPartnerAction } from "@/app/actions";
import { Button, Card, Field, SelectField } from "@/components/ui";

export function AddPartnerForm() {
  const [state, formAction, isPending] = useActionState(createPartnerAction, null);

  return (
    <Card className="border-[var(--orbit-primary)]/20 bg-gradient-to-br from-white to-slate-50/80">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <UserPlus className="text-[var(--orbit-primary)]" size={20} />
        <h2 className="text-lg font-bold text-black">Register New Partner & User Account</h2>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Register newly partnered schools, community biogas hubs, operators, or vendor collectives. New partners will automatically appear on the public Partners page and Homepage.
      </p>

      <form action={formAction} className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Organisation Name" name="organisationName" required placeholder="e.g. SMA Negeri 3 Bandung" />

        <SelectField
          label="Organisation Type"
          name="organisationType"
          required
          options={[
            { value: "SCHOOL", label: "School (Sekolah)" },
            { value: "COMMUNITY_PARTNER", label: "Community Processing Partner (Mitra Komunitas Pengolah)" },
            { value: "OPERATOR", label: "Logistics Operator (Operator Penjemputan)" },
            { value: "SUPPORTING_CONTRIBUTOR", label: "Vendor / Market Collective (Mitra Pasar / Vendor)" },
          ]}
        />

        <Field label="User Full Name" name="userName" required placeholder="e.g. Dra. Endah Rahayu" />

        <Field label="User Email" name="email" type="email" required placeholder="e.g. endah@sman3bdg.sch.id" />

        <Field label="Initial Password" name="password" type="password" required defaultValue="OrbitDemo2026!" />

        <SelectField
          label="Assigned Role"
          name="role"
          required
          options={[
            { value: "SCHOOL_ADMIN", label: "SCHOOL_ADMIN (Kepala / Penanggung Jawab Sekolah)" },
            { value: "COMMUNITY_PARTNER", label: "COMMUNITY_PARTNER (Pengolah Organik & Biogas)" },
            { value: "OPERATOR", label: "OPERATOR (Petugas Penjemputan / Logistik)" },
            { value: "CANTEEN_STAFF", label: "CANTEEN_STAFF (Petugas Pemilah Kantin)" },
            { value: "STUDENT", label: "STUDENT (Siswa)" },
          ]}
        />

        {state?.error ? (
          <div className="md:col-span-2 rounded-md bg-red-50 p-3 text-xs font-semibold text-red-800">
            {state.error}
          </div>
        ) : null}

        {state?.success ? (
          <div className="md:col-span-2 rounded-md bg-[#00C972]/20 p-3 text-xs font-bold text-black ring-1 ring-[#00C972]">
            {state.message}
          </div>
        ) : null}

        <div className="md:col-span-2 flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Registering Partner..." : "Register Partner & User"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
