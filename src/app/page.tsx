import { HeroSlideshow } from "@/components/layout/hero-slideshow";
import { Navbar } from "@/components/layout/navbar";
import { EquipmentCategories } from "@/components/equipment/equipment-categories";
import { CustomerReviews } from "@/components/equipment/customer-reviews";
import { FeaturedEquipment } from "@/components/equipment/featured-equipment";
import { WhyChooseUs } from "@/components/equipment/why-choose-us";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSlideshow />
        <FeaturedEquipment />
        <EquipmentCategories />
        <WhyChooseUs />
        <CustomerReviews />
      </main>
    </>
  );
}
