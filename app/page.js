import Hero           from "@/components/home/Hero";
import FeaturedListings from "@/components/home/FeaturedListings";


export const metadata = {
  title: "Rezidence — Student housing in Port Harcourt",
  description:
    "Find verified student accommodation near RSU, UniPort, IAUE and KSU. No agent fees. Full costs upfront.",
};

export default function HomePage() {
  return (
    <main>
      <Hero />
         <FeaturedListings />
   
    </main>
  );
}