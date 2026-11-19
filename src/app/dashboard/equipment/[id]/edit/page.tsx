import OwnerEquipmentForm from "../../owner-equipment-form";

export const instant = false;

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerEquipmentForm equipmentId={id} />;
}
