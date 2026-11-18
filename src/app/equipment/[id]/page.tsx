import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { featuredEquipment } from "@/data/featured-equipment";

export default async function EquipmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = featuredEquipment.find((equipment) => equipment.id === id);

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-bold text-slate-600 hover:text-[#e96a32]"
          href="/"
        >
          ← Back to featured equipment
        </Link>
        <article className="mt-6 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
          <div className="relative min-h-72 md:min-h-[430px]">
            <Image
              alt={item.name}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              src={item.image}
            />
          </div>
          <div className="p-7 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e96a32]">
              {item.category}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-950">
              {item.name}
            </h1>
            <p className="mt-5 leading-7 text-slate-600">{item.description}</p>
            <p className="mt-7 text-sm text-slate-500">
              <span className="text-3xl font-extrabold text-slate-950">
                ৳{item.dailyRate.toLocaleString()}
              </span>
              <span className="ml-2">per day</span>
            </p>
            <button
              className="mt-8 h-12 rounded-md bg-[#e96a32] px-6 text-sm font-bold text-white transition-colors hover:bg-[#c94f1c]"
              type="button"
            >
              Request rental
            </button>
          </div>
        </article>
      </div>
    </main>
  );
}
