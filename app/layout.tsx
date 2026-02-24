import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Woke Business",
  description: "Interactive dashboard for UTD-24 business-journal woke_score analysis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
