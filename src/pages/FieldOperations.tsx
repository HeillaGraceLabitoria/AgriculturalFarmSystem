import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  api,
  type Farm,
  type FarmField,
  type Crop,
  type CropCatalogItem,
  type FertilizerItem,
  type FieldActivity,
  type FertilizerApplication,
  type GrowthStage,
} from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Sprout,
  Calendar,
  Wrench,
  FlaskConical,
  Plus,
  Trash2,
  Calculator,
  Search,
} from "lucide-react"

type OpsTab = "plantings" | "activities" | "fertilizer"

const STAGES: GrowthStage[] = [
  "Planned",
  "Seedling",
  "Vegetative",
  "Flowering",
  "Ready for Harvest",
  "Harvested",
]

export default function FieldOperations() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<OpsTab>("plantings")

  const [farms, setFarms] = useState<Farm[]>([])
  const [fields, setFields] = useState<FarmField[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [catalog, setCatalog] = useState<CropCatalogItem[]>([])
  const [fertilizers, setFertilizers] = useState<FertilizerItem[]>([])
  const [activities, setActivities] = useState<FieldActivity[]>([])
  const [applications, setApplications] = useState<FertilizerApplication[]>([])

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFarmId, setFilterFarmId] = useState("")

  // Planting Batch Form
  const [plantForm, setPlantForm] = useState({
    farm_id: "",
    field_id: "",
    catalog_id: "",
    name: "",
    variety: "",
    planted_date: new Date().toISOString().split("T")[0],
    expected_harvest_date: "",
    area_hectares: "",
    growth_stage: "Seedling" as GrowthStage,
  })

  // Field Activity & Labor Form
  const [actForm, setActForm] = useState({
    farm_id: "",
    field_id: "",
    crop_id: "",
    activity_type: "Land Preparation & Plowing",
    activity_date: new Date().toISOString().split("T")[0],
    worker_name: "",
    hours_worked: "4",
    labor_cost: "600",
    notes: "",
  })

  // Fertilizer Dosage Form
  const [fertAppForm, setFertAppForm] = useState({
    farm_id: "",
    field_id: "",
    crop_id: "",
    fertilizer_id: "",
    application_date: new Date().toISOString().split("T")[0],
    area_hectares: "",
    dosage_per_ha: "4",
    notes: "",
  })

  async function loadAll() {
    const [f, fld, cr, cat, fert, act, app] = await Promise.all([
      api.getFarms().catch(() => []),
      api.getAllFields().catch(() => []),
      api.getCrops().catch(() => []),
      api.getCropCatalog().catch(() => []),
      api.getFertilizers().catch(() => []),
      api.getFieldActivities().catch(() => []),
      api.getFertilizerApplications().catch(() => []),
    ])
    setFarms(f)
    setFields(fld)
    setCrops(cr)
    setCatalog(cat)
    setFertilizers(fert)
    setActivities(act)
    setApplications(app)
  }

  useEffect(() => {
    loadAll()
  }, [])

  function handleCatalogSelect(catalogId: string) {
    const item = catalog.find((c) => String(c.id) === catalogId)
    if (!item) {
      setPlantForm({ ...plantForm, catalog_id: catalogId })
      return
    }
    const baseDate = new Date(plantForm.planted_date || new Date())
    baseDate.setDate(baseDate.getDate() + (item.growing_days || 90))
    const expected = baseDate.toISOString().split("T")[0]
    setPlantForm({
      ...plantForm,
      catalog_id: catalogId,
      name: item.name,
      variety: item.variety,
      expected_harvest_date: expected,
    })
  }

  async function handleCreatePlanting(e: React.FormEvent) {
    e.preventDefault()
    if (!plantForm.name || !plantForm.planted_date) return
    await api.createCrop({
      farm_id: plantForm.farm_id ? Number(plantForm.farm_id) : undefined,
      field_id: plantForm.field_id ? Number(plantForm.field_id) : undefined,
      name: plantForm.name,
      variety: plantForm.variety,
      planted_date: plantForm.planted_date,
      expected_harvest_date: plantForm.expected_harvest_date || undefined,
      area_hectares: Number(plantForm.area_hectares) || 1,
      growth_stage: plantForm.growth_stage,
      status: plantForm.growth_stage === "Harvested" ? "harvested" : "growing",
    })
    setPlantForm({
      farm_id: "",
      field_id: "",
      catalog_id: "",
      name: "",
      variety: "",
      planted_date: new Date().toISOString().split("T")[0],
      expected_harvest_date: "",
      area_hectares: "",
      growth_stage: "Seedling",
    })
    loadAll()
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault()
    await api.createFieldActivity({
      farm_id: actForm.farm_id ? Number(actForm.farm_id) : undefined,
      field_id: actForm.field_id ? Number(actForm.field_id) : undefined,
      crop_id: actForm.crop_id ? Number(actForm.crop_id) : undefined,
      activity_type: actForm.activity_type,
      activity_date: actForm.activity_date,
      worker_name: actForm.worker_name,
      hours_worked: Number(actForm.hours_worked) || 0,
      labor_cost: Number(actForm.labor_cost) || 0,
      notes: actForm.notes,
    })
    setActForm({
      ...actForm,
      worker_name: "",
      notes: "",
    })
    loadAll()
  }

  const selectedFert = fertilizers.find((f) => String(f.id) === fertAppForm.fertilizer_id)
  const calcBags = (Number(fertAppForm.area_hectares) || 0) * (Number(fertAppForm.dosage_per_ha) || 0)
  const calcCost = calcBags * (selectedFert?.unit_price || 0)

  async function handleLogFertilizerApp(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFert) return
    await api.createFertilizerApplication({
      farm_id: fertAppForm.farm_id ? Number(fertAppForm.farm_id) : undefined,
      field_id: fertAppForm.field_id ? Number(fertAppForm.field_id) : undefined,
      crop_id: fertAppForm.crop_id ? Number(fertAppForm.crop_id) : undefined,
      fertilizer_id: selectedFert.id,
      fertilizer_name: selectedFert.name,
      npk_ratio: selectedFert.npk_ratio,
      application_date: fertAppForm.application_date,
      area_hectares: Number(fertAppForm.area_hectares) || 0,
      dosage_per_ha: Number(fertAppForm.dosage_per_ha) || 0,
      unit_price: selectedFert.unit_price,
      notes: fertAppForm.notes,
    })
    setFertAppForm({
      ...fertAppForm,
      area_hectares: "",
      notes: "",
    })
    loadAll()
  }

  const filteredCrops = crops.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.variety || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.batch_code || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFarm = !filterFarmId || String(c.farm_id) === filterFarmId
    return matchesSearch && matchesFarm
  })

  const totalLaborCost = activities.reduce((sum, a) => sum + (Number(a.labor_cost) || 0), 0)
  const totalInputCost = applications.reduce((sum, a) => sum + (Number(a.total_cost) || 0), 0)

  return (
    <div className="min-h-screen bg-[#F9FBF7] text-[#1F2922] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#2D5A27] mb-1 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-[#1F2922] flex items-center gap-2">
              <Sprout className="h-6 w-6 text-[#2D5A27]" />
              Crop & Field Operations
            </h1>
            <p className="text-sm text-[#5B6E61]">
              Planting Batches, Labor Activity Logs, Fertilizer Dosage Calculator & Growth Stage Pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-[#2D5A27] text-white">Labor: ₱{totalLaborCost.toLocaleString()}</Badge>
            <Badge className="bg-[#DDA15E] text-[#1F2922]">Fertilizer Inputs: ₱{totalInputCost.toLocaleString()}</Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant={tab === "plantings" ? "default" : "outline"}
            onClick={() => setTab("plantings")}
            className={tab === "plantings" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <Calendar className="h-4 w-4 mr-2" /> Planting Batches & Stages ({crops.length})
          </Button>
          <Button
            variant={tab === "activities" ? "default" : "outline"}
            onClick={() => setTab("activities")}
            className={tab === "activities" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <Wrench className="h-4 w-4 mr-2" /> Field Activities & Labor ({activities.length})
          </Button>
          <Button
            variant={tab === "fertilizer" ? "default" : "outline"}
            onClick={() => setTab("fertilizer")}
            className={tab === "fertilizer" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <FlaskConical className="h-4 w-4 mr-2" /> Fertilizer Dosage & Cost ({applications.length})
          </Button>
        </div>

        {/* TAB 1: Planting Batches & Growth Stage Pipeline */}
        {tab === "plantings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Register Planting Batch</CardTitle>
                <CardDescription className="text-xs">
                  Assign a crop from the Master Catalog to a specific farm plot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePlanting} className="space-y-3">
                  <div>
                    <Label className="text-xs">Select Farm</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={plantForm.farm_id}
                      onChange={(e) => setPlantForm({ ...plantForm, farm_id: e.target.value, field_id: "" })}
                      required
                    >
                      <option value="">-- Choose Farm --</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                 <div>
                    <Label className="text-xs">Assign Field / Plot</Label>
                    {(() => {
                      const farmPlots = fields.filter(
                        (fld) => !plantForm.farm_id || String(fld.farm_id) === plantForm.farm_id
                      )
                      return (
                        <select
                          className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                          value={plantForm.field_id}
                          onChange={(e) => setPlantForm({ ...plantForm, field_id: e.target.value })}
                        >
                          <option value="">
                            {plantForm.farm_id && farmPlots.length === 0
                              ? "-- No plots registered for this farm yet (Optional) --"
                              : "-- Choose Plot (Optional) --"}
                          </option>
                          {farmPlots.map((fld) => (
                            <option key={fld.id} value={fld.id}>{fld.name} ({fld.area} ha)</option>
                          ))}
                        </select>
                      )
                    })()}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Crop Name</Label>
                      <Input
                        placeholder="Rice"
                        value={plantForm.name}
                        onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Variety</Label>
                      <Input
                        placeholder="Jasmine RC222"
                        value={plantForm.variety}
                        onChange={(e) => setPlantForm({ ...plantForm, variety: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Planted Date</Label>
                      <Input
                        type="date"
                        value={plantForm.planted_date}
                        onChange={(e) => setPlantForm({ ...plantForm, planted_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Est. Harvest Date</Label>
                      <Input
                        type="date"
                        value={plantForm.expected_harvest_date}
                        onChange={(e) => setPlantForm({ ...plantForm, expected_harvest_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Area (Hectares)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.5"
                        value={plantForm.area_hectares}
                        onChange={(e) => setPlantForm({ ...plantForm, area_hectares: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Initial Stage</Label>
                      <select
                        className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-2 text-sm"
                        value={plantForm.growth_stage}
                        onChange={(e) => setPlantForm({ ...plantForm, growth_stage: e.target.value as GrowthStage })}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Schedule Planting Batch
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {/* Search & Farm Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#5B6E61]" />
                  <Input
                    placeholder="Search batch code, crop, or variety..."
                    className="pl-9 bg-white border-[#D8E2DC]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                  value={filterFarmId}
                  onChange={(e) => setFilterFarmId(e.target.value)}
                >
                  <option value="">All Farms</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <Card className="border-[#D8E2DC] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                    <tr>
                      <th className="p-3">Batch & Crop</th>
                      <th className="p-3">Farm / Plot</th>
                      <th className="p-3">Schedule</th>
                      <th className="p-3">Growth Stage</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E2DC]">
                    {filteredCrops.map((crop) => (
                      <tr key={crop.id}>
                        <td className="p-3">
                          <div className="font-mono text-[10px] text-[#5B6E61]">{crop.batch_code || `BATCH-${crop.id}`}</div>
                          <div className="font-bold text-[#1F2922]">{crop.name}</div>
                          <div className="text-xs text-[#2D5A27]">{crop.variety} • {crop.area_hectares} ha</div>
                        </td>
                        <td className="p-3 text-xs">
                          <div className="font-semibold">{crop.farm_name || "Unassigned"}</div>
                          <div className="text-[#5B6E61]">{crop.field_name || "General Area"}</div>
                        </td>
                        <td className="p-3 text-xs font-mono">
                          <div>In: {crop.planted_date}</div>
                          <div className="text-[#2D5A27]">Out: {crop.expected_harvest_date || "TBD"}</div>
                        </td>
                        <td className="p-3">
                          <select
                            className="h-8 rounded border border-[#87A987] bg-[#F9FBF7] px-2 text-xs font-semibold text-[#2D5A27]"
                            value={crop.growth_stage || (crop.status === "harvested" ? "Harvested" : "Vegetative")}
                            onChange={(e) => api.updateCropStage(crop.id, e.target.value as GrowthStage).then(loadAll)}
                          >
                            {STAGES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => api.deleteCrop(crop.id).then(loadAll)}
                            className="text-rose-600 h-7 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Field Activity & Labor Logging */}
        {tab === "activities" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Log Field Activity & Labor</CardTitle>
                <CardDescription className="text-xs">Track worker hours and field maintenance costs</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogActivity} className="space-y-3">
                  <div>
                    <Label className="text-xs">Farm</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={actForm.farm_id}
                      onChange={(e) => setActForm({ ...actForm, farm_id: e.target.value })}
                      required
                    >
                      <option value="">-- Select Farm --</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Field / Plot</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={actForm.field_id}
                      onChange={(e) => setActForm({ ...actForm, field_id: e.target.value })}
                    >
                      <option value="">-- Select Plot --</option>
                      {fields
                        .filter((fld) => !actForm.farm_id || String(fld.farm_id) === actForm.farm_id)
                        .map((fld) => (
                          <option key={fld.id} value={fld.id}>{fld.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Operation Type</Label>
                    <Input
                      value={actForm.activity_type}
                      onChange={(e) => setActForm({ ...actForm, activity_type: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={actForm.activity_date}
                        onChange={(e) => setActForm({ ...actForm, activity_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Assigned Worker</Label>
                      <Input
                        placeholder="Worker Name"
                        value={actForm.worker_name}
                        onChange={(e) => setActForm({ ...actForm, worker_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Hours Worked</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={actForm.hours_worked}
                        onChange={(e) => setActForm({ ...actForm, hours_worked: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Labor Cost (₱)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={actForm.labor_cost}
                        onChange={(e) => setActForm({ ...actForm, labor_cost: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input
                      placeholder="Field observations..."
                      value={actForm.notes}
                      onChange={(e) => setActForm({ ...actForm, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Save Activity Log
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Activity & Location</th>
                    <th className="p-3">Worker</th>
                    <th className="p-3">Hours / Cost</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {activities.map((act) => (
                    <tr key={act.id}>
                      <td className="p-3 font-mono text-xs">{act.activity_date}</td>
                      <td className="p-3">
                        <div className="font-semibold text-[#1F2922]">{act.activity_type}</div>
                        <div className="text-xs text-[#5B6E61]">{act.farm_name} • {act.field_name || "General"}</div>
                        {act.notes && <div className="text-[11px] text-gray-500 mt-0.5">{act.notes}</div>}
                      </td>
                      <td className="p-3 text-xs font-medium">{act.worker_name}</td>
                      <td className="p-3 text-xs font-mono">
                        {act.hours_worked} hrs<br />
                        <span className="text-[#2D5A27] font-bold">₱{Number(act.labor_cost).toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => api.deleteFieldActivity(act.id).then(loadAll)}
                          className="text-rose-600 h-7 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB 3: Fertilizer Dosage & Cost Calculator */}
        {tab === "fertilizer" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-[#2D5A27]" />
                  Fertilizer Dosage & Cost
                </CardTitle>
                <CardDescription className="text-xs">
                  Auto-computes total bags and input cost from the Master Catalog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogFertilizerApp} className="space-y-3">
                  <div>
                    <Label className="text-xs">Select Farm</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={fertAppForm.farm_id}
                      onChange={(e) => setFertAppForm({ ...fertAppForm, farm_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Farm --</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Select Fertilizer (N-P-K Catalog)</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={fertAppForm.fertilizer_id}
                      onChange={(e) => setFertAppForm({ ...fertAppForm, fertilizer_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Fertilizer --</option>
                      {fertilizers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} [{f.npk_ratio}] - ₱{f.unit_price}/{f.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Area Applied (ha)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={fertAppForm.area_hectares}
                        onChange={(e) => setFertAppForm({ ...fertAppForm, area_hectares: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Dosage (bags/ha)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={fertAppForm.dosage_per_ha}
                        onChange={(e) => setFertAppForm({ ...fertAppForm, dosage_per_ha: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Application Date</Label>
                    <Input
                      type="date"
                      value={fertAppForm.application_date}
                      onChange={(e) => setFertAppForm({ ...fertAppForm, application_date: e.target.value })}
                      required
                    />
                  </div>

                  {/* Live Dosage & Cost Formula Box */}
                  <div className="rounded-lg bg-[#D8E2DC]/40 p-3 border border-[#87A987]/50 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5B6E61]">Calculated Total Volume:</span>
                      <span className="font-mono font-bold text-[#1F2922]">{calcBags.toFixed(2)} bags</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6E61]">Estimated Input Cost:</span>
                      <span className="font-mono font-bold text-[#2D5A27]">₱{calcCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Record Application
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Fertilizer & N-P-K</th>
                    <th className="p-3">Farm / Coverage</th>
                    <th className="p-3">Total Input Cost</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="p-3 font-mono text-xs">{app.application_date}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#1F2922]">{app.fertilizer_name}</div>
                        <Badge variant="outline" className="text-[10px] font-mono border-[#2D5A27] text-[#2D5A27]">
                          N-P-K {app.npk_ratio}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="font-semibold">{app.farm_name}</div>
                        <div className="text-[#5B6E61]">{app.area_hectares} ha × {app.dosage_per_ha} bags/ha = <strong>{app.total_units} bags</strong></div>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-[#2D5A27]">
                        ₱{Number(app.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => api.deleteFertilizerApplication(app.id).then(loadAll)}
                          className="text-rose-600 h-7 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}