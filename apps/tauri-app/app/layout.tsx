import "./globals.css";
import { GlobalProviders } from "./providers/global";
import { Oswald } from "next/font/google";
import { cn } from "../src/lib/utils";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", oswald.variable)}>
      <body>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}