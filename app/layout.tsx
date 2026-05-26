import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { FavoritesProvider } from "@/lib/favorites";
import { PageVisibilityProvider } from "@/lib/page-visibility";
import { DataModeProvider } from "@/lib/data-mode";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventVenue.Asia | Find & Book Premium Event Venues in Southeast Asia",
  description:
    "Discover top-rated event venues across Southeast Asia. Compare, book, and host your perfect event with verified halal options.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <DataModeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <PageVisibilityProvider>{children}</PageVisibilityProvider>
            </FavoritesProvider>
          </AuthProvider>
        </DataModeProvider>
      </body>
    </html>
  );
}
