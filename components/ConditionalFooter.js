"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

const HIDDEN_ON = ["/login", "/signup"];

export default function ConditionalFooter() {
  const pathname = usePathname();

  const shouldHide = HIDDEN_ON.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (shouldHide) return null;

  return <Footer />;
}