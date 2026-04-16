/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse pulls in pdfjs-dist; bundling it for the App Router breaks at import time
  // ("Object.defineProperty called on non-object") and the route returns HTML 500 pages.
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  },
}

module.exports = nextConfig

