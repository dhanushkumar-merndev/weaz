import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "WEAZ TECH | Digital Entrepreneurship & AI",
  description:
    "Learn. Build. Grow. Lead with AI. Real skills, real mentors, real outcomes. A community of tech-savvy founders and operators shaping India's AI-first economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0F0B14] text-white antialiased">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
