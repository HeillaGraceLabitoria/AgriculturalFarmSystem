import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, type Farm } from "@/lib/api"
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
  Leaf,
  Plus,
  MapPin,
  Maximize2,
  Trash2,
  Edit,
  Eye,
  Search,
  ArrowLeft,
  LayoutGrid,
  Layers,
  Sprout,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react"

export default function FarmManagement() {
  const navigate = useNavigate()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Add Farm Dialog state
  const [openAddModal, setOpenAddModal] = useState(false)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [totalArea, setTotalArea] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Edit Farm Dialog state
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingFarmId, setEditingFarmId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editTotalArea, setEditTotalArea] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function loadFarms() {
    setLoading(true)
    try {
      const data = await api.getFarms()
      setFarms(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFarms()
  }, [])

  async function handleAddFarm(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!name.trim()) {
      setFormError("Farm name is required.")
      return
    }
    if (!location.trim()) {
      setFormError("Location is required.")
      return
    }
    const areaNum = Number(totalArea)
    if (isNaN(areaNum) || areaNum <= 0) {
      setFormError("Please enter a valid positive area in hectares.")
      return
    }

    setSaving(true)
    try {
      await api.createFarm({
        name: name.trim(),
        location: location.trim(),
        total_area: areaNum,
        description: description.trim(),
      })
      setName("")
      setLocation("")
      setTotalArea("")
      setDescription("")
      setOpenAddModal(false)
      await loadFarms()
    } catch (err: any) {
      setFormError(err.message || "Failed to create farm.")
    } finally {
      setSaving(false)
    }
  }

  function openEdit(farm: Farm) {
    setEditingFarmId(farm.id)
    setEditName(farm.name)
    setEditLocation(farm.location)
    setEditTotalArea(String(farm.total_area ?? farm.size_hectares))
    setEditDescription(farm.description || "")
    setEditError("")
    setOpenEditModal(true)
  }

  async function handleEditFarm(e: React.FormEvent) {
    e.preventDefault()
    if (!editingFarmId) return
    setEditError("")

    if (!editName.trim()) {
      setEditError("Farm name is required.")
      return
    }
    if (!editLocation.trim()) {
      setEditError("Location is required.")
      return
    }
    const areaNum = Number(editTotalArea)
    if (isNaN(areaNum) || areaNum <= 0) {
      setEditError("Please enter a valid positive area in hectares.")
      return
    }

    setEditSaving(true)
    try {
      await api.updateFarm(editingFarmId, {
        name: editName.trim(),
        location: editLocation.trim(),
        total_area: areaNum,
        description: editDescription.trim(),
      })
      setOpenEditModal(false)
      await loadFarms()
    } catch (err: any) {
      setEditError(err.message || "Failed to update farm.")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteFarm(id: number) {
    if (!confirm("Are you sure you want to delete this farm? This will also remove its associated areas/fields.")) {
      return
    }
    setDeletingId(id)
    try {
      await api.deleteFarm(id)
      await loadFarms()
    } catch (err: any) {
      alert(err.message || "Failed to delete farm.")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredFarms = farms.filter((f) => {
    const q = search.toLowerCase()
    return (
      f.name.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    )
  })

  const totalLandArea = farms.reduce((acc, f) => acc + (f.total_area ?? f.size_hectares ?? 0), 0)
  const totalFields = farms.reduce((acc, f) => acc + (f.field_count ?? 0), 0)
  const totalCultivated = farms.reduce((acc, f) => acc + (f.cultivated_area ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#F9FBF7] text-[#1F2922]">
      {/* Header - Forest Flora (#2D5A27) */}
      <header className="sticky top-0 z-10 border-b border-[#23471E] bg-[#2D5A27] text-[#F9FBF7] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-[#D8E2DC] hover:text-[#F9FBF7] hover:bg-[#23471E]"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9FBF7] text-[#2D5A27] shadow-xs">
            <LayoutGrid className="h-5 w-5 text-[#2D5A27]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#F9FBF7]">
                Farm Management
              </h1>
              <Badge variant="outline" className="text-[10px] bg-[#87A987]/25 text-[#F9FBF7] border-[#87A987]/50 font-semibold">
                <Database className="mr-1 h-2.5 w-2.5 text-[#D8E2DC]" />
                SQLite Local
              </Badge>
            </div>
            <p className="text-xs text-[#D8E2DC]">
              Manage agricultural farm sites, total land boundaries, and field zoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFarms}
            disabled={loading}
            className="border-[#87A987]/50 bg-transparent text-[#F9FBF7] hover:bg-[#23471E] hover:text-[#F9FBF7] gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setFormError("")
              setOpenAddModal(true)
            }}
            className="bg-[#87A987] hover:bg-[#739873] text-[#1F2922] gap-2 shadow-xs font-bold"
          >
            <Plus className="h-4 w-4 text-[#1F2922]" />
            Add New Farm
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Total Farms
              </CardTitle>
              <div className="p-2 bg-[#D8E2DC]/50 rounded-lg">
                <Leaf className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">{farms.length}</div>
              <p className="text-xs text-[#5B6E61] mt-1">Operational farm locations</p>
            </CardContent>
          </Card>

          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Total Land Area
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <Maximize2 className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">
                {totalLandArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="font-normal text-sm text-[#5B6E61]">ha</span>
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">Total registered hectares</p>
            </CardContent>
          </Card>

          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Farm Areas / Fields
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <Layers className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F2922]">{totalFields}</div>
              <p className="text-xs text-[#5B6E61] mt-1">Active field subdivisions</p>
            </CardContent>
          </Card>

          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Cultivated Area
              </CardTitle>
              <div className="p-2 bg-[#D8E2DC]/50 rounded-lg">
                <Sprout className="h-4 w-4 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2D5A27]">
                {totalCultivated.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="font-normal text-sm text-[#5B6E61]">ha</span>
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">Zoned for active planting</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#FFFFFF] p-4 rounded-xl border border-[#D8E2DC] shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B6E61]" />
            <Input
              placeholder="Search farms by name, province, or description..."
              className="pl-9 border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="text-xs text-[#5B6E61] flex items-center gap-1.5 self-center">
            <span>Showing <strong className="text-[#1F2922]">{filteredFarms.length}</strong> of {farms.length} farms</span>
          </div>
        </div>

        {/* Farm Cards Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredFarms.map((farm) => {
            const area = farm.total_area ?? farm.size_hectares ?? 0
            const fieldsCount = farm.field_count ?? 0
            const cropsCount = farm.crop_count ?? 0
            const cultivated = farm.cultivated_area ?? 0

            return (
              <Card
                key={farm.id}
                className="border-[#D8E2DC] bg-[#FFFFFF] hover:border-[#87A987] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle
                          className="text-lg font-bold text-[#1F2922] hover:text-[#2D5A27] cursor-pointer transition-colors"
                          onClick={() => navigate(`/farms/${farm.id}`)}
                          title="View Consolidated Farm Profile"
                        >
                          {farm.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs text-[#5B6E61] mt-1">
                          <MapPin className="h-3.5 w-3.5 text-[#87A987] shrink-0" />
                          <span>{farm.location}</span>
                        </CardDescription>
                      </div>

                      <Badge
                        variant="secondary"
                        className="bg-[#87A987]/20 text-[#2D5A27] border border-[#87A987]/40 font-bold shrink-0"
                      >
                        {area} ha
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-xs text-[#5B6E61] line-clamp-2 min-h-8 leading-relaxed">
                      {farm.description || "No description provided for this agricultural site."}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 bg-[#F9FBF7] p-2.5 rounded-lg border border-[#D8E2DC] text-xs">
                      <div>
                        <span className="text-[#5B6E61] block text-[10px] uppercase font-semibold">Areas / Fields</span>
                        <span className="font-semibold text-[#1F2922] flex items-center gap-1 mt-0.5">
                          <Layers className="h-3 w-3 text-[#2D5A27]" />
                          {fieldsCount} {fieldsCount === 1 ? "Field" : "Fields"} ({cultivated} ha)
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5B6E61] block text-[10px] uppercase font-semibold">Active Crops</span>
                        <span className="font-semibold text-[#1F2922] flex items-center gap-1 mt-0.5">
                          <Sprout className="h-3 w-3 text-[#2D5A27]" />
                          {cropsCount} {cropsCount === 1 ? "Crop" : "Crops"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-[#D8E2DC] px-6 py-3 bg-[#F9FBF7] flex items-center justify-between rounded-b-xl">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[#2D5A27] hover:text-[#1E3F1A] hover:bg-[#D8E2DC]/50 border-[#87A987]/50 font-bold text-xs"
                    onClick={() => navigate(`/farms/${farm.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 text-[#2D5A27]" />
                    View Farm Profile
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#5B6E61] hover:text-[#2D5A27] hover:bg-[#D8E2DC]/40"
                      onClick={() => openEdit(farm)}
                      title="Edit farm details"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#5B6E61] hover:text-[#DDA15E] hover:bg-[#DDA15E]/15"
                      disabled={deletingId === farm.id}
                      onClick={() => handleDeleteFarm(farm.id)}
                      title="Delete farm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredFarms.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center bg-[#FFFFFF] rounded-2xl border border-dashed border-[#D8E2DC] p-8">
              <Leaf className="mx-auto h-12 w-12 text-[#87A987] mb-3" />
              <h3 className="text-base font-bold text-[#1F2922]">No farms found</h3>
              <p className="text-xs text-[#5B6E61] max-w-sm mx-auto mt-1 mb-4">
                {search ? `No farms matching "${search}". Try adjusting your search query.` : "Register your first farm site to start managing areas, fields, and crops."}
              </p>
              <Button
                onClick={() => setOpenAddModal(true)}
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] gap-2 font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add New Farm
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Farm Dialog */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="sm:max-w-lg bg-[#FFFFFF] border-[#D8E2DC]">
          <DialogHeader>
            <DialogTitle className="text-[#1F2922]">Register New Agricultural Farm</DialogTitle>
            <DialogDescription className="text-xs text-[#5B6E61]">
              Create a new farm record with geographic boundary and total land area.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg bg-[#DDA15E]/20 border border-[#DDA15E]/60 p-3 text-xs text-[#1F2922] flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DDA15E]" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddFarm} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-xs font-semibold text-[#1F2922]">
                Farm Name <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="add-name"
                placeholder="e.g. Sunny Plains Organic Farm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-location" className="text-xs font-semibold text-[#1F2922]">
                Location / Province <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="add-location"
                placeholder="e.g. Santa Cruz, Laguna, Region IV-A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-area" className="text-xs font-semibold text-[#1F2922]">
                Total Area (Hectares) <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="add-area"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 15.5"
                value={totalArea}
                onChange={(e) => setTotalArea(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-desc" className="text-xs font-semibold text-[#1F2922]">Description</Label>
              <Textarea
                id="add-desc"
                placeholder="Brief description of farm terrain, soil type, primary facilities, and water sources..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                disabled={saving}
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold"
              >
                {saving ? "Creating Farm..." : "Save Farm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Farm Dialog */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="sm:max-w-lg bg-[#FFFFFF] border-[#D8E2DC]">
          <DialogHeader>
            <DialogTitle className="text-[#1F2922]">Edit Farm Details</DialogTitle>
            <DialogDescription className="text-xs text-[#5B6E61]">
              Update boundary details and overview information for this farm.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="rounded-lg bg-[#DDA15E]/20 border border-[#DDA15E]/60 p-3 text-xs text-[#1F2922] flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DDA15E]" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleEditFarm} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-semibold text-[#1F2922]">
                Farm Name <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location" className="text-xs font-semibold text-[#1F2922]">
                Location / Province <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="edit-location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-area" className="text-xs font-semibold text-[#1F2922]">
                Total Area (Hectares) <span className="text-[#DDA15E]">*</span>
              </Label>
              <Input
                id="edit-area"
                type="number"
                step="0.1"
                min="0.1"
                value={editTotalArea}
                onChange={(e) => setEditTotalArea(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs font-semibold text-[#1F2922]">Description</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
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
                disabled={editSaving}
                className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold"
              >
                {editSaving ? "Saving Changes..." : "Update Farm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
