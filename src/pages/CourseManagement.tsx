import { useState, useEffect } from "react"
import { GraduationCap, Plus, Pencil, Trash2, Search, Calendar, User, Hash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface StudentEnrollment {
  id: number
  student_name: string
  college_id: string
  course: "BSIT" | "BSBA" | "BSED" | "BSN" | "BEED" | string
  enrollment_date: string
}

const COURSE_OPTIONS = [
  { code: "BSIT", name: "BS Information Technology" },
  { code: "BSBA", name: "BS Business Administration" },
  { code: "BSED", name: "BS Secondary Education" },
  { code: "BSN", name: "BS Nursing" },
  { code: "BEED", name: "BS Elementary Education" },
]

const STORAGE_KEY = "afms_student_enrollments"

const DEFAULT_ENROLLMENTS: StudentEnrollment[] = [
  {
    id: 1,
    student_name: "Heilla Grace Labitoria",
    college_id: "22-01948",
    course: "BSIT",
    enrollment_date: "2024-08-15",
  },
  {
    id: 2,
    student_name: "Juan Dela Cruz",
    college_id: "23-00412",
    course: "BSBA",
    enrollment_date: "2024-08-18",
  },
]

export default function CourseManagement() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("ALL")

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    student_name: "",
    college_id: "",
    course: "BSIT",
    enrollment_date: new Date().toISOString().split("T")[0],
  })

  // Load from localStorage (persists on Vercel static deployments)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setEnrollments(JSON.parse(saved))
      } catch {
        setEnrollments(DEFAULT_ENROLLMENTS)
      }
    } else {
      setEnrollments(DEFAULT_ENROLLMENTS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ENROLLMENTS))
    }
  }, [])

  function saveEnrollments(updated: StudentEnrollment[]) {
    setEnrollments(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function handleOpenAdd() {
    setEditingId(null)
    setForm({
      student_name: "",
      college_id: "",
      course: "BSIT",
      enrollment_date: new Date().toISOString().split("T")[0],
    })
    setShowModal(true)
  }

  function handleOpenEdit(item: StudentEnrollment) {
    setEditingId(item.id)
    setForm({
      student_name: item.student_name,
      college_id: item.college_id,
      course: item.course,
      enrollment_date: item.enrollment_date,
    })
    setShowModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.student_name.trim() || !form.college_id.trim()) {
      alert("Please fill in both Student Name and College ID.")
      return
    }

    if (editingId !== null) {
      // UPDATE (U in CRUD)
      const updated = enrollments.map((item) =>
        item.id === editingId ? { ...item, ...form } : item
      )
      saveEnrollments(updated)
    } else {
      // CREATE (C in CRUD)
      const newItem: StudentEnrollment = {
        id: Date.now(),
        ...form,
      }
      saveEnrollments([newItem, ...enrollments])
    }

    setShowModal(false)
  }

  // DELETE (D in CRUD)
  function handleDelete(id: number) {
    if (window.confirm("Are you sure you want to remove this student enrollment record?")) {
      const updated = enrollments.filter((item) => item.id !== id)
      saveEnrollments(updated)
    }
  }

  // READ / Search Filtering (R in CRUD)
  const filteredEnrollments = enrollments.filter((item) => {
    const matchesSearch =
      item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.college_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = filterCourse === "ALL" || item.course === filterCourse
    return matchesSearch && matchesCourse
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2922] flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-[#2D5A27]" />
            Student Course Enrollment Management
          </h1>
          <p className="text-sm text-[#5B6E61]">
            Manage student registrations, assigned degree programs, and enrollment dates.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#2D5A27] hover:bg-[#23471E] text-[#F9FBF7] flex items-center gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Enroll New Student
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="border-[#D8E2DC]">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by student name or college ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm border-[#D8E2DC]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-[#1F2922] whitespace-nowrap">
              Filter Course:
            </Label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="h-9 px-3 py-1 bg-white border border-[#D8E2DC] rounded-md text-xs font-medium text-[#1F2922] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A27]"
            >
              <option value="ALL">All Courses</option>
              {COURSE_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-[#D8E2DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#D8E2DC]/40 text-[#1F2922] font-semibold border-b border-[#D8E2DC]">
              <tr>
                <th className="p-3.5">College ID</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Course Choice</th>
                <th className="p-3.5">Enrollment Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E2DC]">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No enrollment records found.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-xs font-semibold text-[#1F2922]">
                      {row.college_id}
                    </td>
                    <td className="p-3.5 font-medium text-[#1F2922]">{row.student_name}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/20">
                        {row.course}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-gray-600 font-mono">
                      {row.enrollment_date}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(row)}
                        className="h-8 border-[#87A987] text-[#2D5A27] hover:bg-[#87A987]/20"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(row.id)}
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

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-[#D8E2DC] shadow-2xl">
            <CardHeader className="pb-3 border-b border-[#D8E2DC]">
              <CardTitle className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#2D5A27]" />
                {editingId ? "Edit Student Record" : "Enroll New Student"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* College ID */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-gray-500" /> College ID
                  </Label>
                  <Input
                    placeholder="e.g. 23-01948"
                    value={form.college_id}
                    onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                    className="border-[#D8E2DC]"
                    required
                  />
                </div>

                {/* Student Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-500" /> Student Full Name
                  </Label>
                  <Input
                    placeholder="e.g. Heilla Grace Labitoria"
                    value={form.student_name}
                    onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                    className="border-[#D8E2DC]"
                    required
                  />
                </div>

                {/* Course Dropdown */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-gray-500" /> Course Choice
                  </Label>
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-[#D8E2DC] rounded-md text-sm text-[#1F2922] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A27]"
                    required
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enrollment Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" /> Enrollment Date
                  </Label>
                  <Input
                    type="date"
                    value={form.enrollment_date}
                    onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                    className="border-[#D8E2DC]"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-[#D8E2DC]">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
                    {editingId ? "Update Student" : "Register Enrollment"}
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