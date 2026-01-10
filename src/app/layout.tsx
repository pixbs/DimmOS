import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Actor from "@/components/organisms/actor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grid Desktop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Actor
          type={{ actorType: "shortcut", title: "Works", icon: "computer" }}
        />
        <Actor
          type={{ actorType: "shortcut", title: "Services", icon: "folder" }}
        />
        <Actor
          type={{ actorType: "shortcut", title: "Contact", icon: "mail" }}
        />
        <Actor type={{ actorType: "dimm" }} />
      </body>
    </html>
  );
}
