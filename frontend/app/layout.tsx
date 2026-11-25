import type { Metadata } from "next";
import type { ReactNode } from "react";
import { brand, origin } from "./site";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "./style.css";
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <header>
          <div className="bar">
            <a className="logo" href="/" aria-label={brand + " — Trang chủ"}>
              <img src="/favicon.svg" width="37" height="37" alt="" />
              <span>
                {brand === "TubeGo" ? (
                  <>
                    Tube<b>Go</b>
                  </>
                ) : (
                  brand
                )}
              </span>
            </a>
            <nav aria-label="Điều hướng chính">
              <a href="/#cach-su-dung">Cách sử dụng</a>
              <a href="/#chat-luong">Chất lượng tải</a>
              <a href="/#cau-hoi">Câu hỏi thường gặp</a>
            </nav>
          </div>
        </header>
        {children}
        <footer>
          <div>
            <strong>{brand}</strong>
            <a href="/quyen-rieng-tu/">Quyền riêng tư</a>
            <a href="/dieu-khoan/">Điều khoản sử dụng</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
