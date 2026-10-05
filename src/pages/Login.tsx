import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf, Loader2, Database } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("admin@farm.com")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setError("")
    setLoading(true)

    try {
      await api.login(email, password)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Use admin@farm.com / admin123")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FBF7] p-6">
      <Card className="w-full max-w-md border-[#D8E2DC] bg-[#FFFFFF] shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2D5A27] text-[#F9FBF7] shadow-sm">
            <Leaf className="h-7 w-7 text-[#F9FBF7]" />
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-[#1F2922]">
            Agricultural Farm Management System
          </CardTitle>

          <CardDescription className="text-xs text-[#5B6E61] mt-1">
            Local SQLite Edition • Operations & Field Control
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#87A987]/30 bg-[#D8E2DC]/30 p-3.5 text-sm text-[#1F2922]">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-[#2D5A27]" />
            <div>
              <p className="font-semibold text-xs text-[#2D5A27] uppercase tracking-wide">
                Local SQLite Database Connected
              </p>
              <p className="text-xs text-[#5B6E61] mt-1 leading-relaxed">
                Default Credentials:
                <br />
                Email: <code className="font-semibold text-[#1F2922]">admin@farm.com</code>
                <br />
                Password: <code className="font-semibold text-[#1F2922]">admin123</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#1F2922]">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@farm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[#1F2922]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#D8E2DC] focus-visible:border-[#87A987] focus-visible:ring-[#87A987]/30 text-[#1F2922]"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-[#DDA15E]/20 border border-[#DDA15E]/60 p-3 text-xs text-[#1F2922] font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] font-semibold shadow-xs"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#F9FBF7]" />}
              {loading ? "Signing in..." : "Sign In to Farm System"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
