import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Inter } from "next/font/google";

const inter = Inter({ display: "swap", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PowerApp - Chatbot Management Service",
  description: "Powerful chatbot management platform for creating, deploying, and managing intelligent conversational AI solutions.",
  keywords: ["chatbot", "AI", "automation", "customer service", "conversational AI", "bot management"],
  authors: [{ name: "PowerApp" }],
  creator: "PowerApp",
  publisher: "PowerApp",
  robots: "index, follow",
  icons: {
    icon: "/x-icon.png",
    apple: "/x-icon.png"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://powerapp.rynebenson.com",
    title: "PowerApp - Chatbot Management Service",
    description: "Powerful chatbot management platform for creating, deploying, and managing intelligent conversational AI solutions.",
    siteName: "PowerApp",
    images: [
      {
        url: "https://powerapp.rynebenson.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PowerApp - Chatbot Management Service"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "PowerApp - Chatbot Management Service",
    description: "Powerful chatbot management platform for creating, deploying, and managing intelligent conversational AI solutions.",
    images: ["/x-icon.png"]
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
