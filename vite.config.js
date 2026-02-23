import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import Sitemap from "vite-plugin-sitemap";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler", { target: "18" }]]
        }
      }),
      Sitemap({
        generateRobotsTxt: false,
        hostname: "https://eaglercraft2ck.pages.dev"
        
      })
    ],
    server: {
      proxy: {
        "/api/cloudflare": {
          target: "https://api.cloudflare.com/client/v4",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cloudflare/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const token = env.CF_API_TOKEN;
              if (token) {
                proxyReq.setHeader("Authorization", `Bearer ${token}`);
              }
            });
          }
        }
      }
    }
  };
});
