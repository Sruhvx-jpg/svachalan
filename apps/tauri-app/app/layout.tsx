import "./globals.css";
import { GlobalProviders } from "./providers/global";
import { Playfair_Display } from "next/font/google";
import { cn } from "../src/lib/utils";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", playfair.variable)}>
      <body>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}