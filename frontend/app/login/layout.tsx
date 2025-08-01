import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthContextProvider } from "@/context/auth-context";
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dentax",
  description: "Kinross Dental Clinic's all-in-one platform for streamlined appointment booking, intelligent patient management, and advanced DICOM image viewing — delivering precision and care through modern technology."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthContextProvider>
          {children}
              <Toaster position="top-center" />
        </AuthContextProvider>
      </body>
    </html>
  );
}
