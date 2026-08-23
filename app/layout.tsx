import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Söderort F16",
  description: "Intern coachapp för KIF Söderort F16",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
