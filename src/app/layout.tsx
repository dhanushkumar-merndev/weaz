import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import SmoothScroll from "@/components/SmoothScroll";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { WebinarExperience } from "@/components/weaz/WebinarExperience";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.weaztech.com"),
  title: {
    default: "WEAZ TECH | Digital Entrepreneurship & AI",
    template: "%s | WEAZ TECH",
  },
  description:
    "Learn. Build. Grow. Lead with AI. Real skills, real mentors, real outcomes. A community of tech-savvy founders and operators shaping India's AI-first economy.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "WEAZ TECH",
    title: "WEAZ TECH | Digital Entrepreneurship & AI",
    description:
      "Learn. Build. Grow. Lead with AI through practical skills, mentors and real projects.",
    url: "/",
    images: [
      {
        url: "/images/team-collaboration.jpg",
        alt: "WEAZ TECH digital entrepreneurship and AI community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WEAZ TECH | Digital Entrepreneurship & AI",
    description:
      "Practical digital entrepreneurship and AI education for India's next generation of builders.",
    images: ["/images/team-collaboration.jpg"],
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
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="bg-[#0F0B14] text-white antialiased" suppressHydrationWarning>
        <SmoothScroll>
          <QueryProvider>
            <AuthProvider>
              <WebinarExperience />
              {children}
            </AuthProvider>
          </QueryProvider>
        </SmoothScroll>
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
