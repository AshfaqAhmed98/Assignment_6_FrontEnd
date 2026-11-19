import OwnerEquipmentDetailsClient from "../owner-equipment-details-client";

export const instant = false;

export default async function OwnerEquipmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerEquipmentDetailsClient id={id} />;
}
