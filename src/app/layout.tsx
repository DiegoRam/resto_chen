import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Resto Chen",
  description: "Restaurant ordering system",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <SonnerToaster 
          position="top-center"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)"
            }
          }}
        />
      </body>
    </html>
  );
}
