import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"

const isVercel = Boolean(process.env.VERCEL)
const dbDir = isVercel ? "/tmp" : path.resolve(import.meta.dirname, "../data")
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, "farm.db")
export const db = new DatabaseSync(dbPath)

// Initialize schema and seed data
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'manager',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      size_hectares REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farm_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      area REAL NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      variety TEXT,
      planted_date TEXT NOT NULL,
      expected_harvest_date TEXT,
      status TEXT NOT NULL DEFAULT 'growing',
      area_hectares REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS harvests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
      crop_name TEXT NOT NULL,
      farm_name TEXT NOT NULL,
      harvest_date TEXT NOT NULL,
      quantity_kg REAL NOT NULL,
      quality_grade TEXT DEFAULT 'A',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_name TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      quantity_kg REAL NOT NULL,
      price_per_kg REAL NOT NULL,
      total_amount REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      payment_status TEXT NOT NULL DEFAULT 'paid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System-wide Audit Logging
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Crop Classification & Growing Periods Reference Catalog
    CREATE TABLE IF NOT EXISTS crop_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variety TEXT NOT NULL,
      category TEXT NOT NULL,
      growing_days INTEGER NOT NULL DEFAULT 90,
      ideal_soil TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Shared Fertilizer Master List & N-P-K Catalog
    CREATE TABLE IF NOT EXISTS fertilizers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      npk_ratio TEXT NOT NULL,
      type TEXT NOT NULL,
      unit_price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'bag (50kg)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customer & Stakeholder Directory
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      buyer_type TEXT NOT NULL DEFAULT 'Wholesaler',
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Field Activity & Labor Operation Logs
    CREATE TABLE IF NOT EXISTS field_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
      field_id INTEGER REFERENCES farm_fields(id) ON DELETE SET NULL,
      crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
      activity_type TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      worker_name TEXT NOT NULL,
      hours_worked REAL NOT NULL DEFAULT 0,
      labor_cost REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Fertilizer Application, Dosage & Cost Tracking
    CREATE TABLE IF NOT EXISTS fertilizer_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
      field_id INTEGER REFERENCES farm_fields(id) ON DELETE SET NULL,
      crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
      fertilizer_id INTEGER REFERENCES fertilizers(id) ON DELETE SET NULL,
      fertilizer_name TEXT NOT NULL,
      npk_ratio TEXT,
      application_date TEXT NOT NULL,
      area_hectares REAL NOT NULL DEFAULT 0,
      dosage_per_ha REAL NOT NULL DEFAULT 0,
      total_units REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Ensure 'description' and 'status' columns exist in 'farms' table
  const farmCols = db.prepare("PRAGMA table_info(farms)").all()
  if (!farmCols.some((c) => c.name === "description")) {
    db.exec("ALTER TABLE farms ADD COLUMN description TEXT")
  }
  if (!farmCols.some((c) => c.name === "status")) {
    db.exec("ALTER TABLE farms ADD COLUMN status TEXT DEFAULT 'Active'")
  }

  // Ensure 'field_id', 'growth_stage', and 'batch_code' columns exist in 'crops' table
  const cropCols = db.prepare("PRAGMA table_info(crops)").all()
  if (!cropCols.some((c) => c.name === "field_id")) {
    db.exec("ALTER TABLE crops ADD COLUMN field_id INTEGER REFERENCES farm_fields(id)")
  }
  if (!cropCols.some((c) => c.name === "growth_stage")) {
    db.exec("ALTER TABLE crops ADD COLUMN growth_stage TEXT DEFAULT 'Vegetative'")
  }
  if (!cropCols.some((c) => c.name === "batch_code")) {
    db.exec("ALTER TABLE crops ADD COLUMN batch_code TEXT")
  }

  // Ensure 'farm_id' and 'field_id' columns exist in 'harvests' table
  const harvestCols = db.prepare("PRAGMA table_info(harvests)").all()
  if (!harvestCols.some((c) => c.name === "farm_id")) {
    db.exec("ALTER TABLE harvests ADD COLUMN farm_id INTEGER REFERENCES farms(id)")
  }
  if (!harvestCols.some((c) => c.name === "field_id")) {
    db.exec("ALTER TABLE harvests ADD COLUMN field_id INTEGER REFERENCES farm_fields(id)")
  }

  // Ensure 'farm_id', 'harvest_id', 'amount_paid', 'balance', and 'payment_method' columns exist in 'sales' table
  const saleCols = db.prepare("PRAGMA table_info(sales)").all()
  if (!saleCols.some((c) => c.name === "farm_id")) {
    db.exec("ALTER TABLE sales ADD COLUMN farm_id INTEGER REFERENCES farms(id)")
  }
  if (!saleCols.some((c) => c.name === "harvest_id")) {
    db.exec("ALTER TABLE sales ADD COLUMN harvest_id INTEGER REFERENCES harvests(id)")
  }
  if (!saleCols.some((c) => c.name === "amount_paid")) {
    db.exec("ALTER TABLE sales ADD COLUMN amount_paid REAL DEFAULT 0")
  }
  if (!saleCols.some((c) => c.name === "balance")) {
    db.exec("ALTER TABLE sales ADD COLUMN balance REAL DEFAULT 0")
  }
  if (!saleCols.some((c) => c.name === "payment_method")) {
    db.exec("ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'Cash'")
  }
  db.exec("UPDATE sales SET amount_paid = total_amount, balance = 0 WHERE payment_status = 'paid' AND (amount_paid IS NULL OR amount_paid = 0)")

  // Populate default farm descriptions if missing
  try {
    db.prepare("UPDATE farms SET description = ? WHERE name LIKE '%Green Valley%' AND (description IS NULL OR description = '')").run("Primary grain and vegetable research farm situated along the Laguna lake basin.")
    db.prepare("UPDATE farms SET description = ? WHERE name LIKE '%Sunrise Plains%' AND (description IS NULL OR description = '')").run("Large-scale mechanized grain production facility in Central Luzon.")
    db.prepare("UPDATE farms SET description = ? WHERE name LIKE '%Highland Organic%' AND (description IS NULL OR description = '')").run("Eco-certified cool climate vegetable farm in the Cordillera mountain range.")
    db.prepare("UPDATE farms SET description = ? WHERE name LIKE '%Mindanao Citrus%' AND (description IS NULL OR description = '')").run("Export-grade tropical fruit plantation and agro-forestry development.")
    db.prepare("UPDATE farms SET status = 'Active' WHERE status IS NULL").run()
  } catch {
    // Non-blocking
  }

  // Link default crops to fields and batch codes if unassigned
  try {
    const linkCropField = db.prepare("UPDATE crops SET field_id = ? WHERE id = ? AND field_id IS NULL")
    linkCropField.run(1, 1)
    linkCropField.run(2, 2)
    linkCropField.run(3, 3)
    linkCropField.run(4, 4)
    linkCropField.run(5, 5)
    linkCropField.run(6, 6)
    linkCropField.run(7, 7)
    linkCropField.run(8, 8)
    linkCropField.run(9, 9)
    db.prepare("UPDATE crops SET batch_code = 'BATCH-2026-' || printf('%03d', id) WHERE batch_code IS NULL").run()
    db.prepare("UPDATE crops SET growth_stage = 'Harvested' WHERE status = 'harvested' AND (growth_stage IS NULL OR growth_stage = 'Vegetative')").run()
  } catch {
    // Non-blocking
  }

  // Link default harvests to farms/fields if unassigned
  try {
    db.prepare("UPDATE harvests SET farm_id = 2, field_id = 4 WHERE id = 1 AND farm_id IS NULL").run()
    db.prepare("UPDATE harvests SET farm_id = 4 WHERE id = 2 AND farm_id IS NULL").run()
    db.prepare("UPDATE harvests SET farm_id = (SELECT id FROM farms WHERE name = harvests.farm_name) WHERE farm_id IS NULL").run()
  } catch {
    // Non-blocking
  }

  // Link default sales to farms/harvests if unassigned
  try {
    db.prepare("UPDATE sales SET farm_id = 2, harvest_id = 1 WHERE id = 1 AND farm_id IS NULL").run()
    db.prepare("UPDATE sales SET farm_id = 4, harvest_id = 2 WHERE id = 2 AND farm_id IS NULL").run()
    db.prepare("UPDATE sales SET farm_id = 3 WHERE id = 3 AND farm_id IS NULL").run()
  } catch {
    // Non-blocking
  }

  // Check if initial admin user exists
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run("Farm Administrator", "admin@farm.com", "admin123", "admin")
  }

  // Seed additional role account (Field Worker)
  const workerExists = db.prepare("SELECT id FROM users WHERE email = ?").get("worker@farm.com")
  if (!workerExists) {
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      "Field Operations Staff",
      "worker@farm.com",
      "worker123",
      "worker"
    )
  }

  // Check if farms exist (if 0, seed defaults)
  const farmCount = db.prepare("SELECT COUNT(*) as count FROM farms").get().count
  if (farmCount === 0) {
    const insertFarm = db.prepare("INSERT INTO farms (name, location, size_hectares, description) VALUES (?, ?, ?, ?)")
    insertFarm.run("Green Valley Agri Farm", "Laguna, Region IV-A", 15.5, "Primary grain and vegetable research farm situated along the Laguna lake basin.")
    insertFarm.run("Sunrise Plains Farm", "Nueva Ecija, Central Luzon", 28.0, "Large-scale mechanized grain production facility in Central Luzon.")
    insertFarm.run("Highland Organic Fields", "Benguet, CAR", 8.2, "Eco-certified cool climate vegetable farm in the Cordillera mountain range.")
    insertFarm.run("Mindanao Citrus & Palm", "Davao del Norte, Region XI", 35.0, "Export-grade tropical fruit plantation and agro-forestry development.")

    const insertCrop = db.prepare(`
      INSERT INTO crops (farm_id, name, variety, planted_date, expected_harvest_date, status, area_hectares, growth_stage, batch_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertCrop.run(1, "Rice", "Jasmine RC222", "2026-06-15", "2026-10-20", "growing", 6.0, "Flowering", "BATCH-2026-001")
    insertCrop.run(1, "Corn", "Hybrid Yellow", "2026-07-01", "2026-10-15", "growing", 4.5, "Ready for Harvest", "BATCH-2026-002")
    insertCrop.run(1, "Tomato", "Diamante Max", "2026-08-10", "2026-11-05", "growing", 2.0, "Vegetative", "BATCH-2026-003")
    insertCrop.run(2, "Rice", "NSIC Rc160", "2026-06-01", "2026-09-30", "harvested", 12.0, "Harvested", "BATCH-2026-004")
    insertCrop.run(2, "White Corn", "Sweet Pearl", "2026-07-15", "2026-10-25", "growing", 8.0, "Flowering", "BATCH-2026-005")
    insertCrop.run(2, "Sugarcane", "Phil 2006-2282", "2026-01-10", "2026-12-15", "growing", 6.0, "Vegetative", "BATCH-2026-006")
    insertCrop.run(3, "Cabbage", "Rare Ball", "2026-08-01", "2026-10-18", "growing", 2.5, "Ready for Harvest", "BATCH-2026-007")
    insertCrop.run(3, "Carrots", "Kuroda", "2026-07-20", "2026-10-30", "growing", 2.2, "Vegetative", "BATCH-2026-008")
    insertCrop.run(3, "Bell Pepper", "Red Baron", "2026-08-15", "2026-11-20", "growing", 1.8, "Seedling", "BATCH-2026-009")
    insertCrop.run(4, "Banana", "Cavendish", "2025-09-10", "2026-10-01", "harvested", 15.0, "Harvested", "BATCH-2026-010")
    insertCrop.run(4, "Calamansi", "Native Green", "2025-05-15", "2026-10-10", "growing", 10.0, "Flowering", "BATCH-2026-011")
    insertCrop.run(4, "Cassava", "Lakan 1", "2026-02-10", "2026-11-15", "growing", 8.0, "Vegetative", "BATCH-2026-012")

    const insertHarvest = db.prepare(`
      INSERT INTO harvests (crop_id, crop_name, farm_id, farm_name, harvest_date, quantity_kg, quality_grade, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertHarvest.run(4, "Rice (NSIC Rc160)", 2, "Sunrise Plains Farm", "2026-09-30", 12500, "A", "First batch premium yield")
    insertHarvest.run(10, "Banana (Cavendish)", 4, "Mindanao Citrus & Palm", "2026-10-01", 5950, "A", "Export quality harvest")

    const insertSale = db.prepare(`
      INSERT INTO sales (farm_id, harvest_id, crop_name, buyer_name, sale_date, quantity_kg, price_per_kg, total_amount, amount_paid, balance, payment_method, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertSale.run(2, 1, "Rice (NSIC Rc160)", "National Food Authority / Regional Grain Trading", "2026-10-02", 12500, 24.50, 306250.00, 306250.00, 0, "Bank Transfer", "paid")
    insertSale.run(4, 2, "Banana (Cavendish)", "Davao Fresh Produce Trading Corp", "2026-10-03", 5950, 30.00, 178500.00, 178500.00, 0, "Bank Transfer", "paid")
    insertSale.run(3, null, "Organic Vegetables Sample", "Benguet Agri-Hub Coop", "2026-10-04", 50, 10.00, 500.00, 500.00, 0, "Cash", "paid")
  }

  // Seed default fields if farm_fields is empty
  const fieldCount = db.prepare("SELECT COUNT(*) as count FROM farm_fields").get().count
  if (fieldCount === 0) {
    const insertField = db.prepare(`
      INSERT INTO farm_fields (farm_id, name, area, description, status)
      VALUES (?, ?, ?, ?, ?)
    `)

    const greenValley = db.prepare("SELECT id FROM farms WHERE name LIKE '%Green Valley%'").get()
    if (greenValley) {
      insertField.run(greenValley.id, "North Paddy Field A", 5.0, "Lowland irrigated rice field with automated sluice gates", "Planted")
      insertField.run(greenValley.id, "East Terrace Field B", 4.5, "Fertile terrace soil planted with hybrid corn", "Active")
      insertField.run(greenValley.id, "Greenhouse Zone C", 2.0, "High-density tunnel greenhouses for organic tomatoes", "Active")
    }

    const sunrise = db.prepare("SELECT id FROM farms WHERE name LIKE '%Sunrise Plains%'").get()
    if (sunrise) {
      insertField.run(sunrise.id, "Central Basin Field 1", 12.0, "Deep alluvial soil block for grain cultivation", "Fallow")
      insertField.run(sunrise.id, "Sector 2 West", 8.0, "Sandy loam soil optimized for corn varieties", "Planted")
      insertField.run(sunrise.id, "Canal Plot 3", 6.0, "Direct canal access for high-demand sugarcane", "Active")
    }

    const highland = db.prepare("SELECT id FROM farms WHERE name LIKE '%Highland Organic%'").get()
    if (highland) {
      insertField.run(highland.id, "Terrace Slope Alpha", 2.5, "High-altitude terraced beds for crisp cabbage", "Planted")
      insertField.run(highland.id, "Root Crop Zone", 2.2, "Rich volcanic soil plot for organic carrots", "Active")
      insertField.run(highland.id, "Covered Garden 1", 1.8, "UV-filtered polyhouse for bell peppers", "Prepared")
    }
  }

  // Seed Crop Catalog
  if (db.prepare("SELECT COUNT(*) as count FROM crop_catalog").get().count === 0) {
    const insCat = db.prepare("INSERT INTO crop_catalog (name, variety, category, growing_days, ideal_soil) VALUES (?, ?, ?, ?, ?)")
    insCat.run("Rice", "Jasmine RC222", "Cereal Grain", 115, "Clay Loam / Irrigated Paddy")
    insCat.run("Rice", "NSIC Rc160", "Cereal Grain", 110, "Alluvial Lowland")
    insCat.run("Corn", "Hybrid Yellow", "Cereal Grain", 105, "Sandy Loam")
    insCat.run("Tomato", "Diamante Max", "High-Value Vegetable", 75, "Well-drained Loam")
    insCat.run("Cabbage", "Rare Ball", "Highland Vegetable", 80, "Volcanic Loam")
    insCat.run("Banana", "Cavendish", "Tropical Fruit", 270, "Deep Silty Loam")
  }

  // Seed Fertilizers
  if (db.prepare("SELECT COUNT(*) as count FROM fertilizers").get().count === 0) {
    const insFert = db.prepare("INSERT INTO fertilizers (name, npk_ratio, type, unit_price, unit) VALUES (?, ?, ?, ?, ?)")
    insFert.run("Complete Fertilizer (Triple 14)", "14-14-14", "Synthetic Granular", 1450.0, "bag (50kg)")
    insFert.run("Urea (46-0-0)", "46-0-0", "Nitrogenous", 1380.0, "bag (50kg)")
    insFert.run("Ammonium Phosphate", "16-20-0", "Starter Compound", 1420.0, "bag (50kg)")
    insFert.run("Vermicompost Organic", "2-1-1", "Organic Soil Conditioner", 450.0, "sack (40kg)")
  }

  // Seed Customers
  if (db.prepare("SELECT COUNT(*) as count FROM customers").get().count === 0) {
    const insCust = db.prepare("INSERT INTO customers (name, contact_person, phone, email, buyer_type, address) VALUES (?, ?, ?, ?, ?, ?)")
    insCust.run("National Food Authority / Regional Grain Trading", "Engr. Roberto Reyes", "0917-555-0192", "procurement@nfa-region2.gov.ph", "Government Agency", "Bayombong, Nueva Vizcaya")
    insCust.run("Davao Fresh Produce Trading Corp", "Elena Mendoza", "0918-442-8831", "orders@davaofresh.ph", "Export Wholesaler", "Davao City")
    insCust.run("Benguet Agri-Hub Coop", "Mario Dawang", "0920-771-3304", "coop@benguetagri.org", "Cooperative", "La Trinidad, Benguet")
  }

  // Seed initial Audit Log
  if (db.prepare("SELECT COUNT(*) as count FROM audit_logs").get().count === 0) {
    db.prepare("INSERT INTO audit_logs (user_name, user_role, action, module, details) VALUES (?, ?, ?, ?, ?)").run(
      "Farm Administrator",
      "admin",
      "SYSTEM_INIT",
      "Foundation & Security",
      "Initialized database schema, RBAC roles, and master reference catalogs"
    )
  }

  // Seed Field Activities
  if (db.prepare("SELECT COUNT(*) as count FROM field_activities").get().count === 0) {
    const insAct = db.prepare(
      "INSERT INTO field_activities (farm_id, field_id, crop_id, activity_type, activity_date, worker_name, hours_worked, labor_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    insAct.run(1, 1, 1, "Irrigation & Water Level Check", "2026-11-18", "Juan Dela Cruz", 6, 900, "Maintained 5cm paddy water depth")
    insAct.run(2, 5, 5, "Manual Weeding & Hilling-Up", "2026-11-20", "Field Operations Staff", 8, 1200, "Cleared inter-row weeds in Sector 2 West")
  }

  // Seed Fertilizer Applications
  if (db.prepare("SELECT COUNT(*) as count FROM fertilizer_applications").get().count === 0) {
    const insApp = db.prepare(
      "INSERT INTO fertilizer_applications (farm_id, field_id, crop_id, fertilizer_id, fertilizer_name, npk_ratio, application_date, area_hectares, dosage_per_ha, total_units, unit_price, total_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    insApp.run(1, 1, 1, 1, "Complete Fertilizer (Triple 14)", "14-14-14", "2026-11-15", 6.0, 4.0, 24.0, 1450, 34800, "Basal application for Jasmine RC222")
    insApp.run(1, 2, 2, 2, "Urea (46-0-0)", "46-0-0", "2026-11-19", 4.5, 3.0, 13.5, 1380, 18630, "Side-dress nitrogen boost for Hybrid Yellow Corn")
  }
}