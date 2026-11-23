import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  api,
  type Farm,
  type Crop,
  type Harvest,
  type Sale,
  type CustomerItem,
  type FinancialSummary,
} from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Wheat,
  PhilippinePeso,
  BarChart3,
  Plus,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Clock,
} from "lucide-react"

type ReportTab = "harvests" | "sales" | "analytics"

export default function HarvestSalesReports() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ReportTab>("harvests")

  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({
    breakdown: [],
    totals: { harvest_kg: 0, gross_revenue: 0, labor_cost: 0, fertilizer_cost: 0, total_expense: 0, net_profit: 0 },
  })

  // Harvest Form
  const [harvestForm, setHarvestForm] = useState({
    crop_id: "",
    farm_id: "",
    crop_name: "",
    harvest_date: new Date().toISOString().split("T")[0],
    quantity_kg: "",
    quality_grade: "A",
    notes: "",
  })

  // Sales Form
  const [saleForm, setSaleForm] = useState({
    farm_id: "",
    harvest_id: "",
    crop_name: "",
    buyer_name: "",
    sale_date: new Date().toISOString().split("T")[0],
    quantity_kg: "",
    price_per_kg: "",
    payment_status: "paid" as "paid" | "pending",
  })

  async function loadAll() {
    const [f, cr, h, s, cust, fin] = await Promise.all([
      api.getFarms().catch(() => []),
      api.getCrops().catch(() => []),
      api.getHarvests().catch(() => []),
      api.getSales().catch(() => []),
      api.getCustomers().catch(() => []),
      api.getFinancialSummary().catch(() => ({
        breakdown: [],
        totals: { harvest_kg: 0, gross_revenue: 0, labor_cost: 0, fertilizer_cost: 0, total_expense: 0, net_profit: 0 },
      })),
    ])
    setFarms(f)
    setCrops(cr)
    setHarvests(h)
    setSales(s)
    setCustomers(cust)
    setSummary(fin)
  }

  useEffect(() => {
    loadAll()
  }, [])

  function handleCropSelect(cropId: string) {
    const crop = crops.find((c) => String(c.id) === cropId)
    if (!crop) {
      setHarvestForm({ ...harvestForm, crop_id: cropId })
      return
    }
    setHarvestForm({
      ...harvestForm,
      crop_id: cropId,
      farm_id: String(crop.farm_id || ""),
      crop_name: crop.variety ? `${crop.name} (${crop.variety})` : crop.name,
    })
  }

  async function handleLogHarvest(e: React.FormEvent) {
    e.preventDefault()
    if (!harvestForm.crop_name || !harvestForm.quantity_kg) return
    const selectedCrop = crops.find((c) => String(c.id) === harvestForm.crop_id)
    const selectedFarm = farms.find((f) => String(f.id) === harvestForm.farm_id)

    await api.createHarvest({
      crop_id: harvestForm.crop_id ? Number(harvestForm.crop_id) : undefined,
      farm_id: harvestForm.farm_id ? Number(harvestForm.farm_id) : undefined,
      field_id: selectedCrop?.field_id,
      farm_name: selectedFarm?.name,
      crop_name: harvestForm.crop_name,
      harvest_date: harvestForm.harvest_date,
      quantity_kg: Number(harvestForm.quantity_kg),
      quality_grade: harvestForm.quality_grade,
      notes: harvestForm.notes,
    })

    setHarvestForm({
      crop_id: "",
      farm_id: "",
      crop_name: "",
      harvest_date: new Date().toISOString().split("T")[0],
      quantity_kg: "",
      quality_grade: "A",
      notes: "",
    })
    loadAll()
  }

  function handleHarvestSelectForSale(harvestId: string) {
    const h = harvests.find((item) => String(item.id) === harvestId)
    if (!h) {
      setSaleForm({ ...saleForm, harvest_id: harvestId })
      return
    }
    setSaleForm({
      ...saleForm,
      harvest_id: harvestId,
      farm_id: String(h.farm_id || ""),
      crop_name: h.crop_name,
      quantity_kg: String(h.quantity_kg),
    })
  }

  const calculatedSaleTotal = (Number(saleForm.quantity_kg) || 0) * (Number(saleForm.price_per_kg) || 0)

  async function handleRecordSale(e: React.FormEvent) {
    e.preventDefault()
    if (!saleForm.crop_name || !saleForm.buyer_name || !saleForm.quantity_kg || !saleForm.price_per_kg) return
    await api.createSale({
      farm_id: saleForm.farm_id ? Number(saleForm.farm_id) : undefined,
      harvest_id: saleForm.harvest_id ? Number(saleForm.harvest_id) : undefined,
      crop_name: saleForm.crop_name,
      buyer_name: saleForm.buyer_name,
      sale_date: saleForm.sale_date,
      quantity_kg: Number(saleForm.quantity_kg),
      price_per_kg: Number(saleForm.price_per_kg),
      payment_status: saleForm.payment_status,
    })
    setSaleForm({
      farm_id: "",
      harvest_id: "",
      crop_name: "",
      buyer_name: "",
      sale_date: new Date().toISOString().split("T")[0],
      quantity_kg: "",
      price_per_kg: "",
      payment_status: "paid",
    })
    loadAll()
  }

  function handleExportCsv() {
    const headers = ["Farm Name", "Location", "Area (ha)", "Harvested (kg)", "Gross Revenue (PHP)", "Labor Cost (PHP)", "Fertilizer Cost (PHP)", "Total Expenses (PHP)", "Net Profit (PHP)"]
    const rows = summary.breakdown.map((r) => [
      `"${r.farm_name}"`,
      `"${r.location}"`,
      r.area_hectares,
      r.harvest_kg,
      r.gross_revenue.toFixed(2),
      r.labor_cost.toFixed(2),
      r.fertilizer_cost.toFixed(2),
      r.total_expense.toFixed(2),
      r.net_profit.toFixed(2),
    ])
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `AFMS_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
              <BarChart3 className="h-6 w-6 text-[#2D5A27]" />
              Harvest, Sales & Financial Reports
            </h1>
            <p className="text-sm text-[#5B6E61]">
              Yield Logging, Revenue Transactions, Net Profit Statements & Exportable Analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="border-[#2D5A27] text-[#2D5A27] hover:bg-[#D8E2DC]/40">
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
              <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant={tab === "harvests" ? "default" : "outline"}
            onClick={() => setTab("harvests")}
            className={tab === "harvests" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <Wheat className="h-4 w-4 mr-2" /> Harvest Yield Logs ({harvests.length})
          </Button>
          <Button
            variant={tab === "sales" ? "default" : "outline"}
            onClick={() => setTab("sales")}
            className={tab === "sales" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <PhilippinePeso className="h-4 w-4 mr-2" /> Sales & Revenue ({sales.length})
          </Button>
          <Button
            variant={tab === "analytics" ? "default" : "outline"}
            onClick={() => setTab("analytics")}
            className={tab === "analytics" ? "bg-[#2D5A27] text-white" : "border-[#D8E2DC]"}
          >
            <BarChart3 className="h-4 w-4 mr-2" /> Net Profit & Financial Report
          </Button>
        </div>

        {/* TAB 1: Harvest Yield Logging */}
        {tab === "harvests" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Log Harvest Yield</CardTitle>
                <CardDescription className="text-xs">
                  Record harvested volume and mark active crop batches as completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogHarvest} className="space-y-3">
                  <div>
                    <Label className="text-xs">Link Active Crop Batch (Optional)</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={harvestForm.crop_id}
                      onChange={(e) => handleCropSelect(e.target.value)}
                    >
                      <option value="">-- Select Active Batch --</option>
                      {crops
                        .filter((c) => c.status !== "harvested")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.batch_code || `BATCH-${c.id}`}: {c.name} ({c.farm_name})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Farm Site</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={harvestForm.farm_id}
                      onChange={(e) => setHarvestForm({ ...harvestForm, farm_id: e.target.value })}
                      required
                    >
                      <option value="">-- Select Farm --</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Harvested Crop & Variety</Label>
                    <Input
                      placeholder="e.g. Rice (Jasmine RC222)"
                      value={harvestForm.crop_name}
                      onChange={(e) => setHarvestForm({ ...harvestForm, crop_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Harvest Date</Label>
                      <Input
                        type="date"
                        value={harvestForm.harvest_date}
                        onChange={(e) => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quality Grade</Label>
                      <select
                        className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                        value={harvestForm.quality_grade}
                        onChange={(e) => setHarvestForm({ ...harvestForm, quality_grade: e.target.value })}
                      >
                        <option value="A">Grade A (Premium)</option>
                        <option value="B">Grade B (Standard)</option>
                        <option value="C">Grade C (Processing)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Yield Volume (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="4500"
                      value={harvestForm.quantity_kg}
                      onChange={(e) => setHarvestForm({ ...harvestForm, quantity_kg: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Post-Harvest Notes</Label>
                    <Input
                      placeholder="Moisture level, storage warehouse..."
                      value={harvestForm.notes}
                      onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Record Harvest Yield
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Crop & Farm</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Quantity (kg)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {harvests.map((h) => (
                    <tr key={h.id}>
                      <td className="p-3 font-mono text-xs">{h.harvest_date}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#1F2922]">{h.crop_name}</div>
                        <div className="text-xs text-[#5B6E61]">{h.farm_name} {h.field_name ? `• ${h.field_name}` : ""}</div>
                        {h.notes && <div className="text-[11px] text-gray-500">{h.notes}</div>}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-[#87A987]/25 text-[#2D5A27] border border-[#87A987]">
                          Grade {h.quality_grade || "A"}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#1F2922]">
                        {Number(h.quantity_kg).toLocaleString()} kg
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => api.deleteHarvest(h.id).then(loadAll)}
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

        {/* TAB 2: Sales & Revenue Transactions */}
        {tab === "sales" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-[#D8E2DC]">
              <CardHeader>
                <CardTitle className="text-base">Record Produce Sale</CardTitle>
                <CardDescription className="text-xs">
                  Link harvested stock to registered buyers and compute total revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecordSale} className="space-y-3">
                  <div>
                    <Label className="text-xs">Source Harvest Batch (Optional)</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={saleForm.harvest_id}
                      onChange={(e) => handleHarvestSelectForSale(e.target.value)}
                    >
                      <option value="">-- Select Harvest Stock --</option>
                      {harvests.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.crop_name} ({Number(h.quantity_kg).toLocaleString()} kg - {h.farm_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Origin Farm</Label>
                    <select
                      className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                      value={saleForm.farm_id}
                      onChange={(e) => setSaleForm({ ...saleForm, farm_id: e.target.value })}
                      required
                    >
                      <option value="">-- Select Farm --</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Produce / Crop Sold</Label>
                    <Input
                      placeholder="e.g. Rice (NSIC Rc160)"
                      value={saleForm.crop_name}
                      onChange={(e) => setSaleForm({ ...saleForm, crop_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Buyer / Institutional Client</Label>
                    <Input
                      list="buyer-options"
                      placeholder="Select or type buyer name..."
                      value={saleForm.buyer_name}
                      onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })}
                      required
                    />
                    <datalist id="buyer-options">
                      {customers.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Volume Sold (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={saleForm.quantity_kg}
                        onChange={(e) => setSaleForm({ ...saleForm, quantity_kg: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price per kg (₱)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="25.00"
                        value={saleForm.price_per_kg}
                        onChange={(e) => setSaleForm({ ...saleForm, price_per_kg: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Transaction Date</Label>
                      <Input
                        type="date"
                        value={saleForm.sale_date}
                        onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Payment Status</Label>
                      <select
                        className="w-full h-9 rounded-md border border-[#D8E2DC] bg-white px-3 text-sm"
                        value={saleForm.payment_status}
                        onChange={(e) => setSaleForm({ ...saleForm, payment_status: e.target.value as "paid" | "pending" })}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#D8E2DC]/40 p-3 border border-[#87A987]/50 flex justify-between items-center text-xs">
                    <span className="text-[#5B6E61] font-medium">Total Invoice Amount:</span>
                    <span className="font-mono text-base font-extrabold text-[#2D5A27]">
                      ₱{calculatedSaleTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <Button type="submit" className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Save Sales Order
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-[#D8E2DC] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Crop & Buyer</th>
                    <th className="p-3">Volume × Rate</th>
                    <th className="p-3">Total Revenue</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono text-xs">{s.sale_date}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#1F2922]">{s.crop_name}</div>
                        <div className="text-xs text-[#5B6E61]">{s.buyer_name}</div>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {Number(s.quantity_kg).toLocaleString()} kg × ₱{Number(s.price_per_kg).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#2D5A27]">
                        ₱{Number(s.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() =>
                            api.updateSaleStatus(s.id, s.payment_status === "paid" ? "pending" : "paid").then(loadAll)
                          }
                          className="cursor-pointer"
                          title="Click to toggle payment status"
                        >
                          {s.payment_status === "paid" ? (
                            <Badge className="bg-[#2D5A27] text-white gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-[#DDA15E] text-[#1F2922] gap-1">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => api.deleteSale(s.id).then(loadAll)}
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

        {/* TAB 3: Net Profit & Financial Analytics Report */}
        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-[#D8E2DC]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-[#5B6E61]">Gross Sales Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-[#2D5A27]">
                    ₱{summary.totals.gross_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#D8E2DC]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-[#5B6E61]">Total Labor Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-[#1F2922]">
                    ₱{summary.totals.labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#D8E2DC]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-[#5B6E61]">Fertilizer Input Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-[#1F2922]">
                    ₱{summary.totals.fertilizer_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#2D5A27] bg-[#2D5A27] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-[#D8E2DC]">Net Farm Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold">
                    ₱{summary.totals.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#D8E2DC] overflow-hidden">
              <CardHeader className="bg-[#D8E2DC]/25 border-b border-[#D8E2DC]">
                <CardTitle className="text-base">Farm-by-Farm Profit & Loss Statement</CardTitle>
                <CardDescription className="text-xs">
                  Consolidated yield, gross sales revenue, operational expenses, and net profit margin per production site
                </CardDescription>
              </CardHeader>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#D8E2DC]/40 text-[#1F2922] border-b border-[#D8E2DC]">
                  <tr>
                    <th className="p-3">Farm Site</th>
                    <th className="p-3">Harvest Yield</th>
                    <th className="p-3">Gross Revenue</th>
                    <th className="p-3">Labor Cost</th>
                    <th className="p-3">Fertilizer Cost</th>
                    <th className="p-3">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E2DC]">
                  {summary.breakdown.map((row) => (
                    <tr key={row.farm_id}>
                      <td className="p-3">
                        <div className="font-bold text-[#1F2922]">{row.farm_name}</div>
                        <div className="text-xs text-[#5B6E61]">{row.location} • {row.area_hectares} ha</div>
                      </td>
                      <td className="p-3 font-mono text-xs">{row.harvest_kg.toLocaleString()} kg</td>
                      <td className="p-3 font-mono text-xs text-[#2D5A27] font-semibold">
                        ₱{row.gross_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-600">
                        ₱{row.labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-600">
                        ₱{row.fertilizer_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 font-mono text-xs font-bold ${row.net_profit >= 0 ? "text-[#2D5A27]" : "text-rose-600"}`}>
                        ₱{row.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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