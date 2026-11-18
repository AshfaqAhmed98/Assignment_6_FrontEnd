import { Suspense } from "react";
import EquipmentDetailsClient from "./equipment-details-client";

async function EquipmentDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EquipmentDetailsClient id={id} />;
}

export default function EquipmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-4">
          <p aria-live="polite" className="text-center text-slate-600">
            Loading equipment details...
          </p>
        </main>
      }
    >
      <EquipmentDetailsContent params={params} />
    </Suspense>
  );
}
