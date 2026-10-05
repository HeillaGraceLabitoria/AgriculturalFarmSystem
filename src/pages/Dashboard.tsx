import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Sprout, Wheat, PhilippinePeso } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Agricultural Farm Management System
        </h1>
        <p className="text-sm text-muted-foreground">
          Farm operations and financial management dashboard
        </p>
      </header>

      <main className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Farms
              </CardTitle>
              <Leaf className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Crops
              </CardTitle>
              <Sprout className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Harvested Quantity
              </CardTitle>
              <Wheat className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 kg</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sales
              </CardTitle>
              <PhilippinePeso className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">?0.00</div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
