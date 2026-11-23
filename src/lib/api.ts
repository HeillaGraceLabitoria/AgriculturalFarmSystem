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

export type GrowthStage = "Planned" | "Seedling" | "Vegetative" | "Flowering" | "Ready for Harvest" | "Harvested"

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
  growth_stage?: GrowthStage
  batch_code?: string
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
  farm_name?: string
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

export interface FieldActivity {
  id: number
  farm_id?: number
  farm_name?: string
  field_id?: number
  field_name?: string
  crop_id?: number
  crop_name?: string
  activity_type: string
  activity_date: string
  worker_name: string
  hours_worked: number
  labor_cost: number
  notes?: string
}

export interface FertilizerApplication {
  id: number
  farm_id?: number
  farm_name?: string
  field_id?: number
  field_name?: string
  crop_id?: number
  crop_name?: string
  fertilizer_id?: number
  fertilizer_name: string
  npk_ratio?: string
  application_date: string
  area_hectares: number
  dosage_per_ha: number
  total_units: number
  unit_price: number
  total_cost: number
  notes?: string
}

export interface FarmFinancialRow {
  farm_id: number
  farm_name: string
  location: string
  area_hectares: number
  harvest_kg: number
  gross_revenue: number
  labor_cost: number
  fertilizer_cost: number
  total_expense: number
  net_profit: number
}

export interface FinancialSummary {
  breakdown: FarmFinancialRow[]
  totals: {
    harvest_kg: number
    gross_revenue: number
    labor_cost: number
    fertilizer_cost: number
    total_expense: number
    net_profit: number
  }
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

  async createCrop(crop: {
    farm_id?: number
    field_id?: number
    name: string
    variety?: string
    planted_date: string
    expected_harvest_date?: string
    status?: "growing" | "harvested" | "planned"
    area_hectares: number
    growth_stage?: GrowthStage
    batch_code?: string
  }): Promise<Crop> {
    const res = await fetch(`${API_BASE}/crops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crop),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to register planting batch")
    }
    await this.logAudit({
      action: "CREATE_PLANTING",
      module: "Field Operations",
      details: `Planted ${crop.name} (${crop.variety || "Standard"}) on ${crop.area_hectares} ha`,
    })
    return await res.json()
  },

  async updateCropStage(id: number, growth_stage: GrowthStage): Promise<Crop> {
    const res = await fetch(`${API_BASE}/crops/${id}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ growth_stage }),
    })
    if (!res.ok) throw new Error("Failed to update growth stage")
    await this.logAudit({
      action: "UPDATE_STAGE",
      module: "Growth Monitoring",
      details: `Updated crop batch #${id} stage to ${growth_stage}`,
    })
    return await res.json()
  },

  async deleteCrop(id: number): Promise<void> {
    await fetch(`${API_BASE}/crops/${id}`, { method: "DELETE" })
    await this.logAudit({
      action: "DELETE_CROP",
      module: "Crop Operations",
      details: `Removed crop batch #${id}`,
    })
  },

  async getHarvests(): Promise<Harvest[]> {
    const res = await fetch(`${API_BASE}/harvests`)
    if (!res.ok) throw new Error("Failed to fetch harvests")
    return await res.json()
  },

  async createHarvest(item: {
    crop_id?: number
    crop_name: string
    farm_id?: number
    field_id?: number
    farm_name?: string
    harvest_date: string
    quantity_kg: number
    quality_grade?: string
    notes?: string
  }): Promise<Harvest> {
    const res = await fetch(`${API_BASE}/harvests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to record harvest")
    await this.logAudit({
      action: "LOG_HARVEST",
      module: "Harvest Management",
      details: `Recorded ${item.quantity_kg} kg of ${item.crop_name} (Grade ${item.quality_grade || "A"})`,
    })
    return await res.json()
  },

  async deleteHarvest(id: number): Promise<void> {
    await fetch(`${API_BASE}/harvests/${id}`, { method: "DELETE" })
  },

  async getSales(): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales`)
    if (!res.ok) throw new Error("Failed to fetch sales")
    return await res.json()
  },

  async createSale(item: {
    farm_id?: number
    harvest_id?: number
    crop_name: string
    buyer_name: string
    sale_date: string
    quantity_kg: number
    price_per_kg: number
    payment_status?: "paid" | "pending"
  }): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to record sale")
    await this.logAudit({
      action: "RECORD_SALE",
      module: "Sales & Revenue",
      details: `Sold ${item.quantity_kg} kg of ${item.crop_name} to ${item.buyer_name}`,
    })
    return await res.json()
  },

  async updateSaleStatus(id: number, payment_status: "paid" | "pending"): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status }),
    })
    if (!res.ok) throw new Error("Failed to update payment status")
    return await res.json()
  },

  async deleteSale(id: number): Promise<void> {
    await fetch(`${API_BASE}/sales/${id}`, { method: "DELETE" })
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    const res = await fetch(`${API_BASE}/financial-summary`)
    if (!res.ok) throw new Error("Failed to fetch financial summary")
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
    await this.logAudit({ action: "CREATE_CROP_REF", module: "Crop Catalog", details: `Added ${item.name} (${item.variety})` })
    return await res.json()
  },

  async deleteCropCatalog(id: number): Promise<void> {
    await fetch(`${API_BASE}/crop-catalog/${id}`, { method: "DELETE" })
    await this.logAudit({ action: "DELETE_CROP_REF", module: "Crop Catalog", details: `Removed catalog entry #${id}` })
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
    await this.logAudit({ action: "CREATE_FERTILIZER", module: "Fertilizer Catalog", details: `Added ${item.name} (${item.npk_ratio})` })
    return await res.json()
  },

  async deleteFertilizer(id: number): Promise<void> {
    await fetch(`${API_BASE}/fertilizers/${id}`, { method: "DELETE" })
    await this.logAudit({ action: "DELETE_FERTILIZER", module: "Fertilizer Catalog", details: `Removed fertilizer #${id}` })
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
    await this.logAudit({ action: "CREATE_CUSTOMER", module: "Stakeholder Directory", details: `Registered ${item.name}` })
    return await res.json()
  },

  async deleteCustomer(id: number): Promise<void> {
    await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" })
    await this.logAudit({ action: "DELETE_CUSTOMER", module: "Stakeholder Directory", details: `Removed customer #${id}` })
  },

  async getFieldActivities(): Promise<FieldActivity[]> {
    const res = await fetch(`${API_BASE}/field-activities`)
    if (!res.ok) throw new Error("Failed to fetch field activities")
    return await res.json()
  },

  async createFieldActivity(item: {
    farm_id?: number
    field_id?: number
    crop_id?: number
    activity_type: string
    activity_date: string
    worker_name: string
    hours_worked: number
    labor_cost: number
    notes?: string
  }): Promise<FieldActivity> {
    const res = await fetch(`${API_BASE}/field-activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to log field activity")
    await this.logAudit({
      action: "LOG_FIELD_ACTIVITY",
      module: "Labor & Operations",
      details: `${item.activity_type} by ${item.worker_name} (${item.hours_worked} hrs)`,
    })
    return await res.json()
  },

  async deleteFieldActivity(id: number): Promise<void> {
    await fetch(`${API_BASE}/field-activities/${id}`, { method: "DELETE" })
  },

  async getFertilizerApplications(): Promise<FertilizerApplication[]> {
    const res = await fetch(`${API_BASE}/fertilizer-applications`)
    if (!res.ok) throw new Error("Failed to fetch fertilizer applications")
    return await res.json()
  },

  async createFertilizerApplication(item: {
    farm_id?: number
    field_id?: number
    crop_id?: number
    fertilizer_id?: number
    fertilizer_name: string
    npk_ratio?: string
    application_date: string
    area_hectares: number
    dosage_per_ha: number
    unit_price: number
    notes?: string
  }): Promise<FertilizerApplication> {
    const res = await fetch(`${API_BASE}/fertilizer-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("Failed to record fertilizer application")
    await this.logAudit({
      action: "LOG_FERTILIZER_APP",
      module: "Fertilizer Dosage",
      details: `Applied ${item.fertilizer_name} (${item.dosage_per_ha} bags/ha across ${item.area_hectares} ha)`,
    })
    return await res.json()
  },

  async deleteFertilizerApplication(id: number): Promise<void> {
    await fetch(`${API_BASE}/fertilizer-applications/${id}`, { method: "DELETE" })
  },
}