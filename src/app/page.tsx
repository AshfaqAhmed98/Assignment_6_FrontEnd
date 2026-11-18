import { HeroSlideshow } from "@/components/layout/hero-slideshow";
import { Navbar } from "@/components/layout/navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSlideshow />
      </main>
    </>
  );
}
