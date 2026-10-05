import { db, initDatabase } from "./db.js"

// Ensure database is initialized
initDatabase()

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(data))
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
    })
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
  const pathname = url.pathname
  const method = req.method

  // Enable CORS for local dev
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return true
  }

  // 1. Auth: POST /api/auth/login
  if (pathname === "/api/auth/login" && method === "POST") {
    const { email, password } = await parseJsonBody(req)
    if (!email || !password) {
      sendJson(res, 400, { error: "Email and password are required" })
      return true
    }

    const user = db.prepare("SELECT id, name, email, role, password FROM users WHERE email = ?").get(email.trim().toLowerCase())
    if (!user || user.password !== password) {
      sendJson(res, 401, { error: "Invalid email or password" })
      return true
    }

    sendJson(res, 200, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: `local-session-token-${user.id}-${Date.now()}`,
    })
    return true
  }

  // 2. Stats: GET /api/stats
  if (pathname === "/api/stats" && method === "GET") {
    const totalFarms = db.prepare("SELECT COUNT(*) as count FROM farms").get().count
    const activeCrops = db.prepare("SELECT COUNT(*) as count FROM crops WHERE status = 'growing'").get().count
    const harvestTotal = db.prepare("SELECT COALESCE(SUM(quantity_kg), 0) as total FROM harvests").get().total
    const salesTotal = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales").get().total

    sendJson(res, 200, {
      totalFarms,
      activeCrops,
      harvestedQuantity: harvestTotal,
      totalSales: salesTotal,
    })
    return true
  }

  // 3. Farms: GET /api/farms, POST /api/farms, DELETE /api/farms/:id
  if (pathname === "/api/farms" && method === "GET") {
    const farms = db.prepare(`
      SELECT f.*, (SELECT COUNT(*) FROM crops c WHERE c.farm_id = f.id) as crop_count 
      FROM farms f 
      ORDER BY f.id DESC
    `).all()
    sendJson(res, 200, farms)
    return true
  }

  if (pathname === "/api/farms" && method === "POST") {
    const { name, location, size_hectares } = await parseJsonBody(req)
    if (!name || !location) {
      sendJson(res, 400, { error: "Name and location are required" })
      return true
    }
    const result = db.prepare(`
      INSERT INTO farms (name, location, size_hectares) VALUES (?, ?, ?)
    `).run(name, location, Number(size_hectares) || 0)

    const newFarm = db.prepare("SELECT * FROM farms WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, newFarm)
    return true
  }

  if (pathname.startsWith("/api/farms/") && method === "DELETE") {
    const id = pathname.split("/").pop()
    db.prepare("DELETE FROM farms WHERE id = ?").run(Number(id))
    sendJson(res, 200, { success: true })
    return true
  }

  // 4. Crops: GET /api/crops, POST /api/crops
  if (pathname === "/api/crops" && method === "GET") {
    const crops = db.prepare(`
      SELECT c.*, f.name as farm_name 
      FROM crops c 
      LEFT JOIN farms f ON c.farm_id = f.id 
      ORDER BY c.id DESC
    `).all()
    sendJson(res, 200, crops)
    return true
  }

  if (pathname === "/api/crops" && method === "POST") {
    const { farm_id, name, variety, planted_date, expected_harvest_date, status, area_hectares } = await parseJsonBody(req)
    if (!name || !planted_date) {
      sendJson(res, 400, { error: "Crop name and planted date are required" })
      return true
    }
    const result = db.prepare(`
      INSERT INTO crops (farm_id, name, variety, planted_date, expected_harvest_date, status, area_hectares)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      farm_id ? Number(farm_id) : null,
      name,
      variety || null,
      planted_date,
      expected_harvest_date || null,
      status || "growing",
      Number(area_hectares) || 0
    )
    const newCrop = db.prepare("SELECT * FROM crops WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, newCrop)
    return true
  }

  // 5. Harvests: GET /api/harvests, POST /api/harvests
  if (pathname === "/api/harvests" && method === "GET") {
    const harvests = db.prepare("SELECT * FROM harvests ORDER BY harvest_date DESC").all()
    sendJson(res, 200, harvests)
    return true
  }

  if (pathname === "/api/harvests" && method === "POST") {
    const { crop_id, crop_name, farm_name, harvest_date, quantity_kg, quality_grade, notes } = await parseJsonBody(req)
    if (!crop_name || !harvest_date || !quantity_kg) {
      sendJson(res, 400, { error: "Crop name, harvest date, and quantity are required" })
      return true
    }
    const result = db.prepare(`
      INSERT INTO harvests (crop_id, crop_name, farm_name, harvest_date, quantity_kg, quality_grade, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crop_id ? Number(crop_id) : null,
      crop_name,
      farm_name || "General Farm",
      harvest_date,
      Number(quantity_kg),
      quality_grade || "A",
      notes || null
    )
    const newHarvest = db.prepare("SELECT * FROM harvests WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, newHarvest)
    return true
  }

  // 6. Sales: GET /api/sales, POST /api/sales
  if (pathname === "/api/sales" && method === "GET") {
    const sales = db.prepare("SELECT * FROM sales ORDER BY sale_date DESC").all()
    sendJson(res, 200, sales)
    return true
  }

  if (pathname === "/api/sales" && method === "POST") {
    const { crop_name, buyer_name, sale_date, quantity_kg, price_per_kg, payment_status } = await parseJsonBody(req)
    if (!crop_name || !buyer_name || !quantity_kg || !price_per_kg) {
      sendJson(res, 400, { error: "Crop name, buyer name, quantity, and price are required" })
      return true
    }
    const qty = Number(quantity_kg)
    const price = Number(price_per_kg)
    const total = qty * price

    const result = db.prepare(`
      INSERT INTO sales (crop_name, buyer_name, sale_date, quantity_kg, price_per_kg, total_amount, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(crop_name, buyer_name, sale_date, qty, price, total, payment_status || "paid")

    const newSale = db.prepare("SELECT * FROM sales WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, newSale)
    return true
  }

  return false
}
