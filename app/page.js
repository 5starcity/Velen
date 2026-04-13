// app/page.js
import Hero from "@/components/home/Hero";
import FeaturedListings from "@/components/home/FeaturedListings";

export default function HomePage() {
    return (
        <>
            <Hero />
            <FeaturedListings />
        </>
    );
}