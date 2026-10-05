import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
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
import { Leaf, Loader2, Info } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setError("")
    setLoading(true)

    if (!isSupabaseConfigured) {
      // Prototyping mode: instant local authentication
      setTimeout(() => {
        setLoading(false)
        if (
          (email.trim().toLowerCase() === "admin@farm.com" && password === "admin123") ||
          (email.trim().length > 0 && password.length >= 6)
        ) {
          navigate("/dashboard")
        } else {
          setError("Prototyping credentials: use admin@farm.com and admin123 (or password of 6+ chars)")
        }
      }, 500)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Leaf className="h-7 w-7 text-green-700" />
          </div>

          <CardTitle className="text-2xl">
            Agricultural Farm Management System
          </CardTitle>

          <CardDescription>
            Sign in to manage farm operations
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isSupabaseConfigured && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">Quick Prototyping Mode</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Email: <code className="font-semibold text-emerald-900">admin@farm.com</code>
                  <br />
                  Password: <code className="font-semibold text-emerald-900">admin123</code>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
