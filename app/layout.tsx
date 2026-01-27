import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import WhatsAppContactsModal from "@/components/whatsapp-contacts-modal";

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const SITE_URL = "https://casaensueno-catalogue.vercel.app";

// URL única para favicon y OG image
const SHARED_IMAGE =
  "https://jgxqopmrwuxyfirpvbhz.supabase.co/storage/v1/object/public/casaensueno%20files/logo.jpg";

export const metadata: Metadata = {
  title: "Catálogo de Productos - Hogar y Decoración",
  description:
    "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
  metadataBase: new URL(SITE_URL),

  icons: {
    icon: SHARED_IMAGE,
    shortcut: SHARED_IMAGE,
    apple: SHARED_IMAGE,
  },

  openGraph: {
    title: "Catálogo de Productos - Hogar y Decoración",
    description:
      "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
    url: SITE_URL,
    siteName: "Casa en Sueño (Catálogo)",
    images: [
      {
        url: SHARED_IMAGE,
        width: 1200,
        height: 630,
        alt: "Casa en Sueño - Miniatura del catálogo",
        type: "image/jpeg",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Catálogo de Productos - Hogar y Decoración",
    description:
      "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
    images: [SHARED_IMAGE],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>

        <WhatsAppContactsModal />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
