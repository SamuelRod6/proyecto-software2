import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const apiTarget = env.VITE_API_TARGET || "http://localhost:8080";
    const shouldRewrite = apiTarget.endsWith("/api");
    const rewrite = shouldRewrite
        ? (path) => path.replace(/^\/api/, "")
        : undefined;

    return {
        plugins: [react()],
        server: {
            proxy: {
                "/api": {
                    target: apiTarget,
                    changeOrigin: true,
                    rewrite,
                },
            },
        },
    };
});
