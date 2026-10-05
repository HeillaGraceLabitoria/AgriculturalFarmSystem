import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"

const dbDir = path.resolve(import.meta.dirname, "../data")
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
      payment_status TEXT NOT NULL DEFAULT 'paid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Ensure 'description' and 'status' columns exist in 'farms' table for existing databases
  const farmCols = db.prepare("PRAGMA table_info(farms)").all()
  if (!farmCols.some((c) => c.name === "description")) {
    db.exec("ALTER TABLE farms ADD COLUMN description TEXT")
  }
  if (!farmCols.some((c) => c.name === "status")) {
    db.exec("ALTER TABLE farms ADD COLUMN status TEXT DEFAULT 'Active'")
  }

  // Ensure 'field_id' column exists in 'crops' table
  const cropCols = db.prepare("PRAGMA table_info(crops)").all()
  if (!cropCols.some((c) => c.name === "field_id")) {
    db.exec("ALTER TABLE crops ADD COLUMN field_id INTEGER REFERENCES farm_fields(id)")
  }

  // Ensure 'farm_id' and 'field_id' columns exist in 'harvests' table
  const harvestCols = db.prepare("PRAGMA table_info(harvests)").all()
  if (!harvestCols.some((c) => c.name === "farm_id")) {
    db.exec("ALTER TABLE harvests ADD COLUMN farm_id INTEGER REFERENCES farms(id)")
  }
  if (!harvestCols.some((c) => c.name === "field_id")) {
    db.exec("ALTER TABLE harvests ADD COLUMN field_id INTEGER REFERENCES farm_fields(id)")
  }

  // Ensure 'farm_id' and 'harvest_id' columns exist in 'sales' table
  const saleCols = db.prepare("PRAGMA table_info(sales)").all()
  if (!saleCols.some((c) => c.name === "farm_id")) {
    db.exec("ALTER TABLE sales ADD COLUMN farm_id INTEGER REFERENCES farms(id)")
  }
  if (!saleCols.some((c) => c.name === "harvest_id")) {
    db.exec("ALTER TABLE sales ADD COLUMN harvest_id INTEGER REFERENCES harvests(id)")
  }

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

  // Link default crops to fields if unassigned
  try {
    const linkCropField = db.prepare("UPDATE crops SET field_id = ? WHERE id = ? AND field_id IS NULL")
    linkCropField.run(1, 1) // Rice -> North Paddy Field A
    linkCropField.run(2, 2) // Corn -> East Terrace Field B
    linkCropField.run(3, 3) // Tomato -> Greenhouse Zone C
    linkCropField.run(4, 4) // Rice -> Central Basin Field 1
    linkCropField.run(5, 5) // White Corn -> Sector 2 West
    linkCropField.run(6, 6) // Sugarcane -> Canal Plot 3
    linkCropField.run(7, 7) // Cabbage -> Terrace Slope Alpha
    linkCropField.run(8, 8) // Carrots -> Root Crop Zone
    linkCropField.run(9, 9) // Bell Pepper -> Covered Garden 1
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

  // Check if initial user exists
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run("Farm Administrator", "admin@farm.com", "admin123", "admin")
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
      INSERT INTO crops (farm_id, name, variety, planted_date, expected_harvest_date, status, area_hectares)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertCrop.run(1, "Rice", "Jasmine RC222", "2026-06-15", "2026-10-20", "growing", 6.0)
    insertCrop.run(1, "Corn", "Hybrid Yellow", "2026-07-01", "2026-10-15", "growing", 4.5)
    insertCrop.run(1, "Tomato", "Diamante Max", "2026-08-10", "2026-11-05", "growing", 2.0)
    insertCrop.run(2, "Rice", "NSIC Rc160", "2026-06-01", "2026-09-30", "harvested", 12.0)
    insertCrop.run(2, "White Corn", "Sweet Pearl", "2026-07-15", "2026-10-25", "growing", 8.0)
    insertCrop.run(2, "Sugarcane", "Phil 2006-2282", "2026-01-10", "2026-12-15", "growing", 6.0)
    insertCrop.run(3, "Cabbage", "Rare Ball", "2026-08-01", "2026-10-18", "growing", 2.5)
    insertCrop.run(3, "Carrots", "Kuroda", "2026-07-20", "2026-10-30", "growing", 2.2)
    insertCrop.run(3, "Bell Pepper", "Red Baron", "2026-08-15", "2026-11-20", "growing", 1.8)
    insertCrop.run(4, "Banana", "Cavendish", "2025-09-10", "2026-10-01", "harvested", 15.0)
    insertCrop.run(4, "Calamansi", "Native Green", "2025-05-15", "2026-10-10", "growing", 10.0)
    insertCrop.run(4, "Cassava", "Lakan 1", "2026-02-10", "2026-11-15", "growing", 8.0)

    const insertHarvest = db.prepare(`
      INSERT INTO harvests (crop_id, crop_name, farm_name, harvest_date, quantity_kg, quality_grade, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertHarvest.run(4, "Rice (NSIC Rc160)", "Sunrise Plains Farm", "2026-09-30", 12500, "A", "First batch premium yield")
    insertHarvest.run(10, "Banana (Cavendish)", "Mindanao Citrus & Palm", "2026-10-01", 5950, "A", "Export quality harvest")

    const insertSale = db.prepare(`
      INSERT INTO sales (crop_name, buyer_name, sale_date, quantity_kg, price_per_kg, total_amount, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertSale.run("Rice (NSIC Rc160)", "National Food Authority / Regional Grain Trading", "2026-10-02", 12500, 24.50, 306250.00, "paid")
    insertSale.run("Banana (Cavendish)", "Davao Fresh Produce Trading Corp", "2026-10-03", 5950, 30.00, 178500.00, "paid")
    insertSale.run("Organic Vegetables Sample", "Benguet Agri-Hub Coop", "2026-10-04", 50, 10.00, 500.00, "paid")
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
}
