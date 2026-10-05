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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Leaf className="h-7 w-7 text-emerald-700" />
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Agricultural Farm Management System
          </CardTitle>

          <CardDescription>
            Local SQLite Edition
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium">Local SQLite Database Active</p>
              <p className="text-xs text-emerald-700 mt-1">
                Default Credentials:
                <br />
                Email: <code className="font-semibold text-emerald-900">admin@farm.com</code>
                <br />
                Password: <code className="font-semibold text-emerald-900">admin123</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@farm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In to Farm System"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
