import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

// Inter có bộ chữ tiếng Việt; biến --font-sans được shadcn/ui và Tailwind dùng làm font mặc định.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "E-Learning",
    template: "%s · E-Learning",
  },
  description: "Ứng dụng học trực tuyến cho trung tâm đào tạo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full font-sans antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
