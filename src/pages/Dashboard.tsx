import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Leaf, Sprout, Wheat, PhilippinePeso, LogOut } from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agricultural Farm Management System
          </h1>
          <p className="text-sm text-muted-foreground">
            Farm operations and financial management dashboard
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/login")}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Farms
              </CardTitle>
              <Leaf className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground mt-1">Across 2 regions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Crops
              </CardTitle>
              <Sprout className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">Rice, Corn, Sugarcane, Cassava</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Harvested Quantity
              </CardTitle>
              <Wheat className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18,450 kg</div>
              <p className="text-xs text-muted-foreground mt-1">+15% from last cycle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sales
              </CardTitle>
              <PhilippinePeso className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱485,250.00</div>
              <p className="text-xs text-muted-foreground mt-1">This harvest season</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
