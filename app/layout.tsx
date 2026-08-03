import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { FetchInterceptorProvider } from "@/providers/fetch-interceptor";

export const metadata: Metadata = {
  title: "Aetheria ERP - Next-Gen Student Information System",
  description: "Enterprise grade administration, attendance, billing, and progress metrics for modern schools and universities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="light" storageKey="school-erp-theme">
          <ToastProvider>
            <FetchInterceptorProvider>
              {children}
            </FetchInterceptorProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
