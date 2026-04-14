import type { Metadata } from "next";
import { Cairo, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ThemeProvider } from "@/components/theme-provider";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Toaster } from "sonner";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "منصة حجز الدورات",
  description: "منصة شاملة لحجز وإدارة الدورات التدريبية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${notoSansMono.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <NavbarWrapper />
              {children}
              <Toaster richColors position="bottom-right" />
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
