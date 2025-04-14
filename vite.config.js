import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glsl from "vite-plugin-glsl";

const ipad = "https://3b66f11f-5ac2-4200-974b-db06f6b6af14-00-2rki8cl3adao7.worf.replit.dev" 
const pc = "http://127.0.0.1:5000"

export default defineConfig({
  plugins: [react(), glsl()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target:
          ipad,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
