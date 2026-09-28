import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    server: {
        port: 5174,
        host: true,
        proxy: {
            "/api": {
                target: process.env.VITE_API_PROXY_TARGET || "http://localhost:8080",
                changeOrigin: true,
            },
        },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { "@": resolve(import.meta.dirname, "src") },
    },
});
