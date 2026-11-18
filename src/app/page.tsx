import { HeroSlideshow } from "@/components/layout/hero-slideshow";
import { Navbar } from "@/components/layout/navbar";
import { FeaturedEquipment } from "@/components/equipment/featured-equipment";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSlideshow />
        <FeaturedEquipment />
      </main>
    </>
  );
}
