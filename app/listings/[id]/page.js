// app/listings/[id]/page.js
import ListingDetailClient from "./ListingDetailClient";
import { fetchListingByIdServer } from "@/lib/firestoreListings.server";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await fetchListingByIdServer(id);

  if (!listing) {
    return { title: "Listing Not Found" };
  }

  const title = `${listing.beds || ""} Bedroom ${listing.type || "Property"} in ${listing.location}`.trim();
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
  return <ListingDetailClient initialListing={listing} />;
}