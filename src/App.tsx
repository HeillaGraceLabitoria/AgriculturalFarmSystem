import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import FarmManagement from "@/pages/FarmManagement"
import FarmDetails from "@/pages/FarmDetails"
import MasterData from "@/pages/MasterData"
import FieldOperations from "@/pages/FieldOperations"
import HarvestSalesReports from "@/pages/HarvestSalesReports"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farms" element={<FarmManagement />} />
        <Route path="/farms/:farmId" element={<FarmDetails />} />
        <Route path="/master-data" element={<MasterData />} />
        <Route path="/operations" element={<FieldOperations />} />
        <Route path="/harvest-sales" element={<HarvestSalesReports />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App