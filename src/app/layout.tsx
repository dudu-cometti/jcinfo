import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import {
  BUSINESS_CITY,
  BUSINESS_PHONE,
  BUSINESS_POSTAL_CODE,
  BUSINESS_STATE,
  GOOGLE_MAPS_URL,
  OPENING_HOURS,
  SERVICE_AREA,
} from "@/lib/business";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "JC Info";
const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - iPhone, Apple e eletrônicos em Colatina - ES`,
    template: `%s | ${siteName}`,
  },
  description:
    "iPhone novo e seminovo, Apple Watch, acessórios Apple, drones DJI e ar-condicionado em Colatina - ES. Garantia de 1 ano, até 18x no cartão e entrega em mãos na região. Compre e acumule pontos.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
  },
};

// MobilePhoneStore é um subtipo de LocalBusiness: liga o site ao Perfil da Empresa
// (via sameAs/hasMap) e repete os mesmos dados de NAP, área e horário do perfil.
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobilePhoneStore",
  "@id": `${siteUrl}/#business`,
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/logo.jpg`,
  image: `${siteUrl}/logo.jpg`,
  telephone: BUSINESS_PHONE,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: BUSINESS_CITY,
    addressRegion: BUSINESS_STATE,
    postalCode: BUSINESS_POSTAL_CODE,
    addressCountry: "BR",
  },
  areaServed: SERVICE_AREA.map((name) => ({ "@type": "City", name })),
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: OPENING_HOURS.days,
    opens: OPENING_HOURS.opens,
    closes: OPENING_HOURS.closes,
  },
  paymentAccepted: "Pix, Dinheiro, Cartão de crédito, Cartão de débito",
  hasMap: GOOGLE_MAPS_URL,
  sameAs: [GOOGLE_MAPS_URL],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/produtos?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
