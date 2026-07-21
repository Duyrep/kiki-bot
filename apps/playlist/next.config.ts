import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	transpilePackages: ["@rep/shared"],
	typescript: {
		ignoreBuildErrors: true,
	},
	devIndicators: false,
};

export default nextConfig;
