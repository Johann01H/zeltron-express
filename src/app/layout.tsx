import { Analytics } from "@vercel/analytics/next";
import { Archivo, Manrope } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteChrome } from "@/components/site-chrome";
import { RouteProgress } from "@/components/route-progress";
import { Footer } from "@/components/site-sections";
import { SITE_URL, STORE_NAME } from "@/lib/config";
import { getSiteIconUrl } from "@/lib/site-icon";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["700", "800"],
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
export async function generateMetadata(): Promise<Metadata> {
  // El favicon es el «Icono del sitio» de WordPress; se cambia desde el panel sin tocar código.
  const siteIcon = await getSiteIconUrl();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: "Inicio | ZELTRON Express", template: "%s" },
    description:
      "Compra tecnología, accesorios y gadgets con envío a toda Colombia y pago contra entrega.",
    openGraph: {
      title: "ZELTRON Express",
      description: "Tecnología útil que llega a tu puerta.",
    },
    ...(siteIcon && {
      icons: {
        icon: siteIcon,
        shortcut: siteIcon,
        apple: siteIcon,
      },
    }),
  };
}
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0E1A3A",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STORE_NAME,
    url: SITE_URL,
  };
  return (
    <html lang="es">
      <body className={`${archivo.variable} ${manrope.variable} antialiased`}>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {/* El header y el footer se ocultan en las pantallas de cuenta (ver STANDALONE_ROUTES). */}
        <Suspense fallback={<SiteHeader />}>
          <SiteChrome><SiteHeader /></SiteChrome>
        </Suspense>
        {children}
        <Suspense fallback={<Footer />}>
          <SiteChrome><Footer /></SiteChrome>
        </Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
        />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
