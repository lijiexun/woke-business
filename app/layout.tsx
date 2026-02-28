import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Woke Business",
  description: "Interactive dashboard for UTD-24 business-journal woke_score analysis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mx-auto w-full max-w-[1600px] px-4 pb-4">
            <div className="panel text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600 p-3">
              Woke Business © {currentYear}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
