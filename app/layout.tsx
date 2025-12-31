import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import SEOStructuredData from "@/components/SEOStructuredData";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clienzo - Best Client Manager Software for Freelancers & Agencies",
  description: "Clienzo is the ultimate client management tool for freelancers and agencies. Manage clients, projects, payments, and deadlines all in one place. Free client manager software with Pro features.",
  keywords: [
    "client manager",
    "client management software",
    "client management tool",
    "freelancer client manager",
    "agency client management",
    "project management",
    "client tracking",
    "payment tracking",
    "client database",
    "CRM for freelancers",
    "client management system",
    "clienzo",
    "client manager app",
    "freelance client manager",
    "small business client manager"
  ],
  authors: [{ name: "Clienzo" }],
  creator: "Appsetz",
  publisher: "Clienzo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clienzo.com",
    siteName: "Clienzo",
    title: "Clienzo - Best Client Manager Software for Freelancers & Agencies",
    description: "Manage clients, projects, payments, and deadlines all in one place. Free client manager software with Pro features for freelancers and agencies.",
    images: [
      {
        url: "/images/logo-symbol.png",
        width: 1200,
        height: 630,
        alt: "Clienzo - Client Management Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clienzo - Best Client Manager Software",
    description: "Manage clients, projects, payments, and deadlines all in one place. Free client manager software with Pro features.",
    images: ["/images/logo-symbol.png"],
  },
  alternates: {
    canonical: "https://clienzo.com",
  },
  icons: {
    icon: [
      { url: "/images/logo-symbol.png", sizes: "64x64", type: "image/png" },
      { url: "/images/logo-symbol.png", sizes: "48x48", type: "image/png" },
      { url: "/images/logo-symbol.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo-symbol.png", sizes: "180x180", type: "image/png" },
      { url: "/images/logo-symbol.png", sizes: "152x152", type: "image/png" },
      { url: "/images/logo-symbol.png", sizes: "120x120", type: "image/png" },
    ],
    shortcut: "/images/logo-symbol.png",
  },
  manifest: "/manifest.json",
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <SEOStructuredData />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
