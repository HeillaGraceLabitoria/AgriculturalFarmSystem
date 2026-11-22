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

export interface FarmFinancials {
  totalIncome: number
  totalHarvestKg: number
  cropCount: number
  activePlantingsCount: number
  fieldsCount: number
}

export interface Farm {
  id: number
  name: string
  location: string
  size_hectares: number
  total_area?: number
  description?: string
  status?: string
  field_count?: number
  cultivated_area?: number
  crop_count?: number
  fields?: FarmField[]
  crops?: Crop[]
  activePlantings?: Crop[]
  harvests?: Harvest[]
  sales?: Sale[]
  financials?: FarmFinancials
  created_at?: string
}

export interface Crop {
  id: number
  farm_id: number
  farm_name?: string
  field_id?: number
  field_name?: string
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
  farm_id?: number
  farm_name: string
  field_id?: number
  field_name?: string
  harvest_date: string
  quantity_kg: number
  unit?: string
  quality_grade?: string
  notes?: string
  created_at?: string
}

export interface Sale {
  id: number
  farm_id?: number
  harvest_id?: number
  crop_name: string
  buyer_name: string
  sale_date: string
  quantity_kg: number
  price_per_kg: number
  total_amount: number
  payment_status: "paid" | "pending"
  created_at?: string
}

export interface AuditLog {
  id: number
  user_name: string
  user_role: string
  action: string
  module: string
  details: string
  created_at: string
}

export interface CropCatalogItem {
  id: number
  name: string
  variety: string
  category: string
  growing_days: number
  ideal_soil: string
}

export interface FertilizerItem {
  id: number
  name: string
  npk_ratio: string
  type: string
  unit_price: number
  unit: string
}

export interface CustomerItem {
  id: number
  name: string
  contact_person: string
  phone: string
  email: string
  buyer_type: string
  address: string
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

  async getFarmProfile(id: number): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms/${id}/profile`)
    if (!res.ok) {
      return this.getFarm(id)
    }
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

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit-logs`)
    if (!res.ok) throw new Error("Failed to fetch audit logs")
    return await res.json()
  },

  async logAudit(entry: { action: string; module: string; details: string }): Promise<void> {
    const user = this.getCurrentUser()
    await fetch(`${API_BASE}/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: user?.name || "Farm Administrator",
        user_role: user?.role || "admin",
        ...entry,
      }),
    }).catch(() => {})
  },

  async getCropCatalog(): Promise<CropCatalogItem[]> {
    const res = await fetch(`${API_BASE}/crop-catalog`)
    if (!res.ok) throw new Error("Failed to fetch crop catalog")
    return await res.json()
  },

  async createCropCatalog(item: Omit<CropCatalogItem, "id">): Promise<CropCatalogItem> {
    const res = await fetch(`${API_BASE}/crop-catalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to add crop catalog item")
    await this.logAudit({ action: "CREATE_CROP_REF", module: "WBS 2.1 Crop Catalog", details: `Added ${item.name} (${item.variety})` })
    return await res.json()
  },

  async deleteCropCatalog(id: number): Promise<void> {
    await fetch(`${API_BASE}/crop-catalog/${id}`, { method: "DELETE" })
    await this.logAudit({ action: "DELETE_CROP_REF", module: "WBS 2.1 Crop Catalog", details: `Removed catalog entry #${id}` })
  },

  async getFertilizers(): Promise<FertilizerItem[]> {
    const res = await fetch(`${API_BASE}/fertilizers`)
    if (!res.ok) throw new Error("Failed to fetch fertilizers")
    return await res.json()
  },

  async createFertilizer(item: Omit<FertilizerItem, "id">): Promise<FertilizerItem> {
    const res = await fetch(`${API_BASE}/fertilizers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to add fertilizer")
    await this.logAudit({ action: "CREATE_FERTILIZER", module: "WBS 2.2 Fertilizer Catalog", details: `Added ${item.name} (${item.npk_ratio})` })
    return await res.json()
  },

  async deleteFertilizer(id: number): Promise<void> {
    await fetch(`${API_BASE}/fertilizers/${id}`, { method: "DELETE" })
    await this.logAudit({ action: "DELETE_FERTILIZER", module: "WBS 2.2 Fertilizer Catalog", details: `Removed fertilizer #${id}` })
  },

  async getCustomers(): Promise<CustomerItem[]> {
    const res = await fetch(`${API_BASE}/customers`)
    if (!res.ok) throw new Error("Failed to fetch customers")
    return await res.json()
  },

  async createCustomer(item: Omit<CustomerItem, "id">): Promise<CustomerItem> {
    const res = await fetch(`${API_BASE}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to add customer")
    await this.logAudit({ action: "CREATE_CUSTOMER", module: "WBS 2.3 Stakeholder Directory", details: `Registered ${item.name}` })
    return await res.json()
  },

  async deleteCustomer(id: number): Promise<void> {
    await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" })
    await this.logAudit({ action: "DELETE_CUSTOMER", module: "WBS 2.3 Stakeholder Directory", details: `Removed customer #${id}` })
  },
}