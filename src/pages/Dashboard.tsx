import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, type Stats, type Farm } from "@/lib/api"
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
  Sprout,
  Wheat,
  PhilippinePeso,
  LogOut,
  Plus,
  MapPin,
  Maximize2,
  Trash2,
  Database,
  RefreshCw,
  LayoutGrid,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    totalFarms: 0,
    totalFields: 0,
    activeCrops: 0,
    harvestedQuantity: 0,
    totalSales: 0,
  })
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [openNewFarm, setOpenNewFarm] = useState(false)
  const [newFarmName, setNewFarmName] = useState("")
  const [newFarmLocation, setNewFarmLocation] = useState("")
  const [newFarmHectares, setNewFarmHectares] = useState("")
  const [newFarmDesc, setNewFarmDesc] = useState("")
  const [creating, setCreating] = useState(false)

  const currentUser = api.getCurrentUser()

  async function loadData() {
    setLoading(true)
    try {
      const [statsData, farmsData] = await Promise.all([
        api.getStats(),
        api.getFarms(),
      ])
      setStats(statsData)
      setFarms(farmsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleSignOut() {
    api.logout()
    navigate("/login")
  }

  async function handleCreateFarm(e: React.FormEvent) {
    e.preventDefault()
    if (!newFarmName.trim() || !newFarmLocation.trim()) return

    setCreating(true)
    try {
      await api.createFarm({
        name: newFarmName.trim(),
        location: newFarmLocation.trim(),
        total_area: Number(newFarmHectares) || 1,
        description: newFarmDesc.trim(),
      })
      setNewFarmName("")
      setNewFarmLocation("")
      setNewFarmHectares("")
      setNewFarmDesc("")
      setOpenNewFarm(false)
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to add farm")
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteFarm(id: number) {
    if (!confirm("Are you sure you want to remove this farm?")) return
    try {
      await api.deleteFarm(id)
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to delete farm")
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FBF7] text-[#1F2922]">
      {/* Top Navigation - Forest Flora (#2D5A27) */}
      <header className="sticky top-0 z-10 border-b border-[#23471E] bg-[#2D5A27] text-[#F9FBF7] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9FBF7] text-[#2D5A27] shadow-xs">
            <Leaf className="h-5 w-5 text-[#2D5A27]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#F9FBF7]">
              Agricultural Farm Management System
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#D8E2DC]">
                Logged in as {currentUser?.name || "Farm Admin"} ({currentUser?.role || "Manager"})
              </span>
              <Badge variant="outline" className="text-[10px] bg-[#87A987]/25 text-[#F9FBF7] border-[#87A987]/50 font-semibold">
                <Database className="mr-1 h-2.5 w-2.5 text-[#D8E2DC]" />
                SQLite Local DB
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation & User actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/farms")}
            className="bg-[#87A987] hover:bg-[#739873] text-[#1F2922] gap-1.5 shadow-xs font-bold"
          >
            <LayoutGrid className="h-4 w-4 text-[#1F2922]" />
            Farm Management
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-[#87A987]/50 bg-transparent text-[#F9FBF7] hover:bg-[#23471E] hover:text-[#F9FBF7] gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-[#D8E2DC] hover:text-[#DDA15E] hover:bg-[#23471E] gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Total Farms
              </CardTitle>
              <div className="p-2 bg-[#D8E2DC]/50 rounded-lg">
                <Leaf className="h-5 w-5 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[#1F2922]">{stats.totalFarms}</div>
              <p className="text-xs text-[#5B6E61] mt-1">Managed production sites</p>
            </CardContent>
          </Card>

          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Active Crops
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <Sprout className="h-5 w-5 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[#1F2922]">{stats.activeCrops}</div>
              <p className="text-xs text-[#5B6E61] mt-1">Under cultivation & growing</p>
            </CardContent>
          </Card>

          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#DDA15E] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Harvested Quantity
              </CardTitle>
              <div className="p-2 bg-[#DDA15E]/20 rounded-lg">
                <Wheat className="h-5 w-5 text-[#DDA15E]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[#1F2922]">
                {stats.harvestedQuantity.toLocaleString()} <span className="text-lg font-medium text-[#5B6E61]">kg</span>
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">Current season yield</p>
            </CardContent>
          </Card>

          <Card className="border-[#D8E2DC] bg-[#FFFFFF] shadow-xs hover:border-[#87A987] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#5B6E61] uppercase tracking-wider">
                Total Revenue
              </CardTitle>
              <div className="p-2 bg-[#87A987]/20 rounded-lg">
                <PhilippinePeso className="h-5 w-5 text-[#2D5A27]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[#2D5A27]">
                ₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-[#5B6E61] mt-1">Recorded sales transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Banner */}
        <div className="bg-gradient-to-r from-[#2D5A27] to-[#1E3F1A] rounded-2xl p-6 text-[#F9FBF7] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#2D5A27]">
          <div>
            <Badge className="bg-[#87A987] text-[#1F2922] border-none mb-2 font-bold">
              Operations & Zoning
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Farm Management & Field Zoning Module
            </h2>
            <p className="text-xs text-[#D8E2DC] mt-1 max-w-xl leading-relaxed">
              Organize farm boundaries, designate fields/plots, and prepare soil blocks for crop planting in accordance with the agricultural workflow.
            </p>
          </div>
          <Button
            onClick={() => navigate("/farms")}
            className="bg-[#F9FBF7] text-[#2D5A27] hover:bg-[#D8E2DC] font-bold gap-2 shadow-xs shrink-0"
          >
            Open Farm Management
            <ArrowRight className="h-4 w-4 text-[#2D5A27]" />
          </Button>
        </div>

        {/* Farm Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1F2922]">Registered Farms</h2>
              <p className="text-xs text-[#5B6E61]">
                Manage farm locations, area sizes, and active crop yields stored in your local SQLite database
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/farms")}
                className="gap-1.5 text-xs text-[#1F2922] border-[#D8E2DC] hover:bg-[#D8E2DC]/30 font-semibold"
              >
                View All in Farm Manager
                <ExternalLink className="h-3.5 w-3.5 text-[#2D5A27]" />
              </Button>

              <Dialog open={openNewFarm} onOpenChange={setOpenNewFarm}>
                <Button
                  onClick={() => setOpenNewFarm(true)}
                  className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] gap-2 shadow-xs font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Add New Farm
                </Button>
                <DialogContent className="sm:max-w-md bg-[#FFFFFF] border-[#D8E2DC]">
                  <DialogHeader>
                    <DialogTitle className="text-[#1F2922]">Register New Farm</DialogTitle>
                    <DialogDescription className="text-xs text-[#5B6E61]">
                      Add a new agricultural site to your local SQLite database.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateFarm} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="farm-name" className="text-xs font-semibold text-[#1F2922]">
                        Farm Name <span className="text-[#DDA15E]">*</span>
                      </Label>
                      <Input
                        id="farm-name"
                        placeholder="e.g. Sunny Brook Agri Hub"
                        value={newFarmName}
                        onChange={(e) => setNewFarmName(e.target.value)}
                        className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="farm-location" className="text-xs font-semibold text-[#1F2922]">
                        Location / Province <span className="text-[#DDA15E]">*</span>
                      </Label>
                      <Input
                        id="farm-location"
                        placeholder="e.g. Batangas, Region IV-A"
                        value={newFarmLocation}
                        onChange={(e) => setNewFarmLocation(e.target.value)}
                        className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="farm-size" className="text-xs font-semibold text-[#1F2922]">
                        Size (Hectares) <span className="text-[#DDA15E]">*</span>
                      </Label>
                      <Input
                        id="farm-size"
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="e.g. 12.5"
                        value={newFarmHectares}
                        onChange={(e) => setNewFarmHectares(e.target.value)}
                        className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="farm-desc" className="text-xs font-semibold text-[#1F2922]">
                        Description
                      </Label>
                      <Textarea
                        id="farm-desc"
                        placeholder="Terrain details, soil type, primary crop focus..."
                        rows={2}
                        value={newFarmDesc}
                        onChange={(e) => setNewFarmDesc(e.target.value)}
                        className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#D8E2DC]">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenNewFarm(false)}
                        className="border-[#D8E2DC] text-[#1F2922] hover:bg-[#D8E2DC]/30"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating}
                        className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold"
                      >
                        {creating ? "Saving..." : "Save Farm"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Farms Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => {
              const area = farm.total_area ?? farm.size_hectares ?? 0
              const fieldsCount = farm.field_count ?? 0
              const cropsCount = farm.crop_count ?? 0

              return (
                <Card
                  key={farm.id}
                  className="border-[#D8E2DC] bg-[#FFFFFF] hover:border-[#87A987] hover:shadow-md transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-bold text-[#1F2922]">
                            {farm.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-xs text-[#5B6E61] mt-1">
                            <MapPin className="h-3.5 w-3.5 text-[#87A987] shrink-0" />
                            {farm.location}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#5B6E61] hover:text-[#DDA15E] hover:bg-[#DDA15E]/15"
                          onClick={() => handleDeleteFarm(farm.id)}
                          title="Delete farm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {farm.description && (
                        <p className="text-xs text-[#5B6E61] line-clamp-2 leading-relaxed">
                          {farm.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-[#D8E2DC] pt-3 text-xs">
                        <div className="flex items-center gap-1 text-[#1F2922] font-semibold">
                          <Maximize2 className="h-3.5 w-3.5 text-[#5B6E61]" />
                          <span>{area} <span className="font-normal text-[#5B6E61]">ha</span></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="bg-[#87A987]/20 text-[#2D5A27] border border-[#87A987]/40 font-semibold">
                            <Layers className="mr-1 h-3 w-3 text-[#2D5A27]" />
                            {fieldsCount} {fieldsCount === 1 ? "field" : "fields"}
                          </Badge>
                          <Badge variant="outline" className="border-[#D8E2DC] bg-[#D8E2DC]/40 text-[#1F2922] font-medium">
                            <Sprout className="mr-1 h-3 w-3 text-[#2D5A27]" />
                            {cropsCount} {cropsCount === 1 ? "crop" : "crops"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="border-t border-[#D8E2DC] px-6 py-2.5 bg-[#F9FBF7] rounded-b-xl flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/farms/${farm.id}`)}
                      className="text-xs text-[#2D5A27] hover:text-[#1E3F1A] hover:bg-[#D8E2DC]/50 gap-1.5 font-bold"
                    >
                      Manage Fields & Areas
                      <ArrowRight className="h-3.5 w-3.5 text-[#2D5A27]" />
                    </Button>
                  </div>
                </Card>
              )
            })}

            {farms.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-[#5B6E61] bg-[#FFFFFF] rounded-xl border border-dashed border-[#D8E2DC]">
                <Leaf className="mx-auto h-8 w-8 text-[#87A987] mb-2" />
                <p className="font-semibold text-[#1F2922]">No farms registered yet</p>
                <p className="text-xs text-[#5B6E61] mt-1">Click "Add New Farm" above to register your first agricultural site.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
