// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ES Explorer – Compstore Menu",
  description: "Browse Elasticsearch compstore_menu_latest index",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f6f8" }}>
        {children}
      </body>
    </html>
  );
}
