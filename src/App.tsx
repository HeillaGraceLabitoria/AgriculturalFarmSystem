import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import FarmManagement from "@/pages/FarmManagement"
import FarmDetails from "@/pages/FarmDetails"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farms" element={<FarmManagement />} />
        <Route path="/farms/:farmId" element={<FarmDetails />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
