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

  // Check if initial user exists
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run("Farm Administrator", "admin@farm.com", "admin123", "admin")
  }

  // Check if farms exist
  const farmCount = db.prepare("SELECT COUNT(*) as count FROM farms").get().count
  if (farmCount === 0) {
    const insertFarm = db.prepare("INSERT INTO farms (name, location, size_hectares) VALUES (?, ?, ?)")
    insertFarm.run("Green Valley Agri Farm", "Laguna, Region IV-A", 15.5)
    insertFarm.run("Sunrise Plains Farm", "Nueva Ecija, Central Luzon", 28.0)
    insertFarm.run("Highland Organic Fields", "Benguet, CAR", 8.2)
    insertFarm.run("Mindanao Citrus & Palm", "Davao del Norte, Region XI", 35.0)

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
}
