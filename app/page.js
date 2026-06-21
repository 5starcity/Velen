import Hero           from "@/components/home/Hero";
import HowItWorks     from "@/components/home/HowItWorks";
import FeaturedListings from "@/components/home/FeaturedListings";
import Categories     from "@/components/home/Categories";
import SchoolFilter   from "@/components/home/SchoolFilter";
import Testimonial    from "@/components/home/Testimonial";
import LandlordCTA    from "@/components/home/LandlordCTA";

export const metadata = {
  title: "Rezidence — Student housing in Port Harcourt",
  description:
    "Find verified student accommodation near RSU, UniPort, IAUE and KSU. No agent fees. Full costs upfront.",
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <FeaturedListings />
      <Categories />
      <SchoolFilter />
      <Testimonial />
      <LandlordCTA />
    </main>
  );
}