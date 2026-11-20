import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const themeBootstrap = `try {
  const isDark = localStorage.getItem("gearrent-theme") === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
} catch (error) {
  console.error("Could not load the saved theme preference:", error);
}`;

export const metadata: Metadata = {
  title: "GearRent",
  description: "Rent the equipment you need with GearRent.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
