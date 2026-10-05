import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, type Stats, type Farm } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    totalFarms: 0,
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
        size_hectares: Number(newFarmHectares) || 1,
      })
      setNewFarmName("")
      setNewFarmLocation("")
      setNewFarmHectares("")
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
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Agricultural Farm Management System
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Logged in as {currentUser?.name || "Farm Admin"} ({currentUser?.role || "Manager"})
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                <Database className="mr-1 h-2.5 w-2.5" />
                SQLite Local DB
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-slate-600 hover:text-red-600 gap-1.5"
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
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Farms
              </CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{stats.totalFarms}</div>
              <p className="text-xs text-slate-500 mt-1">Managed production sites</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Active Crops
              </CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Sprout className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{stats.activeCrops}</div>
              <p className="text-xs text-slate-500 mt-1">Under cultivation & growing</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Harvested Quantity
              </CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Wheat className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats.harvestedQuantity.toLocaleString()} kg
              </div>
              <p className="text-xs text-slate-500 mt-1">Current season yield</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Revenue
              </CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <PhilippinePeso className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-700">
                ₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Recorded sales transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Farm Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registered Farms</h2>
              <p className="text-sm text-slate-500">
                Manage farm locations, area sizes, and active crop yields stored in your local SQLite database
              </p>
            </div>

            <Dialog open={openNewFarm} onOpenChange={setOpenNewFarm}>
              <Button
                onClick={() => setOpenNewFarm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Add New Farm
              </Button>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Register New Farm</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateFarm} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="farm-name">Farm Name</Label>
                    <Input
                      id="farm-name"
                      placeholder="e.g. Sunny Brook Agri Hub"
                      value={newFarmName}
                      onChange={(e) => setNewFarmName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="farm-location">Location / Province</Label>
                    <Input
                      id="farm-location"
                      placeholder="e.g. Batangas, Region IV-A"
                      value={newFarmLocation}
                      onChange={(e) => setNewFarmLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="farm-size">Size (Hectares)</Label>
                    <Input
                      id="farm-size"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 12.5"
                      value={newFarmHectares}
                      onChange={(e) => setNewFarmHectares(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenNewFarm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {creating ? "Saving..." : "Save Farm"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Farms Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Card key={farm.id} className="border-slate-200 bg-white hover:border-emerald-300 transition shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {farm.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={() => handleDeleteFarm(farm.id)}
                      title="Delete farm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {farm.location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{farm.size_hectares} hectares</span>
                    </div>

                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-medium">
                      {farm.crop_count ?? 0} active crops
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {farms.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <Leaf className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="font-medium text-slate-700">No farms registered yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add New Farm" above to register your first agricultural site.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
