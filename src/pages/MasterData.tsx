import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  api,
  type CropCatalogItem,
  type FertilizerItem,
  type CustomerItem,
  type AuditLog,
} from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Sprout,
  FlaskConical,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Database,
} from "lucide-react"

type Tab = "crops" | "fertilizers" | "customers" | "audit"

export default function MasterData() {
  const navigate = useNavigate()
  const currentUser = api.getCurrentUser()
  const isAdmin = (currentUser?.role || "admin") === "admin"

  const [tab, setTab] = useState<Tab>("crops")
  const [cropCatalog, setCropCatalog] = useState<CropCatalogItem[]>([])
  const [fertilizers, setFertilizers] = useState<FertilizerItem[]>([])
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // Forms
  const [cropForm, setCropForm] = useState({ name: "", variety: "", category: "Cereal Grain", growing_days: "90", ideal_soil: "" })
  const [fertForm, setFertForm] = useState({ name: "", npk_ratio: "", type: "Synthetic Granular", unit_price: "", unit: "bag (50kg)" })
  const [custForm, setCustForm] = useState({ name: "", contact_person: "", phone: "", email: "", buyer_type: "Wholesaler", address: "" })

  async function loadAll() {
    const [c, f, u, a] = await Promise.all([
      api.getCropCatalog().catch(() => []),
      api.getFertilizers().catch(() => []),
      api.getCustomers().catch(() => []),
      api.getAuditLogs().catch(() => []),
    ])
    setCropCatalog(c)
    setFertilizers(f)
    setCustomers(u)
    setAuditLogs(a)
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleAddCrop(e: React.FormEvent) {
    e.preventDefault()
    await api.createCropCatalog({
      name: cropForm.name,
      variety: cropForm.variety,
      category: cropForm.category,
      growing_days: Number(cropForm.growing_days) || 90,
      ideal_soil: cropForm.ideal_soil,
    })
    setCropForm({ name: "", variety: "", category: "Cereal Grain", growing_days: "90", ideal_soil: "" })
    loadAll()
  }

  async function handleAddFertilizer(e: React.FormEvent) {
    e.preventDefault()
    await api.createFertilizer({
      name: fertForm.name,
      npk_ratio: fertForm.npk_ratio,
      type: fertForm.type,
      unit_price: Number(fertForm.unit_price) || 0,
      unit: fertForm.unit,
    })
    setFertForm({ name: "", npk_ratio: "", type: "Synthetic Granular", unit_price: "", unit: "bag (50kg)" })
    loadAll()
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    await api.createCustomer(custForm)
    setCustForm({ name: "", contact_person: "", phone: "", email: "", buyer_type: "Wholesaler", address: "" })
    loadAll()
  }

  return (
    <div className="min-h-screen bg-[#F6F9F7] p-6">
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
              <Database className="h-6 w-6 text-[#2D5A27]" />
              Master Reference Catalogs & Security Logs
            </h1>
            <p className="text-sm text-[#5B6E61]">
              WBS 1.4–1.5 (RBAC & Audit Trail) and WBS 2.1–2.3 (Crop Varieties, Fertilizers & Buyers)
            </p>
          </div>
          <Badge className="bg-[#2D5A27] text-white">
            Active Role: {isAdmin ? "Farm Admin (Full Write)" : "Field Worker (Restricted)"}
          </Badge>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant={tab === "crops" ? "default" : "outline"}
            onClick={() => setTab("crops")}
            className={tab === "crops" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <Sprout className="h-4 w-4 mr-2" /> Crop Catalog ({cropCatalog.length})
          </Button>
          <Button
            variant={tab === "fertilizers" ? "default" : "outline"}
            onClick={() => setTab("fertilizers")}
            className={tab === "fertilizers" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <FlaskConical className="h-4 w-4 mr-2" /> Fertilizers ({fertilizers.length})
          </Button>
          <Button
            variant={tab === "customers" ? "default" : "outline"}
            onClick={() => setTab("customers")}
            className={tab === "customers" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <Users className="h-4 w-4 mr-2" /> Buyers & Clients ({customers.length})
          </Button>
          <Button
            variant={tab === "audit" ? "default" : "outline"}
            onClick={() => setTab("audit")}
            className={tab === "audit" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <ShieldCheck className="h-4 w-4 mr-2" /> Audit Logs ({auditLogs.length})
          </Button>
        </div>

        {/* TAB 1: WBS 2.1 Crop Catalog */}
        {tab === "crops" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Add Crop Reference (WBS 2.1)</CardTitle>
                <CardDescription className="text-xs">Standardize crop varieties and maturity periods</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCrop} className="space-y-3">
                  <div>
                    <Label className="text-xs">Crop Name</Label>
                    <Input placeholder="e.g. Rice" value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-xs">Variety</Label>
                    <Input placeholder="e.g. NSIC Rc222" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Input placeholder="e.g. Cereal Grain" value={cropForm.category} onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Growing Period (Days)</Label>
                    <Input type="number" value={cropForm.growing_days} onChange={(e) => setCropForm({ ...cropForm, growing_days: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-xs">Ideal Soil Type</Label>
                    <Input placeholder="e.g. Clay Loam" value={cropForm.ideal_soil} onChange={(e) => setCropForm({ ...cropForm, ideal_soil: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={!isAdmin} className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Save Crop Variety
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Crop & Variety</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Maturity</th>
                    <th className="p-3">Ideal Soil</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {cropCatalog.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-[#1F2922]">
                        {item.name} <span className="text-xs text-[#2D5A27]">({item.variety})</span>
                      </td>
                      <td className="p-3 text-xs">{item.category}</td>
                      <td className="p-3 font-mono text-xs">{item.growing_days} days</td>
                      <td className="p-3 text-xs text-gray-600">{item.ideal_soil || "—"}</td>
                      <td className="p-3 text-right">
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => api.deleteCropCatalog(item.id).then(loadAll)} className="text-rose-600 h-7 px-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB 2: WBS 2.2 Fertilizers */}
        {tab === "fertilizers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Add Fertilizer (WBS 2.2)</CardTitle>
                <CardDescription className="text-xs">N-P-K formulation and unit cost catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFertilizer} className="space-y-3">
                  <div>
                    <Label className="text-xs">Fertilizer Name</Label>
                    <Input placeholder="e.g. Urea (46-0-0)" value={fertForm.name} onChange={(e) => setFertForm({ ...fertForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-xs">N-P-K Ratio</Label>
                    <Input placeholder="e.g. 46-0-0" value={fertForm.npk_ratio} onChange={(e) => setFertForm({ ...fertForm, npk_ratio: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Input placeholder="e.g. Nitrogenous" value={fertForm.type} onChange={(e) => setFertForm({ ...fertForm, type: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Unit Price (₱)</Label>
                      <Input type="number" step="0.01" placeholder="1380" value={fertForm.unit_price} onChange={(e) => setFertForm({ ...fertForm, unit_price: e.target.value })} required />
                    </div>
                    <div>
                      <Label className="text-xs">Packaging Unit</Label>
                      <Input value={fertForm.unit} onChange={(e) => setFertForm({ ...fertForm, unit: e.target.value })} />
                    </div>
                  </div>
                  <Button type="submit" disabled={!isAdmin} className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Add Fertilizer
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Fertilizer Name</th>
                    <th className="p-3">N-P-K</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {fertilizers.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-[#1F2922]">{item.name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-xs border-[#2D5A27] text-[#2D5A27]">{item.npk_ratio}</Badge>
                      </td>
                      <td className="p-3 text-xs">{item.type}</td>
                      <td className="p-3 font-mono text-xs">₱{Number(item.unit_price).toLocaleString()} / {item.unit}</td>
                      <td className="p-3 text-right">
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => api.deleteFertilizer(item.id).then(loadAll)} className="text-rose-600 h-7 px-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB 3: WBS 2.3 Customers */}
        {tab === "customers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Register Buyer (WBS 2.3)</CardTitle>
                <CardDescription className="text-xs">Stakeholder and institutional buyer directory</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCustomer} className="space-y-3">
                  <div>
                    <Label className="text-xs">Buyer / Organization Name</Label>
                    <Input placeholder="e.g. Nueva Vizcaya Agri Trading" value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-xs">Contact Person</Label>
                    <Input placeholder="Full Name" value={custForm.contact_person} onChange={(e) => setCustForm({ ...custForm, contact_person: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input placeholder="09XX-XXX-XXXX" value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Buyer Type</Label>
                      <Input placeholder="Wholesaler" value={custForm.buyer_type} onChange={(e) => setCustForm({ ...custForm, buyer_type: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <Input placeholder="Municipality, Province" value={custForm.address} onChange={(e) => setCustForm({ ...custForm, address: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={!isAdmin} className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Register Buyer
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Organization / Buyer</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {customers.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-[#1F2922]">{item.name}</td>
                      <td className="p-3 text-xs">{item.contact_person}<br /><span className="text-gray-500">{item.phone}</span></td>
                      <td className="p-3 text-xs">{item.buyer_type}</td>
                      <td className="p-3 text-xs text-gray-600">{item.address}</td>
                      <td className="p-3 text-right">
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => api.deleteCustomer(item.id).then(loadAll)} className="text-rose-600 h-7 px-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB 4: WBS 1.4 & 1.5 RBAC & Audit Logs */}
        {tab === "audit" && (
          <Card className="border-[#D8E2DC] overflow-hidden">
            <CardHeader className="bg-[#D8E2DC]/20 border-b border-[#D8E2DC]">
              <CardTitle className="text-base">System Audit Trail & Activity Log (WBS 1.5)</CardTitle>
              <CardDescription className="text-xs">
                RBAC Accounts active: <strong>admin@farm.com / admin123</strong> (Full Access) and <strong>worker@farm.com / worker123</strong> (Field Staff Read/Log Access)
              </CardDescription>
            </CardHeader>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E2DC]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 font-mono text-xs text-gray-500">{log.created_at}</td>
                    <td className="p-3 text-xs font-semibold">{log.user_name} ({log.user_role})</td>
                    <td className="p-3 text-xs">{log.module}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs font-mono">{log.action}</Badge>
                    </td>
                    <td className="p-3 text-xs text-gray-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}