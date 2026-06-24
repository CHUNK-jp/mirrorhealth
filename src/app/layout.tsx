import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MirrorHealth — プライベートAI健康分析",
  description: "あなたの健康データを、あなたのデバイスだけで、AIが分析します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <nav className="site-nav">
          <div className="nav-breadcrumb">
            <a href="https://chunk-jp.github.io/">CHUNK-jp</a>
            <span className="sep">/</span>
            <span className="current">mirrorhealth</span>
          </div>
          <div className="nav-actions">
            <a className="nav-btn" href="https://chunk-jp.github.io/">
              ← CHUNK-jp Portal
            </a>
            <a className="nav-btn" href="https://github.com/CHUNK-jp/mirrorhealth">
              ⎆ GitHub
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
