import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  GraduationCap,
  Users,
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  Search,
  Calendar,
  User,
  Hash,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  BookOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface CourseItem {
  id: string
  code: string
  name: string
  department: string
}

interface StudentEnrollment {
  internal_key: string
  student_name: string
  college_id: string
  course: string
  enrollment_date: string
}

const COURSES_STORAGE_KEY = "afms_academic_courses"
const ENROLLMENTS_STORAGE_KEY = "afms_student_enrollments"

const DEFAULT_COURSES: CourseItem[] = [
  { id: "c-1", code: "BSIT", name: "Bachelor of Science in Information Technology", department: "SEAIT" },
  { id: "c-2", code: "BSBA", name: "Bachelor of Science in Business Administration", department: "SAB" },
  { id: "c-3", code: "BSED", name: "Bachelor of Secondary Education", department: "STE" },
  { id: "c-4", code: "BSN", name: "Bachelor of Science in Nursing", department: "SHS" },
  { id: "c-5", code: "BEED", name: "Bachelor of Elementary Education", department: "STE" },
]

const DEFAULT_ENROLLMENTS: StudentEnrollment[] = [
  {
    internal_key: "seed-1",
    student_name: "Heilla Grace Labitoria",
    college_id: "22-01948",
    course: "BSIT",
    enrollment_date: "2024-08-10",
  },
  {
    internal_key: "seed-2",
    student_name: "Juan Dela Cruz",
    college_id: "23-00412",
    course: "BSBA",
    enrollment_date: "2024-08-15",
  },
  {
    internal_key: "seed-3",
    student_name: "Maria Santos",
    college_id: "24-00109",
    course: "BSN",
    enrollment_date: "2024-08-20",
  },
]

type SectionMode = "courses" | "enrollments"
type CrudAction = "view" | "add" | "edit" | "delete"

export default function CourseManagement() {
  const navigate = useNavigate()
  const [section, setSection] = useState<SectionMode>("enrollments")
  const [crudTab, setCrudTab] = useState<CrudAction>("view")

  const [courses, setCourses] = useState<CourseItem[]>([])
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("ALL")
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Course Add/Edit Form State
  const [courseForm, setCourseForm] = useState({ code: "", name: "", department: "" })
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")

  // Student Enrollment Add/Edit Form State
  const [enrollmentForm, setEnrollmentForm] = useState({
    student_name: "",
    college_id: "",
    course: "BSIT",
    enrollment_date: new Date().toISOString().split("T")[0],
  })
  const [selectedEnrollmentKey, setSelectedEnrollmentKey] = useState<string>("")

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const savedCourses = localStorage.getItem(COURSES_STORAGE_KEY)
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses))
      } catch {
        setCourses(DEFAULT_COURSES)
      }
    } else {
      setCourses(DEFAULT_COURSES)
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(DEFAULT_COURSES))
    }

    const savedEnrollments = localStorage.getItem(ENROLLMENTS_STORAGE_KEY)
    if (savedEnrollments) {
      try {
        const parsed: StudentEnrollment[] = JSON.parse(savedEnrollments)
        setEnrollments(sortChronologically(parsed))
      } catch {
        setEnrollments(sortChronologically(DEFAULT_ENROLLMENTS))
      }
    } else {
      setEnrollments(sortChronologically(DEFAULT_ENROLLMENTS))
      localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_ENROLLMENTS))
    }
  }, [])

  function notify(type: "success" | "error", text: string) {
    setStatusMsg({ type, text })
    setTimeout(() => setStatusMsg(null), 3000)
  }

  function sortChronologically(items: StudentEnrollment[]) {
    return [...items].sort(
      (a, b) => new Date(a.enrollment_date).getTime() - new Date(b.enrollment_date).getTime()
    )
  }

  function saveCourses(updated: CourseItem[]) {
    setCourses(updated)
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updated))
  }

  function saveEnrollments(updated: StudentEnrollment[]) {
    const sorted = sortChronologically(updated)
    setEnrollments(sorted)
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(sorted))
  }

  // COURSE CRUD HANDLERS
  function handleAddCourse(e: React.FormEvent) {
    e.preventDefault()
    const cleanCode = courseForm.code.trim().toUpperCase()
    if (!cleanCode || !courseForm.name.trim()) {
      notify("error", "Course code and course name are required.")
      return
    }

    if (courses.some((c) => c.code === cleanCode)) {
      notify("error", `Course "${cleanCode}" already exists!`)
      return
    }

    const newCourse: CourseItem = {
      id: "course-" + Date.now(),
      code: cleanCode,
      name: courseForm.name.trim(),
      department: courseForm.department.trim() || "General",
    }

    saveCourses([...courses, newCourse])
    setCourseForm({ code: "", name: "", department: "" })
    notify("success", `Course ${cleanCode} registered successfully! Now available in enrollments.`)
    setCrudTab("view")
  }

  function handleSelectCourseToEdit(id: string) {
    setSelectedCourseId(id)
    const target = courses.find((c) => c.id === id)
    if (target) {
      setCourseForm({ code: target.code, name: target.name, department: target.department })
    }
  }

  function handleEditCourse(e: React.FormEvent) {
    e.preventDefault()
    const cleanCode = courseForm.code.trim().toUpperCase()
    const updated = courses.map((c) =>
      c.id === selectedCourseId ? { ...c, code: cleanCode, name: courseForm.name.trim(), department: courseForm.department.trim() } : c
    )
    saveCourses(updated)
    notify("success", "Course updated successfully.")
    setCrudTab("view")
  }

  function handleDeleteCourse(id: string, code: string) {
    if (window.confirm(`Delete course ${code}? It will also be removed from the enrollment dropdown options.`)) {
      saveCourses(courses.filter((c) => c.id !== id))
      notify("success", `Course ${code} deleted.`)
    }
  }

  // ENROLLMENT CRUD HANDLERS
  function handleAddEnrollment(e: React.FormEvent) {
    e.preventDefault()
    if (!enrollmentForm.student_name.trim() || !enrollmentForm.college_id.trim()) {
      notify("error", "College ID and Student Name are required.")
      return
    }

    const newItem: StudentEnrollment = {
      internal_key: "rec-" + Date.now(),
      ...enrollmentForm,
      course: enrollmentForm.course || (courses[0]?.code ?? "BSIT"),
    }

    saveEnrollments([...enrollments, newItem])
    setEnrollmentForm({
      student_name: "",
      college_id: "",
      course: courses[0]?.code ?? "BSIT",
      enrollment_date: new Date().toISOString().split("T")[0],
    })
    notify("success", "Student registered successfully.")
    setCrudTab("view")
  }

  function handleSelectEnrollmentToEdit(key: string) {
    setSelectedEnrollmentKey(key)
    const target = enrollments.find((e) => e.internal_key === key)
    if (target) {
      setEnrollmentForm({
        student_name: target.student_name,
        college_id: target.college_id,
        course: target.course,
        enrollment_date: target.enrollment_date,
      })
    }
  }

  function handleEditEnrollment(e: React.FormEvent) {
    e.preventDefault()
    const updated = enrollments.map((item) =>
      item.internal_key === selectedEnrollmentKey ? { ...item, ...enrollmentForm } : item
    )
    saveEnrollments(updated)
    notify("success", "Enrollment updated successfully.")
    setCrudTab("view")
  }

  function handleDeleteEnrollment(key: string, name: string) {
    if (window.confirm(`Delete enrollment for "${name}"? Remaining records will recalculate IDs 1, 2, 3...`)) {
      saveEnrollments(enrollments.filter((e) => e.internal_key !== key))
      notify("success", `Enrollment for ${name} removed.`)
    }
  }

  // Sequential IDs (1, 2, 3...) strictly by Date Enrolled
  const numberedEnrollments = enrollments.map((item, index) => ({
    ...item,
    display_id: index + 1,
  }))

  const filteredEnrollments = numberedEnrollments.filter((item) => {
    const matchesSearch =
      item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.college_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.display_id) === searchTerm.trim()
    const matchesCourse = filterCourse === "ALL" || item.course === filterCourse
    return matchesSearch && matchesCourse
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-[#2D5A27] font-semibold mb-2 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-[#1F2922] flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-[#2D5A27]" />
            Academic Courses & Student Enrollments
          </h1>
          <p className="text-sm text-[#5B6E61]">
            Connected modules: Adding or modifying courses immediately syncs with the student enrollment dropdown.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
              statusMsg.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {statusMsg.type === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {statusMsg.text}
          </div>
        )}
      </div>

      {/* Primary Section Switcher: Courses vs Enrollments */}
      <div className="flex bg-[#D8E2DC]/30 p-1.5 rounded-lg border border-[#D8E2DC] gap-2 max-w-md">
        <button
          type="button"
          onClick={() => {
            setSection("enrollments")
            setCrudTab("view")
          }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
            section === "enrollments"
              ? "bg-[#2D5A27] text-white shadow-xs"
              : "text-[#1F2922] hover:bg-[#D8E2DC]/50"
          }`}
        >
          <Users className="h-4 w-4" /> Student Enrollments ({enrollments.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setSection("courses")
            setCrudTab("view")
          }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
            section === "courses"
              ? "bg-[#2D5A27] text-white shadow-xs"
              : "text-[#1F2922] hover:bg-[#D8E2DC]/50"
          }`}
        >
          <BookOpen className="h-4 w-4" /> Course Catalog ({courses.length})
        </button>
      </div>

      {/* Secondary Operations Bar: View / Add / Edit / Delete */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[#D8E2DC] pb-4">
        <Button
          type="button"
          variant={crudTab === "view" ? "default" : "outline"}
          onClick={() => setCrudTab("view")}
          className={`flex items-center gap-2 ${
            crudTab === "view" ? "bg-[#2D5A27] hover:bg-[#23471E] text-white" : "border-[#D8E2DC]"
          }`}
        >
          <Eye className="h-4 w-4" /> View {section === "enrollments" ? "Enrollments" : "Courses"}
        </Button>
        <Button
          type="button"
          variant={crudTab === "add" ? "default" : "outline"}
          onClick={() => setCrudTab("add")}
          className={`flex items-center gap-2 ${
            crudTab === "add" ? "bg-[#2D5A27] hover:bg-[#23471E] text-white" : "border-[#D8E2DC]"
          }`}
        >
          <PlusCircle className="h-4 w-4" /> Add {section === "enrollments" ? "Enrollment" : "Course"}
        </Button>
        <Button
          type="button"
          variant={crudTab === "edit" ? "default" : "outline"}
          onClick={() => {
            if (section === "enrollments" && !selectedEnrollmentKey && enrollments.length > 0) {
              handleSelectEnrollmentToEdit(enrollments[0].internal_key)
            } else if (section === "courses" && !selectedCourseId && courses.length > 0) {
              handleSelectCourseToEdit(courses[0].id)
            }
            setCrudTab("edit")
          }}
          className={`flex items-center gap-2 ${
            crudTab === "edit" ? "bg-[#2D5A27] hover:bg-[#23471E] text-white" : "border-[#D8E2DC]"
          }`}
        >
          <Pencil className="h-4 w-4" /> Edit {section === "enrollments" ? "Enrollment" : "Course"}
        </Button>
        <Button
          type="button"
          variant={crudTab === "delete" ? "default" : "outline"}
          onClick={() => setCrudTab("delete")}
          className={`flex items-center gap-2 ${
            crudTab === "delete"
              ? "bg-rose-700 hover:bg-rose-800 text-white"
              : "border-[#D8E2DC] text-rose-700 hover:bg-rose-50"
          }`}
        >
          <Trash2 className="h-4 w-4" /> Delete {section === "enrollments" ? "Enrollment" : "Course"}
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: STUDENT ENROLLMENTS (WITH 1, 2, 3 AUTO-INCREMENT BY DATE)       */}
      {/* ========================================================================= */}
      {section === "enrollments" && (
        <>
          {/* 1. VIEW ENROLLMENTS */}
          {crudTab === "view" && (
            <div className="space-y-4">
              <Card className="border-[#D8E2DC]">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by ID, name, or college ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 text-sm border-[#D8E2DC]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-[#1F2922] whitespace-nowrap">
                      Course Filter:
                    </Label>
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="h-9 px-3 py-1 bg-white border border-[#D8E2DC] rounded-md text-xs font-medium text-[#1F2922] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A27]"
                    >
                      <option value="ALL">All Enrolled Courses</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#D8E2DC] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#D8E2DC]/40 text-[#1F2922] font-semibold border-b border-[#D8E2DC]">
                      <tr>
                        <th className="p-3.5 w-16 text-center">ID</th>
                        <th className="p-3.5">College ID</th>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Course Choice</th>
                        <th className="p-3.5">Enrollment Date</th>
                        <th className="p-3.5 text-right">Quick Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8E2DC]">
                      {filteredEnrollments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No student enrollments found.
                          </td>
                        </tr>
                      ) : (
                        filteredEnrollments.map((row) => (
                          <tr key={row.internal_key} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 text-center font-bold text-xs text-[#2D5A27] bg-[#2D5A27]/5">
                              {row.display_id}
                            </td>
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
                            <td className="p-3.5 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleSelectEnrollmentToEdit(row.internal_key)
                                  setCrudTab("edit")
                                }}
                                className="h-8 border-[#87A987] text-[#2D5A27] hover:bg-[#87A987]/20"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 2. ADD ENROLLMENT */}
          {crudTab === "add" && (
            <Card className="border-[#D8E2DC] max-w-2xl mx-auto shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-[#2D5A27]" /> Enroll New Student
                </CardTitle>
                <CardDescription className="text-xs text-[#5B6E61]">
                  Fill in student details. The course choice dropdown reads directly from the Course Catalog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEnrollment} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5 text-gray-500" /> College ID
                    </Label>
                    <Input
                      placeholder="e.g. 23-01948"
                      value={enrollmentForm.college_id}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, college_id: e.target.value })}
                      className="border-[#D8E2DC]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-gray-500" /> Student Full Name
                    </Label>
                    <Input
                      placeholder="e.g. Heilla Grace Labitoria"
                      value={enrollmentForm.student_name}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, student_name: e.target.value })}
                      className="border-[#D8E2DC]"
                      required
                    />
                  </div>

                  {/* Connected Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5 text-gray-500" /> Course Choice (Dynamically Connected)
                    </Label>
                    <select
                      value={enrollmentForm.course}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, course: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#D8E2DC] rounded-md text-sm text-[#1F2922] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A27]"
                      required
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922] flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" /> Enrollment Date
                    </Label>
                    <Input
                      type="date"
                      value={enrollmentForm.enrollment_date}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, enrollment_date: e.target.value })}
                      className="border-[#D8E2DC]"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-[#D8E2DC]">
                    <Button type="button" variant="outline" onClick={() => setCrudTab("view")}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
                      Register Student
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 3. EDIT ENROLLMENT */}
          {crudTab === "edit" && (
            <Card className="border-[#D8E2DC] max-w-2xl mx-auto shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#2D5A27]" /> Edit Student Record
                </CardTitle>
                <CardDescription className="text-xs text-[#5B6E61]">
                  Select an enrolled student to update their information or reassign their course.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922]">Select Student:</Label>
                  <select
                    value={selectedEnrollmentKey}
                    onChange={(e) => handleSelectEnrollmentToEdit(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#D8E2DC] rounded-md text-sm text-[#1F2922]"
                  >
                    <option value="">-- Choose student --</option>
                    {numberedEnrollments.map((item) => (
                      <option key={item.internal_key} value={item.internal_key}>
                        ID #{item.display_id} - {item.student_name} ({item.college_id}) [{item.course}]
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEnrollmentKey && (
                  <form onSubmit={handleEditEnrollment} className="space-y-4 pt-2 border-t border-[#D8E2DC]">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">College ID</Label>
                      <Input
                        value={enrollmentForm.college_id}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, college_id: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">Student Name</Label>
                      <Input
                        value={enrollmentForm.student_name}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, student_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">Course Choice</Label>
                      <select
                        value={enrollmentForm.course}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, course: e.target.value })}
                        className="w-full h-10 px-3 bg-white border border-[#D8E2DC] rounded-md text-sm text-[#1F2922]"
                        required
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">Enrollment Date</Label>
                      <Input
                        type="date"
                        value={enrollmentForm.enrollment_date}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, enrollment_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-[#D8E2DC]">
                      <Button type="button" variant="outline" onClick={() => setCrudTab("view")}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
                        Save Changes
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. DELETE ENROLLMENT */}
          {crudTab === "delete" && (
            <Card className="border-[#D8E2DC] max-w-4xl mx-auto shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-rose-700 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-rose-600" /> Delete Student Enrollments
                </CardTitle>
                <CardDescription className="text-xs text-[#5B6E61]">
                  Deleting a student record causes the remaining list to immediately re-index IDs starting from 1.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {numberedEnrollments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No records to delete.</p>
                ) : (
                  <div className="divide-y divide-[#D8E2DC] border border-[#D8E2DC] rounded-md">
                    {numberedEnrollments.map((item) => (
                      <div
                        key={item.internal_key}
                        className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-rose-50/40"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs bg-[#2D5A27]/10 text-[#2D5A27] px-2 py-0.5 rounded">
                              ID #{item.display_id}
                            </span>
                            <span className="font-semibold text-sm text-[#1F2922]">
                              {item.student_name}
                            </span>
                            <span className="text-xs font-mono text-gray-500">
                              ({item.college_id})
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Course: <strong>{item.course}</strong> | Enrolled: {item.enrollment_date}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEnrollment(item.internal_key, item.student_name)}
                          className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: COURSE CATALOG (ACADEMIC PROGRAMS)                              */}
      {/* ========================================================================= */}
      {section === "courses" && (
        <>
          {/* 1. VIEW COURSES */}
          {crudTab === "view" && (
            <Card className="border-[#D8E2DC] overflow-hidden shadow-xs">
              <CardHeader className="bg-[#D8E2DC]/20 border-b border-[#D8E2DC]">
                <CardTitle className="text-base font-bold text-[#1F2922]">Active Degree Programs</CardTitle>
                <CardDescription className="text-xs text-[#5B6E61]">
                  Any program listed here will appear inside the student enrollment dropdown.
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#D8E2DC]/40 text-[#1F2922] font-semibold border-b border-[#D8E2DC]">
                    <tr>
                      <th className="p-3.5">Course Code</th>
                      <th className="p-3.5">Degree Title</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E2DC]">
                    {courses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-[#2D5A27]">{c.code}</td>
                        <td className="p-3.5 font-medium text-[#1F2922]">{c.name}</td>
                        <td className="p-3.5 text-xs text-gray-600">{c.department}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleSelectCourseToEdit(c.id)
                              setCrudTab("edit")
                            }}
                            className="h-8 border-[#87A987] text-[#2D5A27] hover:bg-[#87A987]/20"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 2. ADD COURSE */}
          {crudTab === "add" && (
            <Card className="border-[#D8E2DC] max-w-2xl mx-auto shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-[#2D5A27]" /> Add New Degree Program
                </CardTitle>
                <CardDescription className="text-xs text-[#5B6E61]">
                  Once created, this course will immediately be selectable in Student Enrollments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922]">Course Code (e.g. BSCS, BSA)</Label>
                    <Input
                      placeholder="BSCS"
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922]">Full Degree Title</Label>
                    <Input
                      placeholder="Bachelor of Science in Computer Science"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2922]">Department / School</Label>
                    <Input
                      placeholder="School of Computing"
                      value={courseForm.department}
                      onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-[#D8E2DC]">
                    <Button type="button" variant="outline" onClick={() => setCrudTab("view")}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
                      Create Course
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 3. EDIT COURSE */}
          {crudTab === "edit" && (
            <Card className="border-[#D8E2DC] max-w-2xl mx-auto shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#1F2922] flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#2D5A27]" /> Edit Degree Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1F2922]">Select Course to Edit:</Label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleSelectCourseToEdit(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#D8E2DC] rounded-md text-sm text-[#1F2922]"
                  >
                    <option value="">-- Choose course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourseId && (
                  <form onSubmit={handleEditCourse} className="space-y-4 pt-2 border-t border-[#D8E2DC]">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">Course Code</Label>
                      <Input
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">Full Degree Title</Label>
                      <Input
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1F2922]">Department</Label>
                      <Input
                        value={courseForm.department}
                        onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-[#D8E2DC]">
                      <Button type="button" variant="outline" onClick={() => setCrudTab("view")}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#2D5A27] hover:bg-[#23471E] text-white">
                        Update Course
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. DELETE COURSE */}
          {crudTab === "delete" && (
            <Card className="border-[#D8E2DC] max-w-4xl mx-auto shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-rose-700 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-rose-600" /> Delete Degree Programs
                </CardTitle>
                <CardDescription className="text-xs text-[#5B6E61]">
                  Removing a program removes it from future enrollment dropdown choices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#D8E2DC] border border-[#D8E2DC] rounded-md">
                  {courses.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-rose-50/40"
                    >
                      <div>
                        <span className="font-bold text-sm text-[#2D5A27]">{c.code}</span> —{" "}
                        <span className="text-sm font-medium text-[#1F2922]">{c.name}</span>
                        <p className="text-xs text-gray-500">{c.department}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCourse(c.id, c.code)}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}