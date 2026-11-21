import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/shared/ui/app-header";
import { AuthGate } from "@/shared/ui/auth-gate";
import { CoreKernelProvider } from "@/core";
import { ThemeProvider } from "@/shared/theme/theme-context";
import { LanguageProvider } from "@/shared/i18n/i18n-context";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuestLab",
  description:
    "Global adaptive practice platform for programming, physics, mathematics and more.",
};

const themeInitScript = `
  try {
    const theme = localStorage.getItem('questlab-theme');
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    const locale = localStorage.getItem('questlab-locale');
    if (locale) {
      document.documentElement.lang = locale;
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-150">
        <ThemeProvider>
          <LanguageProvider>
            <CoreKernelProvider>
              <AppHeader />
              <AuthGate>{children}</AuthGate>
            </CoreKernelProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
