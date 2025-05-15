import { type ReactNode } from "react";
import { type Metadata } from "next";
import { Nunito, Roboto_Slab } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from "@/components/theme-provider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import "./globals.css";
import "./fonts.css";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
});

export const metadata: Metadata = {
  title: "FocusBrew | Productivity Workspace",
  description:
    "All-in-one digital workspace with todo lists, kanban boards, pomodoro timer, notes, ambient sounds, and more to boost your productivity.",
  metadataBase: new URL("https://focusbrew.vercel.app"),
  keywords: [
    "productivity",
    "workspace",
    "todo app",
    "kanban",
    "pomodoro",
    "notes",
    "focus timer",
    "ambient sounds",
  ],
  authors: [{ name: "FocusBrew" }],
  creator: "FocusBrew",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "FocusBrew | Productivity Workspace",
    description:
      "All-in-one digital workspace with todo lists, kanban boards, pomodoro timer, notes, ambient sounds, and more to boost your productivity.",
    siteName: "FocusBrew",
    images: [{ url: "/images/preview.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusBrew | Productivity Workspace",
    description:
      "All-in-one digital workspace with todo lists, kanban boards, pomodoro timer, notes, ambient sounds, and more to boost your productivity.",
    images: [{ url: "/images/preview.png" }],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: Readonly<RootLayoutProps>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${robotoSlab.variable} font-satoshi antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
