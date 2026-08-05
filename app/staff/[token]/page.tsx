import { notFound } from "next/navigation";
import { findStaffByAccessToken } from "@/lib/staff-access";
import StaffPortal from "./StaffPortal";

export const dynamic = "force-dynamic";

export default async function StaffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const staff = await findStaffByAccessToken(token);
  if (!staff) notFound();

  return <StaffPortal token={token} staffName={staff.name} tenantName={staff.tenant.name} />;
}
