import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "СушиНин | Доставка суши, пиццы и сетов в г. Заволжье",
  description: "Официальный сайт службы доставки еды «СушиНин» в г. Заволжье. Премиальные роллы, горячая пицца, бургеры, паста и сеты. Бесплатная доставка от 700 ₽! Звоните: +7 (930) 818-40-40",
  keywords: ["СушиНин", "доставка Заволжье", "суши Заволжье", "пицца Заволжье", "роллы Заволжье", "еда Заволжье", "сеты"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-slate-900 text-slate-100 antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}