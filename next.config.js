/** @type {import('next').NextConfig} */
const isPagesBuild = process.env.NEXT_EXPORT === "true" || process.env.GITHUB_ACTIONS === "true";
const repoName = (process.env.GITHUB_REPOSITORY || "").split("/")[1] || "woke-business";
const basePath = isPagesBuild ? `/${repoName}` : "";

const nextConfig = {
  reactStrictMode: true,
  output: isPagesBuild ? "export" : undefined,
  trailingSlash: isPagesBuild,
  images: {
    unoptimized: isPagesBuild
  },
  basePath,
  assetPrefix: basePath || undefined
};

module.exports = nextConfig;
