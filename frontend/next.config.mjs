import { config } from "dotenv";
config({ path: ".env", quiet: true });
export default {
  output: "export",
  trailingSlash: true,
  devIndicators: false,
  env: {
    SITE_URL: process.env.SITE_URL || "https://downloadvideo.id.vn",
    BRAND_NAME: process.env.BRAND_NAME || "TubeGo",
  },
};
