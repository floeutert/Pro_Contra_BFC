import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Buchholzer FC – Pro & Contra",
  description: "Pro- und Contra-Punkte für den Vorstand des Buchholzer FC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-brand-green text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Buchholzer FC</h1>
              <p className="text-green-200 text-sm">Vorstand · Pro &amp; Contra</p>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
