/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
        ],
    },
    webpack: (config, { isServer }) => {
        // حل مشكلة WebAssembly (WASM) السابقة
        config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
        config.module.rules.push({ test: /\.wasm$/, type: "webassembly/async" });

        // 🛡️ الحل الجذري لخطأ "Module not found: Can't resolve 'net'"
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                net: false,
                tls: false,
                fs: false,
                child_process: false,
                dns: false,
                path: false,
            };
        }

        return config;
    },
};

export default nextConfig;