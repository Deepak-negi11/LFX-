import type { NextConfig } from "next";

// Static site: `next build` writes plain HTML/CSS/JS to `out/`, which any static
// host (GitHub Pages, Netlify, Vercel, Cloudflare Pages) can serve.
// Set BASE_PATH=/repo-name when hosting under a sub-path such as GitHub Pages.
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
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
