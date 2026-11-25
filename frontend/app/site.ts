export const brand = process.env.BRAND_NAME || "TubeGo";
export const origin = new URL(process.env.SITE_URL || "http://localhost:3000")
  .origin;
