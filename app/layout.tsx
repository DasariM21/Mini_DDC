import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniDSP",
  description: "MiniDSP training project"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="stylesheet" href="https://lepide-design-system.vercel.app/v1/lepidus.css" />
      </head>
      <body>
        {children}
        <Script src="https://lepide-design-system.vercel.app/v1/lepidus.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
