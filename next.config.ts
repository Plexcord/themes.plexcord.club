import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
    async rewrites() {
        // the theme list is served at both /themes and /api/themes
        return [{ source: "/themes", destination: "/api/themes" }];
    }
};

export default nextConfig;
