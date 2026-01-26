// app/layout.tsx
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

// URL exacta que proporcionaste (contiene espacios y paréntesis)
const SHARED_OG_IMAGE_RAW =
  "https://jgxqopmrwuxyfirpvbhz.supabase.co/storage/v1/object/public/casaensueno%20files/logo%20con%20fondo%20recortado%20baja%20calidad%20(1).jpg";

// Codificada para uso seguro en atributos HTML
const SHARED_OG_IMAGE = encodeURI(SHARED_OG_IMAGE_RAW);

// Usamos la misma imagen como favicon (puedes cambiar a una versión recortada si la tienes)
const FAVICON_URL = SHARED_OG_IMAGE;

export const metadata: Metadata = {
  title: "Catálogo de Productos - Hogar y Decoración",
  description: "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: FAVICON_URL,
    shortcut: FAVICON_URL,
    apple: FAVICON_URL,
  },
  openGraph: {
    title: "Catálogo de Productos - Hogar y Decoración",
    description: "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
    url: SITE_URL,
    siteName: "Casa en Sueño (Catálogo)",
    images: [
      {
        url: SHARED_OG_IMAGE,
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
    description: "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
    images: [SHARED_OG_IMAGE],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
        {/* Metatags redundantes para scrapers / algunos bots que no respetan metadata exportada */}
        <meta property="og:image" content={SHARED_OG_IMAGE} />
        <meta property="og:image:secure_url" content={SHARED_OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={SHARED_OG_IMAGE} />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href={FAVICON_URL} />
        <link rel="icon" type="image/png" sizes="16x16" href={FAVICON_URL} />
        <link rel="apple-touch-icon" sizes="180x180" href={FAVICON_URL} />
        <link rel="shortcut icon" href={FAVICON_URL} />
        <meta name="theme-color" content="#ffffff" />
      </head>

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
