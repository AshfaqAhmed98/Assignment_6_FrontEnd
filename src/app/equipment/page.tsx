import Image from "next/image";
import { featuredEquipment } from "@/data/featured-equipment";

export default function EquipmentPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e96a32]">
          Browse by project
        </p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-950">
          All Equipment
        </h1>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredEquipment.map((item) => (
            <article
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              key={item.id}
            >
              <div className="relative h-48">
                <Image
                  alt={item.name}
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  src={item.image}
                />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold">{item.name}</h2>
                <p className="mt-3 text-sm text-slate-500">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
