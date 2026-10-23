import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

function sqliteApiPlugin(): Plugin {
  return {
    name: "sqlite-api-middleware",
    apply: "serve", // Only active during local development (npm run dev)
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/")) {
          try {
            const { handleApiRequest } = await import("./server/api.js")
            const handled = await handleApiRequest(req, res)
            if (handled) return
          } catch (err: any) {
            console.error("SQLite API Error:", err)
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ error: err?.message || "Internal server error" }))
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sqliteApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})