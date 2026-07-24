// lib/addonServices.js
// Flat, global add-on catalog — same price on every listing.
// v2: this can move to Firestore if you want per-listing pricing or admin editing.

export const ADDON_SERVICES = [
    {
      id: "home_cleaning",
      name: "Home cleaning",
      description: "Before you move in",
      price: 15000,
    },
    {
      id: "welcome_package",
      name: "Welcome package",
      description: "Essentials for your first night",
      price: 8000,
    },
  ];
  
  export function getAddonById(id) {
    return ADDON_SERVICES.find((a) => a.id === id) || null;
  }
  
  // Always resolve prices from this file server-side — never trust
  // a price sent from the client or read back from Paystack metadata.
  export function resolveAddons(ids = []) {
    return ids.map((id) => getAddonById(id)).filter(Boolean);
  }
  
  export function calculateAddonsTotal(ids = []) {
    return resolveAddons(ids).reduce((sum, a) => sum + a.price, 0);
  }