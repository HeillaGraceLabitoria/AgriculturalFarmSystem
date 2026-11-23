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

  if (farmDetailMatch && method === "DELETE") {
    const farmId = Number(farmDetailMatch[1])
    db.prepare("DELETE FROM farm_fields WHERE farm_id = ?").run(farmId)
    db.prepare("DELETE FROM crops WHERE farm_id = ?").run(farmId)
    db.prepare("DELETE FROM farms WHERE id = ?").run(farmId)
    sendJson(res, 200, { success: true })
    return true
  }

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

  if (fieldDetailMatch && method === "PUT") {
    const fieldId = Number(fieldDetailMatch[1])
    const { name, area, description, status } = await parseJsonBody(req)

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

  if (fieldDetailMatch && method === "DELETE") {
    const fieldId = Number(fieldDetailMatch[1])
    db.prepare("DELETE FROM farm_fields WHERE id = ?").run(fieldId)
    sendJson(res, 200, { success: true })
    return true
  }

  // 5. Crops: GET / POST / Stage Update / Delete
  if (pathname === "/api/crops" && method === "GET") {
    const crops = db.prepare(`
      SELECT c.*, f.name as farm_name, ff.name as field_name
      FROM crops c 
      LEFT JOIN farms f ON c.farm_id = f.id 
      LEFT JOIN farm_fields ff ON c.field_id = ff.id
      ORDER BY c.id DESC
    `).all()
    sendJson(res, 200, crops)
    return true
  }

  if (pathname === "/api/crops" && method === "POST") {
    const {
      farm_id,
      field_id,
      name,
      variety,
      planted_date,
      expected_harvest_date,
      status,
      area_hectares,
      growth_stage,
      batch_code,
    } = await parseJsonBody(req)

    if (!name || !planted_date) {
      sendJson(res, 400, { error: "Crop name and planted date are required" })
      return true
    }

    const code = batch_code?.trim() || `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    const result = db.prepare(`
      INSERT INTO crops (farm_id, field_id, name, variety, planted_date, expected_harvest_date, status, area_hectares, growth_stage, batch_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farm_id ? Number(farm_id) : null,
      field_id ? Number(field_id) : null,
      name,
      variety || null,
      planted_date,
      expected_harvest_date || null,
      status || "growing",
      Number(area_hectares) || 0,
      growth_stage || "Seedling",
      code
    )
    const newCrop = db.prepare(`
      SELECT c.*, f.name as farm_name, ff.name as field_name
      FROM crops c
      LEFT JOIN farms f ON c.farm_id = f.id
      LEFT JOIN farm_fields ff ON c.field_id = ff.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid)
    sendJson(res, 201, newCrop)
    return true
  }

  const cropStageMatch = pathname.match(/^\/api\/crops\/(\d+)\/stage$/)
  if (cropStageMatch && method === "PUT") {
    const cropId = Number(cropStageMatch[1])
    const { growth_stage, status } = await parseJsonBody(req)
    const derivedStatus = growth_stage === "Harvested" ? "harvested" : status || "growing"
    db.prepare("UPDATE crops SET growth_stage = COALESCE(?, growth_stage), status = ? WHERE id = ?").run(
      growth_stage || null,
      derivedStatus,
      cropId
    )
    sendJson(res, 200, db.prepare("SELECT * FROM crops WHERE id = ?").get(cropId))
    return true
  }

  const cropIdMatch = pathname.match(/^\/api\/crops\/(\d+)$/)
  if (cropIdMatch && method === "DELETE") {
    db.prepare("DELETE FROM crops WHERE id = ?").run(Number(cropIdMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 6. Harvests: GET / POST (auto-updates crop batch status to harvested) / DELETE
  if (pathname === "/api/harvests" && method === "GET") {
    const harvests = db.prepare(`
      SELECT h.*, ff.name as field_name
      FROM harvests h
      LEFT JOIN farm_fields ff ON h.field_id = ff.id
      ORDER BY h.harvest_date DESC, h.id DESC
    `).all()
    sendJson(res, 200, harvests)
    return true
  }

  if (pathname === "/api/harvests" && method === "POST") {
    const { crop_id, crop_name, farm_id, field_id, farm_name, harvest_date, quantity_kg, quality_grade, notes } = await parseJsonBody(req)
    if (!crop_name || !harvest_date || !quantity_kg) {
      sendJson(res, 400, { error: "Crop name, harvest date, and quantity are required" })
      return true
    }

    let resolvedFarmName = farm_name || "General Farm"
    if (farm_id) {
      const f = db.prepare("SELECT name FROM farms WHERE id = ?").get(Number(farm_id))
      if (f) resolvedFarmName = f.name
    }

    const result = db.prepare(`
      INSERT INTO harvests (crop_id, crop_name, farm_id, field_id, farm_name, harvest_date, quantity_kg, quality_grade, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crop_id ? Number(crop_id) : null,
      crop_name,
      farm_id ? Number(farm_id) : null,
      field_id ? Number(field_id) : null,
      resolvedFarmName,
      harvest_date,
      Number(quantity_kg),
      quality_grade || "A",
      notes || null
    )

    if (crop_id) {
      db.prepare("UPDATE crops SET status = 'harvested', growth_stage = 'Harvested' WHERE id = ?").run(Number(crop_id))
    }

    const newHarvest = db.prepare("SELECT * FROM harvests WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, newHarvest)
    return true
  }

  const harvestIdMatch = pathname.match(/^\/api\/harvests\/(\d+)$/)
  if (harvestIdMatch && method === "DELETE") {
    db.prepare("DELETE FROM harvests WHERE id = ?").run(Number(harvestIdMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 7. Sales: GET / POST / PUT (payment status) / DELETE
  if (pathname === "/api/sales" && method === "GET") {
    const sales = db.prepare(`
      SELECT s.*, f.name as farm_name
      FROM sales s
      LEFT JOIN farms f ON s.farm_id = f.id
      ORDER BY s.sale_date DESC, s.id DESC
    `).all()
    sendJson(res, 200, sales)
    return true
  }

  if (pathname === "/api/sales" && method === "POST") {
    const { farm_id, harvest_id, crop_name, buyer_name, sale_date, quantity_kg, price_per_kg, payment_status } = await parseJsonBody(req)
    if (!crop_name || !buyer_name || !quantity_kg || !price_per_kg) {
      sendJson(res, 400, { error: "Crop name, buyer name, quantity, and price are required" })
      return true
    }
    const qty = Number(quantity_kg)
    const price = Number(price_per_kg)
    const total = Number((qty * price).toFixed(2))

    const result = db.prepare(`
      INSERT INTO sales (farm_id, harvest_id, crop_name, buyer_name, sale_date, quantity_kg, price_per_kg, total_amount, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farm_id ? Number(farm_id) : null,
      harvest_id ? Number(harvest_id) : null,
      crop_name,
      buyer_name,
      sale_date,
      qty,
      price,
      total,
      payment_status || "paid"
    )

    const newSale = db.prepare("SELECT * FROM sales WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, newSale)
    return true
  }

  const saleStatusMatch = pathname.match(/^\/api\/sales\/(\d+)\/status$/)
  if (saleStatusMatch && method === "PUT") {
    const saleId = Number(saleStatusMatch[1])
    const { payment_status } = await parseJsonBody(req)
    db.prepare("UPDATE sales SET payment_status = ? WHERE id = ?").run(payment_status || "paid", saleId)
    sendJson(res, 200, db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId))
    return true
  }

  const saleIdMatch = pathname.match(/^\/api\/sales\/(\d+)$/)
  if (saleIdMatch && method === "DELETE") {
    db.prepare("DELETE FROM sales WHERE id = ?").run(Number(saleIdMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 8. Audit Logs (GET / POST)
  if (pathname === "/api/audit-logs" && method === "GET") {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100").all()
    sendJson(res, 200, logs)
    return true
  }

  if (pathname === "/api/audit-logs" && method === "POST") {
    const { user_name, user_role, action, module, details } = await parseJsonBody(req)
    const result = db.prepare(
      "INSERT INTO audit_logs (user_name, user_role, action, module, details) VALUES (?, ?, ?, ?, ?)"
    ).run(user_name || "Farm Administrator", user_role || "admin", action || "ACTION", module || "System", details || "")
    const created = db.prepare("SELECT * FROM audit_logs WHERE id = ?").get(result.lastInsertRowid)
    sendJson(res, 201, created)
    return true
  }

  // 9. Crop Catalog (GET / POST / DELETE)
  if (pathname === "/api/crop-catalog" && method === "GET") {
    sendJson(res, 200, db.prepare("SELECT * FROM crop_catalog ORDER BY name ASC").all())
    return true
  }

  if (pathname === "/api/crop-catalog" && method === "POST") {
    const { name, variety, category, growing_days, ideal_soil } = await parseJsonBody(req)
    if (!name || !variety) {
      sendJson(res, 400, { error: "Crop name and variety are required" })
      return true
    }
    const result = db.prepare(
      "INSERT INTO crop_catalog (name, variety, category, growing_days, ideal_soil) VALUES (?, ?, ?, ?, ?)"
    ).run(name.trim(), variety.trim(), category || "General Crop", Number(growing_days) || 90, ideal_soil || "")
    sendJson(res, 201, db.prepare("SELECT * FROM crop_catalog WHERE id = ?").get(result.lastInsertRowid))
    return true
  }

  const cropCatMatch = pathname.match(/^\/api\/crop-catalog\/(\d+)$/)
  if (cropCatMatch && method === "DELETE") {
    db.prepare("DELETE FROM crop_catalog WHERE id = ?").run(Number(cropCatMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 10. Fertilizers Master List (GET / POST / DELETE)
  if (pathname === "/api/fertilizers" && method === "GET") {
    sendJson(res, 200, db.prepare("SELECT * FROM fertilizers ORDER BY name ASC").all())
    return true
  }

  if (pathname === "/api/fertilizers" && method === "POST") {
    const { name, npk_ratio, type, unit_price, unit } = await parseJsonBody(req)
    if (!name || !npk_ratio) {
      sendJson(res, 400, { error: "Fertilizer name and N-P-K ratio are required" })
      return true
    }
    const result = db.prepare(
      "INSERT INTO fertilizers (name, npk_ratio, type, unit_price, unit) VALUES (?, ?, ?, ?, ?)"
    ).run(name.trim(), npk_ratio.trim(), type || "Granular", Number(unit_price) || 0, unit || "bag (50kg)")
    sendJson(res, 201, db.prepare("SELECT * FROM fertilizers WHERE id = ?").get(result.lastInsertRowid))
    return true
  }

  const fertMatch = pathname.match(/^\/api\/fertilizers\/(\d+)$/)
  if (fertMatch && method === "DELETE") {
    db.prepare("DELETE FROM fertilizers WHERE id = ?").run(Number(fertMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 11. Customers & Stakeholders Directory (GET / POST / DELETE)
  if (pathname === "/api/customers" && method === "GET") {
    sendJson(res, 200, db.prepare("SELECT * FROM customers ORDER BY name ASC").all())
    return true
  }

  if (pathname === "/api/customers" && method === "POST") {
    const { name, contact_person, phone, email, buyer_type, address } = await parseJsonBody(req)
    if (!name) {
      sendJson(res, 400, { error: "Customer/Organization name is required" })
      return true
    }
    const result = db.prepare(
      "INSERT INTO customers (name, contact_person, phone, email, buyer_type, address) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name.trim(), contact_person || "", phone || "", email || "", buyer_type || "Wholesaler", address || "")
    sendJson(res, 201, db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid))
    return true
  }

  const custMatch = pathname.match(/^\/api\/customers\/(\d+)$/)
  if (custMatch && method === "DELETE") {
    db.prepare("DELETE FROM customers WHERE id = ?").run(Number(custMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 12. Field Activities & Labor Logs (GET / POST / DELETE)
  if (pathname === "/api/field-activities" && method === "GET") {
    const rows = db.prepare(`
      SELECT fa.*, f.name as farm_name, ff.name as field_name, c.name as crop_name
      FROM field_activities fa
      LEFT JOIN farms f ON fa.farm_id = f.id
      LEFT JOIN farm_fields ff ON fa.field_id = ff.id
      LEFT JOIN crops c ON fa.crop_id = c.id
      ORDER BY fa.activity_date DESC, fa.id DESC
    `).all()
    sendJson(res, 200, rows)
    return true
  }

  if (pathname === "/api/field-activities" && method === "POST") {
    const { farm_id, field_id, crop_id, activity_type, activity_date, worker_name, hours_worked, labor_cost, notes } = await parseJsonBody(req)
    if (!activity_type || !activity_date || !worker_name) {
      sendJson(res, 400, { error: "Activity type, date, and worker name are required" })
      return true
    }
    const result = db.prepare(`
      INSERT INTO field_activities (farm_id, field_id, crop_id, activity_type, activity_date, worker_name, hours_worked, labor_cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farm_id ? Number(farm_id) : null,
      field_id ? Number(field_id) : null,
      crop_id ? Number(crop_id) : null,
      activity_type,
      activity_date,
      worker_name.trim(),
      Number(hours_worked) || 0,
      Number(labor_cost) || 0,
      notes || null
    )
    sendJson(res, 201, db.prepare("SELECT * FROM field_activities WHERE id = ?").get(result.lastInsertRowid))
    return true
  }

  const activityMatch = pathname.match(/^\/api\/field-activities\/(\d+)$/)
  if (activityMatch && method === "DELETE") {
    db.prepare("DELETE FROM field_activities WHERE id = ?").run(Number(activityMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 13. Fertilizer Applications & Dosage Calculator (GET / POST / DELETE)
  if (pathname === "/api/fertilizer-applications" && method === "GET") {
    const rows = db.prepare(`
      SELECT fa.*, f.name as farm_name, ff.name as field_name, c.name as crop_name
      FROM fertilizer_applications fa
      LEFT JOIN farms f ON fa.farm_id = f.id
      LEFT JOIN farm_fields ff ON fa.field_id = ff.id
      LEFT JOIN crops c ON fa.crop_id = c.id
      ORDER BY fa.application_date DESC, fa.id DESC
    `).all()
    sendJson(res, 200, rows)
    return true
  }

  if (pathname === "/api/fertilizer-applications" && method === "POST") {
    const {
      farm_id,
      field_id,
      crop_id,
      fertilizer_id,
      fertilizer_name,
      npk_ratio,
      application_date,
      area_hectares,
      dosage_per_ha,
      unit_price,
      notes,
    } = await parseJsonBody(req)

    if (!fertilizer_name || !application_date) {
      sendJson(res, 400, { error: "Fertilizer and application date are required" })
      return true
    }

    const area = Number(area_hectares) || 0
    const dosage = Number(dosage_per_ha) || 0
    const price = Number(unit_price) || 0
    const totalUnits = Number((area * dosage).toFixed(2))
    const totalCost = Number((totalUnits * price).toFixed(2))

    const result = db.prepare(`
      INSERT INTO fertilizer_applications (
        farm_id, field_id, crop_id, fertilizer_id, fertilizer_name, npk_ratio,
        application_date, area_hectares, dosage_per_ha, total_units, unit_price, total_cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farm_id ? Number(farm_id) : null,
      field_id ? Number(field_id) : null,
      crop_id ? Number(crop_id) : null,
      fertilizer_id ? Number(fertilizer_id) : null,
      fertilizer_name,
      npk_ratio || "",
      application_date,
      area,
      dosage,
      totalUnits,
      price,
      totalCost,
      notes || null
    )
    sendJson(res, 201, db.prepare("SELECT * FROM fertilizer_applications WHERE id = ?").get(result.lastInsertRowid))
    return true
  }

  const fertAppMatch = pathname.match(/^\/api\/fertilizer-applications\/(\d+)$/)
  if (fertAppMatch && method === "DELETE") {
    db.prepare("DELETE FROM fertilizer_applications WHERE id = ?").run(Number(fertAppMatch[1]))
    sendJson(res, 200, { success: true })
    return true
  }

  // 14. Financial Summary & Net Profit Analytics per Farm
  if (pathname === "/api/financial-summary" && method === "GET") {
    const farms = db.prepare("SELECT id, name, location, size_hectares FROM farms ORDER BY id ASC").all()
    const breakdown = farms.map((farm) => {
      const revenue = db
        .prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE farm_id = ?")
        .get(farm.id).total
      const laborCost = db
        .prepare("SELECT COALESCE(SUM(labor_cost), 0) as total FROM field_activities WHERE farm_id = ?")
        .get(farm.id).total
      const fertilizerCost = db
        .prepare("SELECT COALESCE(SUM(total_cost), 0) as total FROM fertilizer_applications WHERE farm_id = ?")
        .get(farm.id).total
      const harvestKg = db
        .prepare("SELECT COALESCE(SUM(quantity_kg), 0) as total FROM harvests WHERE farm_id = ?")
        .get(farm.id).total
      const totalExpense = Number(laborCost) + Number(fertilizerCost)
      const netProfit = Number(revenue) - totalExpense

      return {
        farm_id: farm.id,
        farm_name: farm.name,
        location: farm.location,
        area_hectares: farm.size_hectares,
        harvest_kg: Number(harvestKg),
        gross_revenue: Number(revenue),
        labor_cost: Number(laborCost),
        fertilizer_cost: Number(fertilizerCost),
        total_expense: totalExpense,
        net_profit: netProfit,
      }
    })

    const totals = breakdown.reduce(
      (acc, row) => ({
        harvest_kg: acc.harvest_kg + row.harvest_kg,
        gross_revenue: acc.gross_revenue + row.gross_revenue,
        labor_cost: acc.labor_cost + row.labor_cost,
        fertilizer_cost: acc.fertilizer_cost + row.fertilizer_cost,
        total_expense: acc.total_expense + row.total_expense,
        net_profit: acc.net_profit + row.net_profit,
      }),
      { harvest_kg: 0, gross_revenue: 0, labor_cost: 0, fertilizer_cost: 0, total_expense: 0, net_profit: 0 }
    )

    sendJson(res, 200, { breakdown, totals })
    return true
  }

  return false
}