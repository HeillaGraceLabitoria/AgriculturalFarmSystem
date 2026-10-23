import { useState, useEffect } from "react"
import { GraduationCap, Plus, Pencil, Trash2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface Course {
  id: number
  course_code: string
  course_name: string
  description: string
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ course_code: "", course_name: "", description: "" })
  const [showModal, setShowModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      setLoading(true)
      const res = await fetch("/api/courses").then(r => r.json())
      setCourses(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenAdd() {
    setEditingId(null)
    setForm({ course_code: "", course_name: "", description: "" })
    setErrorMsg("")
    setShowModal(true)
  }

  function handleOpenEdit(course: Course) {
    setEditingId(course.id)
    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || ""
    })
    setErrorMsg("")
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")

    try {
      const url = editingId ? `/api/courses/${editingId}` : "/api/courses"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save course")
      }

      setShowModal(false)
      fetchCourses()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this course?")) return
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchCourses()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredCourses = courses.filter(c =>
    c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2922] flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-[#2D5A27]" />
            Course Management
          </h1>
          <p className="text-sm text-[#5B6E61]">
            Create, view, update, and delete academic courses and programs.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>

      <Card className="border-[#D8E2DC]">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by course code or title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-sm border-[#D8E2DC]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#D8E2DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#D8E2DC]/40 text-[#1F2922] font-semibold border-b border-[#D8E2DC]">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Course Code</th>
                <th className="p-3.5">Course Name / Title</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E2DC]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">Loading courses...</td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No courses registered yet.</td>
                </tr>
              ) : (
                filteredCourses.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-xs text-gray-500">{c.id}</td>
                    <td className="p-3.5 font-bold text-[#2D5A27]">{c.course_code}</td>
                    <td className="p-3.5 font-medium text-[#1F2922]">{c.course_name}</td>
                    <td className="p-3.5 text-xs text-gray-600">{c.description || "—"}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(c)}
                        className="h-8 border-[#87A987] text-[#2D5A27] hover:bg-[#87A987]/20"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(c.id)}
                        className="h-8 border-rose-300 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-[#D8E2DC] shadow-xl">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <CardTitle className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#2D5A27]" />
                {editingId ? "Edit Course" : "Add New Course"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922]">Course Code (e.g. BSIT, BSBA)</Label>
                  <Input
                    placeholder="BSIT"
                    value={form.course_code}
                    onChange={e => setForm({ ...form, course_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922]">Course Name</Label>
                  <Input
                    placeholder="Bachelor of Science in Information Technology"
                    value={form.course_name}
                    onChange={e => setForm({ ...form, course_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922]">Description / Department</Label>
                  <Input
                    placeholder="School of Engineering, Architecture, and IT"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#D8E2DC]">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    {editingId ? "Save Changes" : "Create Course"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}