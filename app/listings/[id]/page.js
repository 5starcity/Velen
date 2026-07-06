// app/listings/[id]/page.js
import ListingDetailClient from "./ListingDetailClient";
import { fetchListingByIdServer } from "@/lib/firestoreListings.server";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await fetchListingByIdServer(id);

  if (!listing) {
    return { title: "Listing Not Found" };
  }

  const title = `${listing.type || "Property"} in ${listing.location}`.trim();
  const description = `${listing.type || "Property"} in ${listing.location}, Port Harcourt. ₦${Number(listing.price).toLocaleString()}/year. ${listing.verified ? "Verified landlord. " : ""}No agent fees.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [listing.images?.[0] || listing.image || "/og-image.png"],
    },
    alternates: {
      canonical: `https://rezidence.ng/listings/${id}`,
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const listing = await fetchListingByIdServer(id);

  if (!listing) {
    return <ListingDetailClient initialListing={null} />;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description || `${listing.type} in ${listing.location}, Port Harcourt`,
    url: `https://rezidence.ng/listings/${id}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address || listing.location,
      addressLocality: "Port Harcourt",
      addressRegion: "Rivers State",
      addressCountry: "NG",
    },
    numberOfRooms: listing.beds || undefined,
    numberOfBathroomsTotal: listing.baths || undefined,
    image: listing.images?.length > 0 ? listing.images : listing.image ? [listing.image] : undefined,
    offers: {
      "@type": "Offer",
      price: Number(listing.price),
      priceCurrency: "NGN",
      availability:
        listing.availability === "Available Now"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      url: `https://rezidence.ng/listings/${id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetailClient initialListing={listing} />
    </>
  );
}