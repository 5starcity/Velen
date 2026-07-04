import { Suspense } from "react";
import ListingsClient from "./ListingsClient";

export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading listings...</div>}>
      <ListingsClient />
    </Suspense>
  );
}