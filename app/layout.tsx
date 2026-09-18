import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";
import { RootProviders } from "@/components/root-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Email Campaign Hub",
  description: "Manage email campaigns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-svh`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
