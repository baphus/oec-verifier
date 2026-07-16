import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OEC Verify | DMW",
    template: "%s | OEC Verify",
  },
  description:
    "Secure digital application intake and verification for overseas Filipino workers — Department of Migrant Workers",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://oec-verify.vercel.app"
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/dmw_logo.png", type: "image/png", sizes: "44x44" },
    ],
    apple: { url: "/dmw_logo.png", sizes: "44x44", type: "image/png" },
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "OEC Verify",
    title: "OEC Verify | DMW",
    description:
      "Secure digital application intake and verification for overseas Filipino workers — Department of Migrant Workers",
    images: [
      {
        url: "/dmw_logo.png",
        width: 44,
        height: 44,
        alt: "Department of Migrant Workers logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "OEC Verify | DMW",
    description:
      "Secure digital application intake and verification for overseas Filipino workers — Department of Migrant Workers",
    images: ["/dmw_logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('oec-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}<Toaster position="top-right" closeButton /></body>
    </html>
  );
}
