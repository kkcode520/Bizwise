import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizWise",
  description: "AI business card capture and conversation prep assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
