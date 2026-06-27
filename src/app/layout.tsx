import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dump - Photo Gallery",
  description:
    "A curated photo gallery with Pinterest-style albums. Browse and explore beautiful collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-gray-950 text-white">
        <div className="flex-1 flex flex-col">{children}</div>

        <footer className="border-t border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Dump. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
