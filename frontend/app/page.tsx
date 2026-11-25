import { Film, Music2 } from "lucide-react";
import Tool from "./Tool";
import Guide from "./Guide";
import { brand, origin } from "./site";
const title = "Tải video YouTube MP4, chuyển MP3 trực tuyến | " + brand;
const description =
  "Dán link YouTube, kiểm tra chất lượng khả dụng và tải video MP4 hoặc âm thanh MP3. Hỗ trợ video thường và Shorts, không cần tài khoản.";
export const metadata = {
  title,
  description,
  alternates: { canonical: origin + "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: origin + "/",
    siteName: brand,
    title,
    description,
    images: [{ url: "/share.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/share.png"],
  },
};
export default function Home() {
  return (
    <main>
      <div className="hero">
        <div className="heroInner">
          <h1>
            Tải video YouTube <br />
            và chuyển sang <em>MP3</em>
          </h1>
          <p className="intro">
            Dán liên kết YouTube của video dưới 6 phút để tải MP4 hoặc MP3.
          </p>
          <Tool />
          <div className="formats">
            <span>
              <Film size={17} /> Video MP4
            </span>
            <i />
            <span>
              <Music2 size={17} /> Âm thanh MP3
            </span>
            <i />
            <span>Hỗ trợ Shorts</span>
          </div>
        </div>
      </div>
      <Guide />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: brand,
            url: origin + "/",
          }).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
