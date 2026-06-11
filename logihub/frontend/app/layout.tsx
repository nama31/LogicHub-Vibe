import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogiHub — Управление доставкой",
  description: "Система управления заказами и доставкой",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className="h-full bg-background text-foreground antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-geist-sans: "Geist", sans-serif;
            --font-geist-mono: "Geist Mono", monospace;
          }
          body {
            font-family: var(--font-geist-sans);
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
