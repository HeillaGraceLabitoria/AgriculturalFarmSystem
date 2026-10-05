import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api, type Farm, type FarmField, type FieldStatus } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"

const FIELD_STATUSES: FieldStatus[] = [
  "Active",
  "Planted",
  "Prepared",
  "Fallow",
  "Under Maintenance",
]

function getStatusBadge(status: FieldStatus) {
  switch (status) {
    case "Planted":
      return (
        <Badge className="bg-[#2D5A27]/15 text-[#2D5A27] border-[#2D5A27]/30 gap-1 font-semibold">
          <Sprout className="h-3 w-3 text-[#2D5A27]" />
          Planted
        </Badge>
      )
    case "Active":
      return (
        <Badge className="bg-[#87A987]/20 text-[#2D5A27] border-[#87A987]/40 gap-1 font-semibold">
          <CheckCircle2 className="h-3 w-3 text-[#2D5A27]" />
          Active
        </Badge>
      )
    case "Prepared":
      return (
        <Badge className="bg-[#D8E2DC] text-[#1F2922] border-[#87A987]/40 gap-1 font-semibold">
          <Clock className="h-3 w-3 text-[#5B6E61]" />
          Prepared
        </Badge>
      )
    case "Fallow":
      return (
        <Badge className="bg-[#F9FBF7] text-[#5B6E61] border-[#D8E2DC] gap-1 font-medium">
          <PauseCircle className="h-3 w-3 text-[#5B6E61]" />
          Fallow
        </Badge>
      )
    case "Under Maintenance":
      return (
        <Badge className="bg-[#DDA15E]/20 text-[#1F2922] border-[#DDA15E]/50 gap-1 font-semibold">
          <Wrench className="h-3 w-3 text-[#DDA15E]" />
          Maintenance
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
  const [fields, setFields] = useState<FarmField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Add Field Dialog
  const [openAddModal, setOpenAddModal] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [fieldArea, setFieldArea] = useState("")
  const [fieldDescription, setFieldDescription] = useState("")
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>("Active")
  const [savingField, setSavingField] = useState(false)
  const [fieldFormError, setFieldFormError] = useState("")

  // Edit Field Dialog
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
  const [editFieldName, setEditFieldName] = useState("")
  const [editFieldArea, setEditFieldArea] = useState("")
  const [editFieldDescription, setEditFieldDescription] = useState("")
  const [editFieldStatus, setEditFieldStatus] = useState<FieldStatus>("Active")
  const [updatingField, setUpdatingField] = useState(false)
  const [editFieldFormError, setEditFieldFormError] = useState("")

  // Deleting state
  const [deletingFieldId, setDeletingFieldId] = useState<number | null>(null)

  const id = Number(farmId)

  async function loadData() {
    if (!id || isNaN(id)) {
      setError("Invalid Farm ID")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const farmData = await api.getFarm(id)
      setFarm(farmData)
      setFields(farmData.fields || [])
    } catch (err: any) {
      setError(err.message || "Failed to load farm details")
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
    if (!confirm("Are you sure you want to remove this farm field/area?")) return
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

  const totalFarmArea = farm?.total_area ?? farm?.size_hectares ?? 0
  const allocatedArea = fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0)
  const remainingArea = Math.max(0, totalFarmArea - allocatedArea)
  const utilizationPercent = totalFarmArea > 0 ? Math.min(100, Math.round((allocatedArea / totalFarmArea) * 100)) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FBF7] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[#5B6E61]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#2D5A27]" />
          <p className="text-sm font-medium">Loading farm details from SQLite database...</p>
        </div>
      </div>
    )
  }

  if (error || !farm) {
    return (
      <div className="min-h-screen bg-[#F9FBF7] p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-[#FFFFFF] p-6 rounded-2xl border border-[#DDA15E]/50 text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-[#DDA15E]" />
          <h2 className="text-lg font-bold text-[#1F2922]">Farm Not Found</h2>
          <p className="text-xs text-[#5B6E61]">{error || "Could not retrieve the requested farm."}</p>
          <Button
            onClick={() => navigate("/farms")}
            className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold"
          >
            Back to Farm Management
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FBF7] text-[#1F2922]">
      {/* Top Header - Forest Flora (#2D5A27) */}
      <header className="sticky top-0 z-10 border-b border-[#23471E] bg-[#2D5A27] text-[#F9FBF7] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
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
              <Badge variant="outline" className="text-[10px] bg-[#87A987]/25 text-[#F9FBF7] border-[#87A987]/50 font-semibold">
                <Database className="mr-1 h-2.5 w-2.5 text-[#D8E2DC]" />
                Farm #{farm.id}
              </Badge>
            </div>
            <p className="text-xs text-[#D8E2DC] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-[#87A987]" />
              {farm.location}
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
            className="bg-[#87A987] hover:bg-[#739873] text-[#1F2922] gap-2 shadow-xs font-bold"
          >
            <Plus className="h-4 w-4 text-[#1F2922]" />
            Add Field / Area
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Farm Overview Card */}
        <Card className="border-[#2D5A27] bg-[#FFFFFF] shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-[#2D5A27] via-[#2D5A27] to-[#1E3F1A] p-6 text-[#F9FBF7]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#87A987]">
                  Agricultural Site Overview
                </span>
                <h2 className="text-2xl font-black mt-1 text-white">{farm.name}</h2>
                <p className="text-xs text-[#D8E2DC] flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-[#87A987]" />
                  {farm.location}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-24 border border-white/10">
                  <span className="block text-[11px] text-[#D8E2DC] font-medium">Total Area</span>
                  <span className="text-xl font-black text-white">{totalFarmArea} <span className="text-sm font-normal text-[#D8E2DC]">ha</span></span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-24 border border-white/10">
                  <span className="block text-[11px] text-[#D8E2DC] font-medium">Zoned Fields</span>
                  <span className="text-xl font-black text-white">{fields.length}</span>
                </div>
              </div>
            </div>

            {farm.description && (
              <p className="text-xs text-[#F9FBF7] bg-black/20 rounded-lg p-3 mt-4 border border-white/10 leading-relaxed">
                {farm.description}
              </p>
            )}
          </div>

          {/* Allocation Progress Bar */}
          <div className="p-5 bg-[#F9FBF7] border-t border-[#D8E2DC]">
            <div className="flex items-center justify-between text-xs text-[#5B6E61] mb-2">
              <span className="font-medium">
                Land Allocation: <strong className="text-[#1F2922]">{allocatedArea.toFixed(1)} ha</strong> of {totalFarmArea} ha allocated ({utilizationPercent}%)
              </span>
              <span>{remainingArea.toFixed(1)} ha unassigned</span>
            </div>
            <div className="w-full h-2.5 bg-[#D8E2DC] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  utilizationPercent > 100
                    ? "bg-[#DDA15E]"
                    : "bg-[#2D5A27]"
                }`}
                style={{ width: `${Math.min(100, utilizationPercent)}%` }}
              />
            </div>
            {utilizationPercent > 100 && (
              <p className="text-[11px] text-[#DDA15E] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-[#DDA15E]" />
                Attention: Total field area exceeds registered farm land size!
              </p>
            )}
          </div>
        </Card>

        {/* Farm Areas / Fields Management Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#2D5A27]" />
              Farm Areas & Fields
            </h3>
            <p className="text-xs text-[#5B6E61]">
              Manage field boundaries, designated acreage, soil preparedness, and cultivation status
            </p>
          </div>

          <Button
            onClick={() => {
              setFieldFormError("")
              setOpenAddModal(true)
            }}
            className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] gap-2 shadow-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        {/* Fields List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <Card
              key={field.id}
              className="border-[#D8E2DC] bg-[#FFFFFF] hover:border-[#87A987] transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base font-bold text-[#1F2922]">
                        {field.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5B6E61] mt-0.5">
                        Field #{field.id}
                      </CardDescription>
                    </div>
                    {getStatusBadge(field.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#1F2922] bg-[#F9FBF7] px-2.5 py-1.5 rounded-lg border border-[#D8E2DC]">
                    <Maximize2 className="h-3.5 w-3.5 text-[#2D5A27] shrink-0" />
                    <span className="font-bold text-[#1F2922]">{field.area} <span className="font-normal text-[#5B6E61]">ha</span></span>
                    <span className="text-[#5B6E61]">
                      ({totalFarmArea > 0 ? ((field.area / totalFarmArea) * 100).toFixed(0) : 0}% of farm)
                    </span>
                  </div>

                  <p className="text-xs text-[#5B6E61] line-clamp-3 min-h-10 leading-relaxed">
                    {field.description || "No specific soil or terrain notes logged for this field."}
                  </p>
                </CardContent>
              </div>

              {/* Action buttons */}
              <div className="border-t border-[#D8E2DC] px-6 py-2.5 bg-[#F9FBF7] flex items-center justify-end gap-1 rounded-b-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-[#5B6E61] hover:text-[#2D5A27] hover:bg-[#D8E2DC]/40 gap-1 font-semibold"
                  onClick={() => openEditField(field)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-[#5B6E61] hover:text-[#DDA15E] hover:bg-[#DDA15E]/15 gap-1"
                  disabled={deletingFieldId === field.id}
                  onClick={() => handleDeleteField(field.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          {fields.length === 0 && (
            <div className="col-span-full py-16 text-center bg-[#FFFFFF] rounded-2xl border border-dashed border-[#D8E2DC] p-8">
              <Layers className="mx-auto h-12 w-12 text-[#87A987] mb-3" />
              <h3 className="text-base font-bold text-[#1F2922]">No fields created for this farm</h3>
              <p className="text-xs text-[#5B6E61] max-w-sm mx-auto mt-1 mb-4">
                Subdivide this farm into designated fields or plots to organize crops, planting cycles, and harvest tracking.
              </p>
              <Button
                onClick={() => setOpenAddModal(true)}
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] gap-2 font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add First Field
              </Button>
            </div>
          )}
        </div>
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
              <Label htmlFor="field-desc" className="text-xs font-semibold text-[#1F2922]">Description & Notes</Label>
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
              <Label htmlFor="edit-field-desc" className="text-xs font-semibold text-[#1F2922]">Description & Notes</Label>
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
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold"
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
