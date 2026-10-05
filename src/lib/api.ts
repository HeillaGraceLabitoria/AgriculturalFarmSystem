export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface Stats {
  totalFarms: number
  activeCrops: number
  harvestedQuantity: number
  totalSales: number
}

export interface Farm {
  id: number
  name: string
  location: string
  size_hectares: number
  crop_count?: number
  created_at?: string
}

export interface Crop {
  id: number
  farm_id: number
  farm_name?: string
  name: string
  variety?: string
  planted_date: string
  expected_harvest_date?: string
  status: "growing" | "harvested" | "planned"
  area_hectares: number
  created_at?: string
}

export interface Harvest {
  id: number
  crop_id?: number
  crop_name: string
  farm_name: string
  harvest_date: string
  quantity_kg: number
  quality_grade: string
  notes?: string
  created_at?: string
}

export interface Sale {
  id: number
  crop_name: string
  buyer_name: string
  sale_date: string
  quantity_kg: number
  price_per_kg: number
  total_amount: number
  payment_status: "paid" | "pending"
  created_at?: string
}

const API_BASE = import.meta.env.VITE_API_URL || "/api"

// Default seed data for offline / static fallback
const fallbackStats: Stats = {
  totalFarms: 4,
  activeCrops: 10,
  harvestedQuantity: 18450,
  totalSales: 485250,
}

const fallbackFarms: Farm[] = [
  { id: 1, name: "Green Valley Agri Farm", location: "Laguna, Region IV-A", size_hectares: 15.5, crop_count: 3 },
  { id: 2, name: "Sunrise Plains Farm", location: "Nueva Ecija, Central Luzon", size_hectares: 28.0, crop_count: 3 },
  { id: 3, name: "Highland Organic Fields", location: "Benguet, CAR", size_hectares: 8.2, crop_count: 3 },
  { id: 4, name: "Mindanao Citrus & Palm", location: "Davao del Norte, Region XI", size_hectares: 35.0, crop_count: 3 },
]

export const api = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Invalid credentials")
      }

      const data = await res.json()
      localStorage.setItem("farm_user", JSON.stringify(data.user))
      localStorage.setItem("farm_token", data.token)
      return data
    } catch (err: any) {
      // Offline fallback: verify admin credentials
      if (email.trim().toLowerCase() === "admin@farm.com" && password === "admin123") {
        const user: User = {
          id: 1,
          name: "Farm Administrator",
          email: "admin@farm.com",
          role: "admin",
        }
        localStorage.setItem("farm_user", JSON.stringify(user))
        localStorage.setItem("farm_token", "local-token-offline")
        return { user, token: "local-token-offline" }
      }
      throw new Error(err.message || "Login failed")
    }
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem("farm_user")
    return data ? JSON.parse(data) : null
  },

  logout() {
    localStorage.removeItem("farm_user")
    localStorage.removeItem("farm_token")
  },

  async getStats(): Promise<Stats> {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return fallbackStats
  },

  async getFarms(): Promise<Farm[]> {
    try {
      const res = await fetch(`${API_BASE}/farms`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return fallbackFarms
  },

  async createFarm(farm: Omit<Farm, "id" | "created_at" | "crop_count">): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(farm),
    })
    if (!res.ok) throw new Error("Failed to create farm")
    return await res.json()
  },

  async deleteFarm(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/farms/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete farm")
  },

  async getCrops(): Promise<Crop[]> {
    try {
      const res = await fetch(`${API_BASE}/crops`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return []
  },

  async getHarvests(): Promise<Harvest[]> {
    try {
      const res = await fetch(`${API_BASE}/harvests`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return []
  },

  async getSales(): Promise<Sale[]> {
    try {
      const res = await fetch(`${API_BASE}/sales`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return []
  },
}
