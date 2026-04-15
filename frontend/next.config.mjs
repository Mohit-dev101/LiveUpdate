/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.API_PROXY_TARGET;

if (!apiProxyTarget) {
  throw new Error("Missing required environment variable: API_PROXY_TARGET");
}

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget.replace(/\/$/, "")}/:path*`
      }
    ];
  }
};

export default nextConfig;
