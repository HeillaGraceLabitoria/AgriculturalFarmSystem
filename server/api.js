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
    const totalFields = db.prepare("SELECT COUNT(*) as count FROM farm_fields").get().count
    const activeCrops = db.prepare("SELECT COUNT(*) as count FROM crops WHERE status = 'growing'").get().count
    const harvestTotal = db.prepare("SELECT COALESCE(SUM(quantity_kg), 0) as total FROM harvests").get().total
    const salesTotal = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales").get().total

    sendJson(res, 200, {
      totalFarms,
      totalFields,
      activeCrops,
      harvestedQuantity: harvestTotal,
      totalSales: salesTotal,
    })
    return true
  }

  // 3. Farms: Detail, Sub-fields, and CRUD
  // GET /api/farms/:id/fields
  const farmFieldsMatch = pathname.match(/^\/api\/farms\/(\d+)\/fields$/)
  if (farmFieldsMatch && method === "GET") {
    const farmId = Number(farmFieldsMatch[1])
    const fields = db.prepare(`
      SELECT ff.*, f.name as farm_name 
      FROM farm_fields ff 
      JOIN farms f ON ff.farm_id = f.id 
      WHERE ff.farm_id = ? 
      ORDER BY ff.id DESC
    `).all(farmId)
    sendJson(res, 200, fields)
    return true
  }

  // GET /api/farms/:id and GET /api/farms/:id/profile
  const farmDetailMatch = pathname.match(/^\/api\/farms\/(\d+)(?:\/profile)?$/)
  if (farmDetailMatch && method === "GET") {
    const farmId = Number(farmDetailMatch[1])
    const farm = db.prepare(`
      SELECT f.*, 
        f.size_hectares as total_area,
        (SELECT COUNT(*) FROM farm_fields ff WHERE ff.farm_id = f.id) as field_count,
        (SELECT COALESCE(SUM(ff.area), 0) FROM farm_fields ff WHERE ff.farm_id = f.id) as cultivated_area,
        (SELECT COUNT(*) FROM crops c WHERE c.farm_id = f.id) as crop_count 
      FROM farms f 
      WHERE f.id = ?
    `).get(farmId)

    if (!farm) {
      sendJson(res, 404, { error: "Farm not found" })
      return true
    }

    const fields = db.prepare("SELECT * FROM farm_fields WHERE farm_id = ? ORDER BY id DESC").all(farmId)

    const crops = db.prepare(`
      SELECT c.*, ff.name as field_name 
      FROM crops c 
      LEFT JOIN farm_fields ff ON c.field_id = ff.id 
      WHERE c.farm_id = ? 
      ORDER BY c.id DESC
    `).all(farmId)

    const activePlantings = db.prepare(`
      SELECT c.*, ff.name as field_name 
      FROM crops c 
      LEFT JOIN farm_fields ff ON c.field_id = ff.id 
      WHERE c.farm_id = ? AND c.status != 'harvested' 
      ORDER BY c.planted_date DESC
    `).all(farmId)

    const harvests = db.prepare(`
      SELECT h.*, 
        COALESCE(ff.name, (SELECT ff2.name FROM crops c2 JOIN farm_fields ff2 ON c2.field_id = ff2.id WHERE c2.id = h.crop_id)) as field_name,
        'kg' as unit
      FROM harvests h 
      LEFT JOIN farm_fields ff ON h.field_id = ff.id 
      WHERE h.farm_id = ? 
         OR h.crop_id IN (SELECT id FROM crops WHERE farm_id = ?) 
         OR h.farm_name = ?
      ORDER BY h.harvest_date DESC
    `).all(farmId, farmId, farm.name)

    const sales = db.prepare(`
      SELECT s.* 
      FROM sales s 
      WHERE s.farm_id = ? 
         OR s.harvest_id IN (SELECT id FROM harvests WHERE farm_id = ? OR farm_name = ?)
         OR s.crop_name IN (SELECT crop_name FROM harvests WHERE farm_id = ? OR farm_name = ?)
      ORDER BY s.sale_date DESC
    `).all(farmId, farmId, farm.name, farmId, farm.name)

    const totalIncome = sales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0)
    const totalHarvestKg = harvests.reduce((acc, h) => acc + (Number(h.quantity_kg) || 0), 0)

    sendJson(res, 200, {
      ...farm,
      status: farm.status || "Active",
      fields,
      crops,
      activePlantings,
      harvests,
      sales,
      financials: {
        totalIncome,
        totalHarvestKg,
        cropCount: crops.length,
        activePlantingsCount: activePlantings.length,
        fieldsCount: fields.length,
      },
    })
    return true
  }

  // PUT /api/farms/:id
  if (farmDetailMatch && method === "PUT") {
    const farmId = Number(farmDetailMatch[1])
    const { name, location, size_hectares, total_area, description } = await parseJsonBody(req)

    const area = Number(total_area ?? size_hectares) || 0
    if (!name || !location) {
      sendJson(res, 400, { error: "Farm name and location are required" })
      return true
    }

    db.prepare(`
      UPDATE farms 
      SET name = ?, location = ?, size_hectares = ?, description = ? 
      WHERE id = ?
    `).run(name.trim(), location.trim(), area, description ? description.trim() : null, farmId)

    const updatedFarm = db.prepare(`
      SELECT f.*, 
        f.size_hectares as total_area,
        (SELECT COUNT(*) FROM farm_fields ff WHERE ff.farm_id = f.id) as field_count,
        (SELECT COALESCE(SUM(ff.area), 0) FROM farm_fields ff WHERE ff.farm_id = f.id) as cultivated_area,
        (SELECT COUNT(*) FROM crops c WHERE c.farm_id = f.id) as crop_count 
      FROM farms f 
      WHERE f.id = ?
    `).get(farmId)

    sendJson(res, 200, updatedFarm)
    return true
  }

  // DELETE /api/farms/:id
  if (farmDetailMatch && method === "DELETE") {
    const farmId = Number(farmDetailMatch[1])
    db.prepare("DELETE FROM farm_fields WHERE farm_id = ?").run(farmId)
    db.prepare("DELETE FROM crops WHERE farm_id = ?").run(farmId)
    db.prepare("DELETE FROM farms WHERE id = ?").run(farmId)
    sendJson(res, 200, { success: true })
    return true
  }

  // GET /api/farms
  if (pathname === "/api/farms" && method === "GET") {
    const farms = db.prepare(`
      SELECT f.*, 
        f.size_hectares as total_area,
        (SELECT COUNT(*) FROM farm_fields ff WHERE ff.farm_id = f.id) as field_count,
        (SELECT COALESCE(SUM(ff.area), 0) FROM farm_fields ff WHERE ff.farm_id = f.id) as cultivated_area,
        (SELECT COUNT(*) FROM crops c WHERE c.farm_id = f.id) as crop_count 
      FROM farms f 
      ORDER BY f.id DESC
    `).all()
    sendJson(res, 200, farms)
    return true
  }

  // POST /api/farms
  if (pathname === "/api/farms" && method === "POST") {
    const { name, location, size_hectares, total_area, description } = await parseJsonBody(req)
    if (!name || !location) {
      sendJson(res, 400, { error: "Farm name and location are required" })
      return true
    }
    const area = Number(total_area ?? size_hectares) || 0
    const result = db.prepare(`
      INSERT INTO farms (name, location, size_hectares, description) VALUES (?, ?, ?, ?)
    `).run(name.trim(), location.trim(), area, description ? description.trim() : null)

    const newFarm = db.prepare(`
      SELECT f.*, 
        f.size_hectares as total_area,
        0 as field_count,
        0 as cultivated_area,
        0 as crop_count 
      FROM farms f 
      WHERE f.id = ?
    `).get(result.lastInsertRowid)

    sendJson(res, 201, newFarm)
    return true
  }

  // 4. Farm Areas / Fields: CRUD
  const fieldDetailMatch = pathname.match(/^\/api\/fields\/(\d+)$/)

  // GET /api/fields
  if (pathname === "/api/fields" && method === "GET") {
    const farmIdQuery = url.searchParams.get("farm_id")
    let fields
    if (farmIdQuery) {
      fields = db.prepare(`
        SELECT ff.*, f.name as farm_name 
        FROM farm_fields ff 
        JOIN farms f ON ff.farm_id = f.id 
        WHERE ff.farm_id = ? 
        ORDER BY ff.id DESC
      `).all(Number(farmIdQuery))
    } else {
      fields = db.prepare(`
        SELECT ff.*, f.name as farm_name 
        FROM farm_fields ff 
        JOIN farms f ON ff.farm_id = f.id 
        ORDER BY ff.id DESC
      `).all()
    }
    sendJson(res, 200, fields)
    return true
  }

  // POST /api/fields
  if (pathname === "/api/fields" && method === "POST") {
    const { farm_id, name, area, description, status } = await parseJsonBody(req)
    if (!farm_id) {
      sendJson(res, 400, { error: "Field must belong to an existing farm (farm_id is required)" })
      return true
    }
    if (!name || name.trim() === "") {
      sendJson(res, 400, { error: "Field name is required" })
      return true
    }

    const farmExists = db.prepare("SELECT id FROM farms WHERE id = ?").get(Number(farm_id))
    if (!farmExists) {
      sendJson(res, 404, { error: "Selected farm does not exist" })
      return true
    }

    const result = db.prepare(`
      INSERT INTO farm_fields (farm_id, name, area, description, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      Number(farm_id),
      name.trim(),
      Number(area) || 0,
      description ? description.trim() : null,
      status || "Active"
    )

    const newField = db.prepare(`
      SELECT ff.*, f.name as farm_name 
      FROM farm_fields ff 
      JOIN farms f ON ff.farm_id = f.id 
      WHERE ff.id = ?
    `).get(result.lastInsertRowid)

    sendJson(res, 201, newField)
    return true
  }

  // PUT /api/fields/:id
  if (fieldDetailMatch && method === "PUT") {
    const fieldId = Number(fieldDetailMatch[1])
    const { farm_id, name, area, description, status } = await parseJsonBody(req)

    if (!name || name.trim() === "") {
      sendJson(res, 400, { error: "Field name is required" })
      return true
    }

    db.prepare(`
      UPDATE farm_fields 
      SET name = ?, area = ?, description = ?, status = ?
      WHERE id = ?
    `).run(
      name.trim(),
      Number(area) || 0,
      description ? description.trim() : null,
      status || "Active",
      fieldId
    )

    const updatedField = db.prepare(`
      SELECT ff.*, f.name as farm_name 
      FROM farm_fields ff 
      JOIN farms f ON ff.farm_id = f.id 
      WHERE ff.id = ?
    `).get(fieldId)

    sendJson(res, 200, updatedField)
    return true
  }

  // DELETE /api/fields/:id
  if (fieldDetailMatch && method === "DELETE") {
    const fieldId = Number(fieldDetailMatch[1])
    db.prepare("DELETE FROM farm_fields WHERE id = ?").run(fieldId)
    sendJson(res, 200, { success: true })
    return true
  }

  // 5. Crops: GET /api/crops, POST /api/crops
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

  // 6. Harvests: GET /api/harvests, POST /api/harvests
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

  // 7. Sales: GET /api/sales, POST /api/sales
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
