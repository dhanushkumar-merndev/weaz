export const SITE_URL = "https://www.weaztech.com";

export const WEAZ_ADDRESS = {
  streetAddress:
    "Embassy TechVillage, Outer Ring Road, near New Horizon College, Devarabisanahalli",
  addressLocality: "Bengaluru",
  addressRegion: "Karnataka",
  postalCode: "560103",
  addressCountry: "IN",
} as const;

export const WEAZ_ADDRESS_TEXT =
  "Embassy TechVillage, Outer Ring Road, near New Horizon College, Devarabisanahalli, Bengaluru, Karnataka 560103, India";

export const WEAZ_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  WEAZ_ADDRESS_TEXT
)}`;
