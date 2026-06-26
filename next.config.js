/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'oaidalleapiprodscus.blob.core.windows.net',
      'images.printify.com',
      'storage.googleapis.com',
    ],
  },
}

module.exports = nextConfig
