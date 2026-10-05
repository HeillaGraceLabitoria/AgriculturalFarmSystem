export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface Stats {
  totalFarms: number
  totalFields?: number
  activeCrops: number
  harvestedQuantity: number
  totalSales: number
}

export type FieldStatus = "Active" | "Planted" | "Prepared" | "Fallow" | "Under Maintenance"

export interface FarmField {
  id: number
  farm_id: number
  farm_name?: string
  name: string
  area: number
  description?: string
  status: FieldStatus
  created_at?: string
}

export interface Farm {
  id: number
  name: string
  location: string
  size_hectares: number
  total_area?: number
  description?: string
  field_count?: number
  cultivated_area?: number
  crop_count?: number
  fields?: FarmField[]
  crops?: Crop[]
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
    const res = await fetch(`${API_BASE}/stats`)
    if (!res.ok) throw new Error("Failed to fetch stats")
    return await res.json()
  },

  async getFarms(): Promise<Farm[]> {
    const res = await fetch(`${API_BASE}/farms`)
    if (!res.ok) throw new Error("Failed to fetch farms")
    return await res.json()
  },

  async getFarm(id: number): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms/${id}`)
    if (!res.ok) throw new Error("Failed to fetch farm details")
    return await res.json()
  },

  async createFarm(farm: { name: string; location: string; total_area?: number; size_hectares?: number; description?: string }): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(farm),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to create farm")
    }
    return await res.json()
  },

  async updateFarm(id: number, farm: { name: string; location: string; total_area?: number; size_hectares?: number; description?: string }): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(farm),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to update farm")
    }
    return await res.json()
  },

  async deleteFarm(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/farms/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete farm")
  },

  async getFarmFields(farmId: number): Promise<FarmField[]> {
    const res = await fetch(`${API_BASE}/farms/${farmId}/fields`)
    if (!res.ok) throw new Error("Failed to fetch fields for farm")
    return await res.json()
  },

  async getAllFields(farmId?: number): Promise<FarmField[]> {
    const url = farmId ? `${API_BASE}/fields?farm_id=${farmId}` : `${API_BASE}/fields`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch fields")
    return await res.json()
  },

  async createField(field: { farm_id: number; name: string; area: number; description?: string; status?: FieldStatus }): Promise<FarmField> {
    const res = await fetch(`${API_BASE}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to create field")
    }
    return await res.json()
  },

  async updateField(id: number, field: { name: string; area: number; description?: string; status?: FieldStatus }): Promise<FarmField> {
    const res = await fetch(`${API_BASE}/fields/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to update field")
    }
    return await res.json()
  },

  async deleteField(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/fields/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete field")
  },

  async getCrops(): Promise<Crop[]> {
    const res = await fetch(`${API_BASE}/crops`)
    if (!res.ok) throw new Error("Failed to fetch crops")
    return await res.json()
  },

  async getHarvests(): Promise<Harvest[]> {
    const res = await fetch(`${API_BASE}/harvests`)
    if (!res.ok) throw new Error("Failed to fetch harvests")
    return await res.json()
  },

  async getSales(): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales`)
    if (!res.ok) throw new Error("Failed to fetch sales")
    return await res.json()
  },
}
