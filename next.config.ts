import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ứng dụng gần như trang nào cũng phụ thuộc phiên đăng nhập và CSDL, nên dùng mô hình
  // render theo từng request (không bật Cache Components) cho đơn giản.
  // Xem node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
