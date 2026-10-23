import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Leaf, Eye, EyeOff, KeyRound, UserCheck } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Accept default admin or any valid input
    if (
      (email === "admin@farm.local" && password === "admin123") ||
      (email.trim().length > 0 && password.trim().length > 0)
    ) {
      localStorage.setItem("afms_authenticated", "true")
      navigate("/dashboard")
    } else {
      setError("Please enter the credentials provided above.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        
        {/* Credentials Display Card Above Login */}
        <div className="bg-[#2D5A27]/10 border border-[#2D5A27]/25 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-[#2D5A27] font-semibold text-xs mb-2">
            <KeyRound className="h-4 w-4" />
            <span>Demonstration Access Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 rounded border border-[#D8E2DC]">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-sans">Username / Email</span>
              <strong className="text-[#1F2922] select-all">admin@farm.local</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-sans">Password</span>
              <strong className="text-[#1F2922] select-all">admin123</strong>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-[#D8E2DC] shadow-md bg-white">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-[#2D5A27]/10 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-[#2D5A27]" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-[#1F2922]">
              Agricultural Farm Management
            </CardTitle>
            <CardDescription className="text-xs text-[#5B6E61]">
              Sign in to manage farms, crops, and student course enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                  {error}
                </div>
              )}
<div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#1F2922]">
                  Username or Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#D8E2DC]"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#1F2922]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#D8E2DC] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-white flex items-center justify-center gap-2"
              >
                <UserCheck className="h-4 w-4" /> Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}