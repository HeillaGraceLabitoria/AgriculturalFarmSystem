import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  api,
  type Farm,
  type FarmField,
  type Crop,
  type Harvest,
  type Sale,
  type FieldStatus,
} from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  MapPin,
  Maximize2,
  Plus,
  Edit,
  Trash2,
  Layers,
  Sprout,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  PauseCircle,
  Database,
  RefreshCw,
  PhilippinePeso,
  Wheat,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Building2,
  Activity,
  Package,
} from "lucide-react"

const FIELD_STATUSES: FieldStatus[] = [
  "Active",
  "Planted",
  "Prepared",
  "Fallow",
  "Under Maintenance",
]

type TabFilter = "all" | "info" | "fields" | "crops" | "plantings" | "harvests" | "sales"

function getFieldStatusBadge(status: FieldStatus) {
  switch (status) {
    case "Planted":
      return (
        <Badge className="bg-[#2D5A27]/15 text-[#2D5A27] border-[#2D5A27]/30 gap-1 font-semibold text-xs">
          <Sprout className="h-3 w-3 text-[#2D5A27]" />
          Planted
        </Badge>
      )
    case "Active":
      return (
        <Badge className="bg-[#87A987]/20 text-[#2D5A27] border-[#87A987]/40 gap-1 font-semibold text-xs">
          <CheckCircle2 className="h-3 w-3 text-[#2D5A27]" />
          Active
        </Badge>
      )
    case "Prepared":
      return (
        <Badge className="bg-[#D8E2DC] text-[#1F2922] border-[#87A987]/40 gap-1 font-semibold text-xs">
          <Clock className="h-3 w-3 text-[#5B6E61]" />
          Prepared
        </Badge>
      )
    case "Fallow":
      return (
        <Badge className="bg-[#F9FBF7] text-[#5B6E61] border-[#D8E2DC] gap-1 font-medium text-xs">
          <PauseCircle className="h-3 w-3 text-[#5B6E61]" />
          Fallow
        </Badge>
      )
    case "Under Maintenance":
      return (
        <Badge className="bg-[#DDA15E]/20 text-[#1F2922] border-[#DDA15E]/50 gap-1 font-semibold text-xs">
          <Wrench className="h-3 w-3 text-[#DDA15E]" />
          Maintenance
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getCropStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "growing":
      return (
        <Badge className="bg-[#2D5A27]/15 text-[#2D5A27] border-[#2D5A27]/30 gap-1 font-semibold text-xs">
          <Sprout className="h-3 w-3 text-[#2D5A27]" />
          Growing
        </Badge>
      )
    case "harvested":
      return (
        <Badge className="bg-[#DDA15E]/20 text-[#1F2922] border-[#DDA15E]/50 gap-1 font-semibold text-xs">
          <Wheat className="h-3 w-3 text-[#DDA15E]" />
          Harvested
        </Badge>
      )
    case "planned":
      return (
        <Badge className="bg-[#D8E2DC] text-[#1F2922] border-[#87A987]/40 gap-1 font-semibold text-xs">
          <Clock className="h-3 w-3 text-[#5B6E61]" />
          Planned
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function FarmDetails() {
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()

  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<TabFilter>("all")

  // Add Field Dialog state
  const [openAddModal, setOpenAddModal] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [fieldArea, setFieldArea] = useState("")
  const [fieldDescription, setFieldDescription] = useState("")
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>("Active")
  const [savingField, setSavingField] = useState(false)
  const [fieldFormError, setFieldFormError] = useState("")

  // Edit Field Dialog state
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
  const [editFieldName, setEditFieldName] = useState("")
  const [editFieldArea, setEditFieldArea] = useState("")
  const [editFieldDescription, setEditFieldDescription] = useState("")
  const [editFieldStatus, setEditFieldStatus] = useState<FieldStatus>("Active")
  const [updatingField, setUpdatingField] = useState(false)
  const [editFieldFormError, setEditFieldFormError] = useState("")

  // Deleting field state
  const [deletingFieldId, setDeletingFieldId] = useState<number | null>(null)

  const id = Number(farmId)

  async function loadData() {
    if (!id || isNaN(id)) {
      setError("Invalid Farm ID provided in route.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const farmData = await api.getFarmProfile(id)
      setFarm(farmData)
    } catch (err: any) {
      setError(err.message || "Failed to load consolidated farm profile.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault()
    setFieldFormError("")

    if (!fieldName.trim()) {
      setFieldFormError("Field name is required.")
      return
    }
    const areaNum = Number(fieldArea)
    if (isNaN(areaNum) || areaNum <= 0) {
      setFieldFormError("Please enter a valid positive area in hectares.")
      return
    }

    setSavingField(true)
    try {
      await api.createField({
        farm_id: id,
        name: fieldName.trim(),
        area: areaNum,
        description: fieldDescription.trim(),
        status: fieldStatus,
      })

      setFieldName("")
      setFieldArea("")
      setFieldDescription("")
      setFieldStatus("Active")
      setOpenAddModal(false)
      await loadData()
    } catch (err: any) {
      setFieldFormError(err.message || "Failed to create field.")
    } finally {
      setSavingField(false)
    }
  }

  function openEditField(field: FarmField) {
    setEditingFieldId(field.id)
    setEditFieldName(field.name)
    setEditFieldArea(String(field.area))
    setEditFieldDescription(field.description || "")
    setEditFieldStatus(field.status)
    setEditFieldFormError("")
    setOpenEditModal(true)
  }

  async function handleEditField(e: React.FormEvent) {
    e.preventDefault()
    if (!editingFieldId) return
    setEditFieldFormError("")

    if (!editFieldName.trim()) {
      setEditFieldFormError("Field name is required.")
      return
    }
    const areaNum = Number(editFieldArea)
    if (isNaN(areaNum) || areaNum <= 0) {
      setEditFieldFormError("Please enter a valid positive area in hectares.")
      return
    }

    setUpdatingField(true)
    try {
      await api.updateField(editingFieldId, {
        name: editFieldName.trim(),
        area: areaNum,
        description: editFieldDescription.trim(),
        status: editFieldStatus,
      })

      setOpenEditModal(false)
      await loadData()
    } catch (err: any) {
      setEditFieldFormError(err.message || "Failed to update field.")
    } finally {
      setUpdatingField(false)
    }
  }

  async function handleDeleteField(fieldId: number) {
    if (!confirm("Are you sure you want to remove this farm field / area?")) return
    setDeletingFieldId(fieldId)
    try {
      await api.deleteField(fieldId)
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to delete field.")
    } finally {
      setDeletingFieldId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FBF7] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[#5B6E61]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#2D5A27]" />
          <p className="text-sm font-medium">Loading Consolidated Farm Profile from SQLite database...</p>
        </div>
      </div>
    )
  }

  if (error || !farm) {
    return (
      <div className="min-h-screen bg-[#F9FBF7] p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-[#FFFFFF] p-6 rounded-2xl border border-[#DDA15E]/50 text-center space-y-4 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-[#DDA15E]" />
          <h2 className="text-lg font-bold text-[#1F2922]">Farm Not Found</h2>
          <p className="text-xs text-[#5B6E61]">{error || "Could not retrieve the requested farm profile."}</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={loadData}
              className="border-[#D8E2DC] text-[#1F2922] hover:bg-[#D8E2DC]/30 text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
            <Button
              onClick={() => navigate("/farms")}
              className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold text-xs"
            >
              Back to Farm Management
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Relational datasets
  const fields = farm.fields || []
  const crops = farm.crops || []
  const activePlantings = farm.activePlantings || crops.filter((c) => c.status !== "harvested")
  const harvests = farm.harvests || []
  const sales = farm.sales || []

  // Land measurements
  const totalFarmArea = farm.total_area ?? farm.size_hectares ?? 0
  const allocatedArea = fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0)
  const remainingArea = Math.max(0, totalFarmArea - allocatedArea)
  const utilizationPercent =
    totalFarmArea > 0 ? Math.min(100, Math.round((allocatedArea / totalFarmArea) * 100)) : 0

  // Financial & Production calculations directly from SQLite records
  const totalIncome =
    farm.financials?.totalIncome ??
    sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
  const totalHarvestKg =
    farm.financials?.totalHarvestKg ??
    harvests.reduce((sum, h) => sum + (Number(h.quantity_kg) || 0), 0)
  const totalKgSold = sales.reduce((sum, s) => sum + (Number(s.quantity_kg) || 0), 0)

  // Revenue by crop breakdown
  const salesByCrop: Record<string, { totalAmount: number; totalKg: number; count: number }> = {}
  for (const s of sales) {
    if (!salesByCrop[s.crop_name]) {
      salesByCrop[s.crop_name] = { totalAmount: 0, totalKg: 0, count: 0 }
    }
    salesByCrop[s.crop_name].totalAmount += Number(s.total_amount) || 0
    salesByCrop[s.crop_name].totalKg += Number(s.quantity_kg) || 0
    salesByCrop[s.crop_name].count += 1
  }

  return (
    <div className="min-h-screen bg-[#F9FBF7] text-[#1F2922]">
      {/* Top Header - Forest Flora (#2D5A27) */}
      <header className="sticky top-0 z-20 border-b border-[#23471E] bg-[#2D5A27] text-[#F9FBF7] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/farms")}
            className="text-[#D8E2DC] hover:text-[#F9FBF7] hover:bg-[#23471E]"
            title="Back to Farm Management"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#F9FBF7]">
                {farm.name}
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] bg-[#87A987]/25 text-[#F9FBF7] border-[#87A987]/50 font-semibold"
              >
                <Database className="mr-1 h-2.5 w-2.5 text-[#D8E2DC]" />
                Farm #{farm.id}
              </Badge>
              <Badge
                className="text-[10px] bg-[#F9FBF7] text-[#2D5A27] font-bold border-none"
              >
                {farm.status || "Active"}
              </Badge>
            </div>
            <p className="text-xs text-[#D8E2DC] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-[#87A987]" />
              <span>{farm.location}</span>
              <span className="text-[#87A987] mx-1">•</span>
              <span>WBS 3.3 Consolidated Farm Profile</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-[#87A987]/50 bg-transparent text-[#F9FBF7] hover:bg-[#23471E] hover:text-[#F9FBF7] gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setFieldFormError("")
              setOpenAddModal(true)
            }}
            className="bg-[#87A987] hover:bg-[#739873] text-[#1F2922] gap-1.5 shadow-xs font-bold"
          >
            <Plus className="h-4 w-4 text-[#1F2922]" />
            Add Field
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Consolidated KPI Summary Ribbon */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* KPI 1: Total Area */}
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Total Land Area
              </CardTitle>
              <div className="p-2 bg-[#D8E2DC]/50 rounded-lg">
                <Maximize2 className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">
                {totalFarmArea} <span className="font-normal text-xs text-[#5B6E61]">ha</span>
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">
                {allocatedArea.toFixed(1)} ha allocated ({utilizationPercent}%)
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: Fields */}
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Zoned Fields
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <Layers className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">{fields.length}</div>
              <p className="text-xs text-[#5B6E61] mt-1">
                {fields.filter((f) => f.status === "Planted").length} currently planted
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: Active Plantings */}
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Active Plantings
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <Sprout className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">{activePlantings.length}</div>
              <p className="text-xs text-[#5B6E61] mt-1">
                {crops.length} total crop {crops.length === 1 ? "record" : "records"}
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: Harvests */}
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#DDA15E] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Harvest Yield
              </CardTitle>
              <div className="p-2 bg-[#DDA15E]/20 rounded-lg">
                <Wheat className="h-4 w-4 text-[#DDA15E]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">
                {totalHarvestKg.toLocaleString()} <span className="font-normal text-xs text-[#5B6E61]">kg</span>
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">
                {harvests.length} recorded {harvests.length === 1 ? "yield" : "yields"}
              </p>
            </CardContent>
          </Card>

          {/* KPI 5: Farm Sales Income */}
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Farm Sales Income
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <PhilippinePeso className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-[#2D5A27]">
                ₱{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">
                From {sales.length} SQLite {sales.length === 1 ? "sale" : "sales"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sub-Navigation Filter Pills (Dusty Sage #87A987 & Whisper Green #D8E2DC) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#FFFFFF] p-2 rounded-xl border border-[#D8E2DC] shadow-xs">
          <span className="text-xs font-semibold text-[#5B6E61] px-2 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-[#2D5A27]" />
            Sections:
          </span>
          {[
            { id: "all", label: "Consolidated Profile (All)" },
            { id: "info", label: "1. Farm Info & Land" },
            { id: "fields", label: `2. Fields Summary (${fields.length})` },
            { id: "crops", label: `3. Crop Catalog (${crops.length})` },
            { id: "plantings", label: `4. Active Plantings (${activePlantings.length})` },
            { id: "harvests", label: `5. Harvest History (${harvests.length})` },
            { id: "sales", label: `6 & 7. Sales & Income (₱${totalIncome.toLocaleString()})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#87A987] text-[#1F2922] shadow-xs"
                  : "text-[#5B6E61] hover:text-[#1F2922] hover:bg-[#D8E2DC]/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. Farm Information Section */}
        {(activeTab === "all" || activeTab === "info") && (
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#D8E2DC]/50 rounded-lg">
                    <Building2 className="h-4 w-4 text-[#2D5A27]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#1F2922]">
                      1. Farm Information & Geographic Boundary
                    </CardTitle>
                    <CardDescription className="text-xs text-[#5B6E61]">
                      Core profile attributes, location coordinates, total acreage, and operational status
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-[#2D5A27]/15 text-[#2D5A27] border-[#2D5A27]/30 font-semibold self-start sm:self-auto">
                  Status: {farm.status || "Active"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#F9FBF7] p-4 rounded-xl border border-[#D8E2DC] text-xs">
                <div>
                  <span className="text-[#5B6E61] font-semibold uppercase text-[10px] block">
                    Farm Name
                  </span>
                  <span className="text-sm font-bold text-[#1F2922] mt-0.5 block">
                    {farm.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6E61] font-semibold uppercase text-[10px] block">
                    Location / Province
                  </span>
                  <span className="text-sm font-semibold text-[#1F2922] mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#87A987] shrink-0" />
                    {farm.location}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6E61] font-semibold uppercase text-[10px] block">
                    Total Registered Area
                  </span>
                  <span className="text-sm font-bold text-[#1F2922] mt-0.5 block">
                    {totalFarmArea} hectares
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6E61] font-semibold uppercase text-[10px] block">
                    Database Record
                  </span>
                  <span className="text-sm font-semibold text-[#1F2922] mt-0.5 flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-[#2D5A27]" />
                    Local SQLite ID #{farm.id}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-semibold text-[#5B6E61] uppercase text-[10px]">
                  Description & Operational Notes
                </Label>
                <div className="mt-1 p-3.5 bg-[#FFFFFF] rounded-lg border border-[#D8E2DC] text-xs text-[#1F2922] leading-relaxed">
                  {farm.description || (
                    <span className="text-[#5B6E61] italic">
                      No description provided for this agricultural site.
                    </span>
                  )}
                </div>
              </div>

              {/* Land Allocation Bar */}
              <div className="p-4 bg-[#F9FBF7] rounded-xl border border-[#D8E2DC] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-[#5B6E61] gap-1">
                  <span>
                    Land Allocation:{" "}
                    <strong className="text-[#1F2922] font-bold">
                      {allocatedArea.toFixed(1)} ha
                    </strong>{" "}
                    of {totalFarmArea} ha allocated across {fields.length} {fields.length === 1 ? "field" : "fields"} ({utilizationPercent}%)
                  </span>
                  <span className="font-medium text-[#2D5A27]">
                    {remainingArea.toFixed(1)} ha unassigned / reserve
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#D8E2DC] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      utilizationPercent > 100 ? "bg-[#DDA15E]" : "bg-[#2D5A27]"
                    }`}
                    style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                  />
                </div>
                {utilizationPercent > 100 && (
                  <p className="text-[11px] text-[#DDA15E] font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-[#DDA15E]" />
                    Attention: Total field area exceeds registered farm land size!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Farm Area / Field Summary Section */}
        {(activeTab === "all" || activeTab === "fields") && (
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#87A987]/20 rounded-lg">
                    <Layers className="h-4 w-4 text-[#2D5A27]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-[#1F2922]">
                        2. Farm Area / Field Summary
                      </CardTitle>
                      <Badge variant="secondary" className="bg-[#87A987]/20 text-[#2D5A27] font-semibold text-xs border border-[#87A987]/40">
                        {fields.length} {fields.length === 1 ? "Field" : "Fields"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-[#5B6E61]">
                      Subdivided fields, plots, designated acreage, and soil preparation status
                    </CardDescription>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setFieldFormError("")
                    setOpenAddModal(true)
                  }}
                  className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] gap-1.5 shadow-xs font-semibold text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Field / Area
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {fields.length > 0 ? (
                <div className="rounded-xl border border-[#D8E2DC] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#D8E2DC]/40 text-[#1F2922]">
                      <TableRow className="border-[#D8E2DC]">
                        <TableHead className="font-bold text-xs text-[#1F2922]">Field Name</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Field Area</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Share of Farm</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Status</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Description / Soil Notes</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((f) => {
                        const share =
                          totalFarmArea > 0 ? ((f.area / totalFarmArea) * 100).toFixed(1) : "0"
                        return (
                          <TableRow key={f.id} className="border-[#D8E2DC] hover:bg-[#D8E2DC]/20">
                            <TableCell className="font-bold text-xs text-[#1F2922]">
                              {f.name}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-[#1F2922]">
                              {f.area} <span className="font-normal text-[#5B6E61]">ha</span>
                            </TableCell>
                            <TableCell className="text-xs text-[#5B6E61]">
                              {share}%
                            </TableCell>
                            <TableCell className="text-xs">
                              {getFieldStatusBadge(f.status)}
                            </TableCell>
                            <TableCell className="text-xs text-[#5B6E61] max-w-xs truncate">
                              {f.description || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-[#5B6E61] hover:text-[#2D5A27] hover:bg-[#D8E2DC]/40 gap-1 font-semibold"
                                  onClick={() => openEditField(f)}
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-[#5B6E61] hover:text-[#DDA15E] hover:bg-[#DDA15E]/15 gap-1"
                                  disabled={deletingFieldId === f.id}
                                  onClick={() => handleDeleteField(f.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center bg-[#F9FBF7] rounded-xl border border-dashed border-[#D8E2DC] p-6">
                  <Layers className="mx-auto h-10 w-10 text-[#87A987] mb-2" />
                  <p className="font-bold text-sm text-[#1F2922]">No fields created for this farm yet</p>
                  <p className="text-xs text-[#5B6E61] max-w-sm mx-auto mt-1 mb-4">
                    Subdivide this farm into designated fields or plots to organize crops, planting cycles, and harvest tracking.
                  </p>
                  <Button
                    onClick={() => {
                      setFieldFormError("")
                      setOpenAddModal(true)
                    }}
                    className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] gap-1.5 font-semibold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add First Field
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. Crop Information Section */}
        {(activeTab === "all" || activeTab === "crops") && (
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#D8E2DC]/50 rounded-lg">
                    <Sprout className="h-4 w-4 text-[#2D5A27]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-[#1F2922]">
                        3. Crop Information
                      </CardTitle>
                      <Badge variant="secondary" className="bg-[#87A987]/20 text-[#2D5A27] font-semibold text-xs border border-[#87A987]/40">
                        {crops.length} {crops.length === 1 ? "Crop" : "Crops"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-[#5B6E61]">
                      Crops planted in this farm, crop varieties, related fields, and current growing/harvest status
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {crops.length > 0 ? (
                <div className="rounded-xl border border-[#D8E2DC] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#D8E2DC]/40 text-[#1F2922]">
                      <TableRow className="border-[#D8E2DC]">
                        <TableHead className="font-bold text-xs text-[#1F2922]">Crop Name</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Variety</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Related Field</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Area Cultivated</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Planted Date</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Expected Harvest</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crops.map((c) => (
                        <TableRow key={c.id} className="border-[#D8E2DC] hover:bg-[#D8E2DC]/20">
                          <TableCell className="font-bold text-xs text-[#1F2922]">
                            {c.name}
                          </TableCell>
                          <TableCell className="text-xs text-[#5B6E61]">
                            {c.variety || "-"}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-[#1F2922]">
                            {c.field_name ? (
                              <span className="flex items-center gap-1">
                                <Layers className="h-3 w-3 text-[#2D5A27]" />
                                {c.field_name}
                              </span>
                            ) : (
                              <span className="text-[#5B6E61] italic">General Farm Area</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-[#1F2922]">
                            {c.area_hectares} <span className="font-normal text-[#5B6E61]">ha</span>
                          </TableCell>
                          <TableCell className="text-xs text-[#5B6E61]">
                            {c.planted_date}
                          </TableCell>
                          <TableCell className="text-xs text-[#5B6E61]">
                            {c.expected_harvest_date || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {getCropStatusBadge(c.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center bg-[#F9FBF7] rounded-xl border border-dashed border-[#D8E2DC] p-6">
                  <Sprout className="mx-auto h-8 w-8 text-[#87A987] mb-2" />
                  <p className="font-bold text-xs text-[#1F2922]">No crops registered for this farm</p>
                  <p className="text-xs text-[#5B6E61] mt-0.5">
                    Crop cultivation records will appear here once registered under this farm's fields.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 4. Active Planting Activities Section */}
        {(activeTab === "all" || activeTab === "plantings") && (
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#87A987]/20 rounded-lg">
                    <Activity className="h-4 w-4 text-[#2D5A27]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-[#1F2922]">
                        4. Active Planting Activities
                      </CardTitle>
                      <Badge className="bg-[#2D5A27] text-[#F9FBF7] font-semibold text-xs border-none">
                        {activePlantings.length} Active
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-[#5B6E61]">
                      Active planting records associated with this farm currently growing in fields
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {activePlantings.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activePlantings.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-[#D8E2DC] bg-[#F9FBF7] hover:border-[#87A987] transition flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-[#1F2922] block">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-[#5B6E61]">
                              {p.variety ? `Variety: ${p.variety}` : "Standard variety"}
                            </span>
                          </div>
                          {getCropStatusBadge(p.status)}
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[#5B6E61]">
                            <span>Field Plot:</span>
                            <strong className="text-[#1F2922] flex items-center gap-1 font-semibold">
                              <Layers className="h-3 w-3 text-[#2D5A27]" />
                              {p.field_name || "General Farm Plot"}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between text-[#5B6E61]">
                            <span>Cultivated Area:</span>
                            <span className="text-[#1F2922] font-semibold">
                              {p.area_hectares} ha
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[#5B6E61]">
                            <span>Planting Date:</span>
                            <span className="text-[#1F2922] font-medium">{p.planted_date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#D8E2DC] flex items-center justify-between text-xs">
                        <span className="text-[#5B6E61] text-[11px] flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#DDA15E]" />
                          Expected Harvest:
                        </span>
                        <span className="font-bold text-[#1F2922]">
                          {p.expected_harvest_date || "TBD"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center bg-[#F9FBF7] rounded-xl border border-dashed border-[#D8E2DC] p-6">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-[#87A987] mb-2" />
                  <p className="font-bold text-xs text-[#1F2922]">No active planting activities</p>
                  <p className="text-xs text-[#5B6E61] mt-0.5">
                    All crops have been harvested or the farm is currently in preparation for the next cycle.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 5. Harvest History Section */}
        {(activeTab === "all" || activeTab === "harvests") && (
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#DDA15E]/20 rounded-lg">
                    <Wheat className="h-4 w-4 text-[#DDA15E]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-[#1F2922]">
                        5. Harvest History
                      </CardTitle>
                      <Badge variant="secondary" className="bg-[#DDA15E]/20 text-[#1F2922] font-semibold text-xs border border-[#DDA15E]/40">
                        {harvests.length} {harvests.length === 1 ? "Record" : "Records"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-[#5B6E61]">
                      Historical log of agricultural yields collected from this farm's fields
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {harvests.length > 0 ? (
                <div className="rounded-xl border border-[#D8E2DC] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#D8E2DC]/40 text-[#1F2922]">
                      <TableRow className="border-[#D8E2DC]">
                        <TableHead className="font-bold text-xs text-[#1F2922]">Harvest Date</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Crop</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Field Plot</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Quantity Harvested</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Unit</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Quality Grade</TableHead>
                        <TableHead className="font-bold text-xs text-[#1F2922]">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {harvests.map((h) => (
                        <TableRow key={h.id} className="border-[#D8E2DC] hover:bg-[#D8E2DC]/20">
                          <TableCell className="font-semibold text-xs text-[#1F2922]">
                            {h.harvest_date}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-[#1F2922]">
                            {h.crop_name}
                          </TableCell>
                          <TableCell className="text-xs text-[#1F2922]">
                            {h.field_name ? (
                              <span className="flex items-center gap-1 font-medium">
                                <Layers className="h-3 w-3 text-[#2D5A27]" />
                                {h.field_name}
                              </span>
                            ) : (
                              <span className="text-[#5B6E61] italic">{h.farm_name || "Farm Yield"}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-extrabold text-xs text-[#1F2922]">
                            {h.quantity_kg.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-[#5B6E61]">
                            {h.unit || "kg"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge className="bg-[#2D5A27]/15 text-[#2D5A27] border-[#2D5A27]/30 text-xs">
                              {h.quality_grade ? `Grade ${h.quality_grade}` : "Standard"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-[#5B6E61] max-w-xs truncate">
                            {h.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center bg-[#F9FBF7] rounded-xl border border-dashed border-[#D8E2DC] p-6">
                  <Wheat className="mx-auto h-8 w-8 text-[#87A987] mb-2" />
                  <p className="font-bold text-xs text-[#1F2922]">No harvest history recorded yet</p>
                  <p className="text-xs text-[#5B6E61] mt-0.5">
                    Completed harvest batches for this farm will be cataloged here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 6. Sales & 7. Farm Income Section */}
        {(activeTab === "all" || activeTab === "sales") && (
          <div className="space-y-6">
            {/* 7. Farm Income Highlight Card */}
            <Card className="border-[#2D5A27] bg-[#FFFFFF] shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#2D5A27] via-[#2D5A27] to-[#1E3F1A] p-6 text-[#F9FBF7]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#87A987] flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-[#87A987]" />
                      7. Farm Sales Income
                    </span>
                    <div className="text-3xl sm:text-4xl font-black mt-1 text-white">
                      ₱{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-[#D8E2DC] mt-1 max-w-xl">
                      Total sales income calculated directly from SQLite sales records associated with {farm.name}.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-28 border border-white/10">
                      <span className="block text-[11px] text-[#D8E2DC] font-medium">Quantity Sold</span>
                      <span className="text-lg font-bold text-white">
                        {totalKgSold.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-28 border border-white/10">
                      <span className="block text-[11px] text-[#D8E2DC] font-medium">Sales Count</span>
                      <span className="text-lg font-bold text-white">{sales.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crop Revenue Breakdown Pills */}
              {Object.keys(salesByCrop).length > 0 && (
                <div className="p-4 bg-[#F9FBF7] border-t border-[#D8E2DC] flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#5B6E61] mr-1">Revenue by Produce:</span>
                  {Object.entries(salesByCrop).map(([cropName, data]) => (
                    <Badge
                      key={cropName}
                      variant="outline"
                      className="bg-[#FFFFFF] border-[#D8E2DC] text-xs py-1 px-2.5 text-[#1F2922]"
                    >
                      <Package className="mr-1 h-3 w-3 text-[#2D5A27]" />
                      <strong className="text-[#2D5A27] mr-1">{cropName}:</strong>
                      ₱{data.totalAmount.toLocaleString()} ({data.totalKg.toLocaleString()} kg)
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* 6. Sales Records Table */}
            <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs">
              <CardHeader className="pb-3 border-b border-[#D8E2DC]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#87A987]/20 rounded-lg">
                      <ShoppingBag className="h-4 w-4 text-[#2D5A27]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-[#1F2922]">
                          6. Sales Transactions
                        </CardTitle>
                        <Badge variant="secondary" className="bg-[#87A987]/20 text-[#2D5A27] font-semibold text-xs border border-[#87A987]/40">
                          {sales.length} {sales.length === 1 ? "Sale" : "Sales"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-[#5B6E61]">
                        Commercial sale records, purchasers, unit pricing, and transaction receipts for this farm
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {sales.length > 0 ? (
                  <div className="rounded-xl border border-[#D8E2DC] overflow-hidden">
                    <Table>
                      <TableHeader className="bg-[#D8E2DC]/40 text-[#1F2922]">
                        <TableRow className="border-[#D8E2DC]">
                          <TableHead className="font-bold text-xs text-[#1F2922]">Sale Date</TableHead>
                          <TableHead className="font-bold text-xs text-[#1F2922]">Product / Crop</TableHead>
                          <TableHead className="font-bold text-xs text-[#1F2922]">Buyer / Purchaser</TableHead>
                          <TableHead className="font-bold text-xs text-[#1F2922]">Quantity</TableHead>
                          <TableHead className="font-bold text-xs text-[#1F2922]">Unit Price</TableHead>
                          <TableHead className="font-bold text-xs text-[#1F2922]">Total Amount</TableHead>
                          <TableHead className="font-bold text-xs text-[#1F2922]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((s) => (
                          <TableRow key={s.id} className="border-[#D8E2DC] hover:bg-[#D8E2DC]/20">
                            <TableCell className="font-semibold text-xs text-[#1F2922]">
                              {s.sale_date}
                            </TableCell>
                            <TableCell className="font-bold text-xs text-[#1F2922]">
                              {s.crop_name}
                            </TableCell>
                            <TableCell className="text-xs text-[#5B6E61]">
                              {s.buyer_name}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-[#1F2922]">
                              {s.quantity_kg.toLocaleString()} kg
                            </TableCell>
                            <TableCell className="text-xs text-[#5B6E61]">
                              ₱{s.price_per_kg.toFixed(2)} / kg
                            </TableCell>
                            <TableCell className="font-extrabold text-xs text-[#2D5A27]">
                              ₱{s.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge className="bg-[#2D5A27]/15 text-[#2D5A27] border-[#2D5A27]/30 text-xs font-semibold">
                                {s.payment_status || "Paid"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-10 text-center bg-[#F9FBF7] rounded-xl border border-dashed border-[#D8E2DC] p-6">
                    <ShoppingBag className="mx-auto h-8 w-8 text-[#87A987] mb-2" />
                    <p className="font-bold text-xs text-[#1F2922]">No sales transactions associated with this farm</p>
                    <p className="text-xs text-[#5B6E61] mt-0.5">
                      Produce sales will be recorded here and will automatically update the farm's income.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Add Field Dialog */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="sm:max-w-lg bg-[#FFFFFF] border-[#D8E2DC]">
          <DialogHeader>
            <DialogTitle className="text-[#1F2922]">Add Field / Area to {farm.name}</DialogTitle>
            <DialogDescription className="text-xs text-[#5B6E61]">
              Define a designated agricultural plot, acreage, and soil preparation status.
            </DialogDescription>
          </DialogHeader>

          {fieldFormError && (
            <div className="rounded-lg bg-[#DDA15E]/20 border border-[#DDA15E]/60 p-3 text-xs text-[#1F2922] flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DDA15E]" />
              <span>{fieldFormError}</span>
            </div>
          )}

          <form onSubmit={handleAddField} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="field-name" className="text-xs font-semibold text-[#1F2922]">
                Field Name / Plot Identifier <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="field-name"
                placeholder="e.g. North Paddy Sector 1"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="field-area" className="text-xs font-semibold text-[#1F2922]">
                  Field Area (Hectares) <span className="text-[#DDA15E]">*</span>
                </Label>
                <Input
                  id="field-area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 3.5"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(e.target.value)}
                  className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="field-status" className="text-xs font-semibold text-[#1F2922]">
                  Initial Status <span className="text-[#DDA15E]">*</span>
                </Label>
                <select
                  id="field-status"
                  className="flex h-9 w-full rounded-lg border border-[#D8E2DC] bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#87A987] text-[#1F2922]"
                  value={fieldStatus}
                  onChange={(e) => setFieldStatus(e.target.value as FieldStatus)}
                >
                  {FIELD_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field-desc" className="text-xs font-semibold text-[#1F2922]">
                Description & Notes
              </Label>
              <Textarea
                id="field-desc"
                placeholder="Irrigation access, soil conditions, previous cultivation history, topography..."
                rows={3}
                value={fieldDescription}
                onChange={(e) => setFieldDescription(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8E2DC]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddModal(false)}
                className="border-[#D8E2DC] text-[#1F2922] hover:bg-[#D8E2DC]/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingField}
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold"
              >
                {savingField ? "Saving..." : "Save Field"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="sm:max-w-lg bg-[#FFFFFF] border-[#D8E2DC]">
          <DialogHeader>
            <DialogTitle className="text-[#1F2922]">Edit Field / Area</DialogTitle>
            <DialogDescription className="text-xs text-[#5B6E61]">
              Update plot measurements, status, or soil condition notes.
            </DialogDescription>
          </DialogHeader>

          {editFieldFormError && (
            <div className="rounded-lg bg-[#DDA15E]/20 border border-[#DDA15E]/60 p-3 text-xs text-[#1F2922] flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DDA15E]" />
              <span>{editFieldFormError}</span>
            </div>
          )}

          <form onSubmit={handleEditField} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-field-name" className="text-xs font-semibold text-[#1F2922]">
                Field Name / Plot Identifier <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="edit-field-name"
                value={editFieldName}
                onChange={(e) => setEditFieldName(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-field-area" className="text-xs font-semibold text-[#1F2922]">
                  Field Area (Hectares) <span className="text-[#DDA15E]">*</span>
                </Label>
                <Input
                  id="edit-field-area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editFieldArea}
                  onChange={(e) => setEditFieldArea(e.target.value)}
                  className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-field-status" className="text-xs font-semibold text-[#1F2922]">
                  Field Status <span className="text-[#DDA15E]">*</span>
                </Label>
                <select
                  id="edit-field-status"
                  className="flex h-9 w-full rounded-lg border border-[#D8E2DC] bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#87A987] text-[#1F2922]"
                  value={editFieldStatus}
                  onChange={(e) => setEditFieldStatus(e.target.value as FieldStatus)}
                >
                  {FIELD_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-field-desc" className="text-xs font-semibold text-[#1F2922]">
                Description & Notes
              </Label>
              <Textarea
                id="edit-field-desc"
                rows={3}
                value={editFieldDescription}
                onChange={(e) => setEditFieldDescription(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8E2DC]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditModal(false)}
                className="border-[#D8E2DC] text-[#1F2922] hover:bg-[#D8E2DC]/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingField}
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F8FBF9] font-semibold"
              >
                {updatingField ? "Updating..." : "Update Field"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
