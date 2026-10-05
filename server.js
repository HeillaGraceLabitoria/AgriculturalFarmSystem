import http from "node:http"
import { handleApiRequest } from "./server/api.js"

const PORT = process.env.PORT || 3001

const server = http.createServer(async (req, res) => {
  if (req.url && req.url.startsWith("/api/")) {
    const handled = await handleApiRequest(req, res)
    if (handled) return
  }

  res.statusCode = 404
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify({ error: "Endpoint not found" }))
})

server.listen(PORT, () => {
  console.log(`Agricultural Farm System SQLite API running at http://localhost:${PORT}`)
})
