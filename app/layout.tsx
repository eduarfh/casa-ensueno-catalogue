import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

// Fuentes (next/font/google)
const _geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const SITE_URL = "https://casaensueno-catalogue.vercel.app"

// URL de la imagen que quieres usar para OpenGraph / favicon.
// La usamos con encodeURI para evitar problemas por espacios/caracteres.
const SHARED_OG_IMAGE = encodeURI(
  "https://jgxqopmrwuxyfirpvbhz.supabase.co/storage/v1/object/public/casaensueno%20files/logo%20con%20fondo%20recortado%20baja%20calidad%20(1).jpg"
)

export const metadata: Metadata = {
  title: "Catálogo de Productos - Hogar y Decoración",
  description:
    "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
  metadataBase: new URL(SITE_URL),
  // favicon / icons (usa la misma imagen como favicon)
  icons: {
    icon: SHARED_OG_IMAGE,
    shortcut: SHARED_OG_IMAGE,
    apple: SHARED_OG_IMAGE,
  },
  openGraph: {
    title: "Catálogo de Productos - Hogar y Decoración",
    description:
      "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
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
    description:
      "Descubre nuestro amplio catálogo de útiles para el hogar y decoración con los mejores precios",
    images: [SHARED_OG_IMAGE],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script inicial para aplicar tema desde localStorage antes de que React hidrate */}
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
      </head>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          {/* ThemeProvider controla el tema (usa atributo class para dark mode) */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>

        {/* Componentes persistentes */}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
