import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  // Firebase는 클라이언트 사이드에서만 사용 - SSR 번들에서 제외
  serverExternalPackages: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
};

export default nextConfig;
