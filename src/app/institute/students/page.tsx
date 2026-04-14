"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Search, Mail, Phone, BookOpen, MoreHorizontal, Loader2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { instituteService } from "@/lib/institute-service"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type EnrolledCourse = {
    courseId: string
    courseTitle: string
    enrollmentId: string
    status: string
    enrolledAt: string
    trainerName: string
}

type Student = {
    id: string
    name: string
    email: string
    phone: string | null
    avatar: string | null
    enrolledCourses: EnrolledCourse[]
    totalCourses: number
    lastActivity: string
    status: string
}

type StudentsData = {
    students: Student[]
    totalStudents: number
    totalEnrollments: number
    totalEarnings: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const statusBadge: Record<string, { label: string; className: string }> = {
    active: { label: "مستمر", className: "bg-green-100 text-green-700 hover:bg-green-200 border-transparent shadow-none" },
    completed: { label: "مكتمل", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent shadow-none" },
    cancelled: { label: "ملغى", className: "bg-red-100 text-red-700 hover:bg-red-200 border-transparent shadow-none" },
    preliminary: { label: "مبدئي", className: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-transparent shadow-none" },
    pending_payment: { label: "بانتظار الدفع", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent shadow-none" },
    reject_payment: { label: "دفع مرفوض", className: "bg-red-100 text-red-700 hover:bg-red-200 border-transparent shadow-none" },
}

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function InstituteStudentsPage() {
    const [data, setData] = useState<StudentsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [courseFilter, setCourseFilter] = useState("all")
    const [sortBy, setSortBy] = useState("name")

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
    const [announcementTarget, setAnnouncementTarget] = useState<Student | null>(null)
    const [announcementTitle, setAnnouncementTitle] = useState("")
    const [announcementMessage, setAnnouncementMessage] = useState("")
    const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false)

    const loadData = async () => {
        try {
            const result = await instituteService.getStudents()
            setData(result)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "فشل في تحميل بيانات الطلاب")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const courses = useMemo(() => {
        if (!data) return []
        const seen = new Set<string>()
        const list: { id: string; title: string }[] = []
        for (const s of data.students) {
            for (const ec of s.enrolledCourses) {
                if (!seen.has(ec.courseId)) {
                    seen.add(ec.courseId)
                    list.push({ id: ec.courseId, title: ec.courseTitle })
                }
            }
        }
        return list
    }, [data])

    const filteredStudents = useMemo(() => {
        if (!data) return []
        return data.students.filter(s => {
            const q = searchQuery.toLowerCase()
            const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
            const matchesCourse = courseFilter === "all" ||
                s.enrolledCourses.some(ec => ec.courseId === courseFilter)
            return matchesSearch && matchesCourse
        })
    }, [data, searchQuery, courseFilter])

    const sortedStudents = useMemo(() => {
        return [...filteredStudents].sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name, "ar")
            if (sortBy === "courses") return b.totalCourses - a.totalCourses
            if (sortBy === "lastActivity")
                return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
            return 0
        })
    }, [filteredStudents, sortBy])

    const handleViewDetails = (student: Student) => {
        setSelectedStudent(student)
        setIsDetailsOpen(true)
    }

    const handleOpenAnnouncement = (student?: Student) => {
        setAnnouncementTarget(student || null)
        setAnnouncementTitle("")
        setAnnouncementMessage("")
        setIsAnnouncementOpen(true)
    }

    const handleSendAnnouncement = async () => {
        if (!announcementTitle.trim() || !announcementMessage.trim()) {
            toast.error("يرجى إدخال عنوان ومحتوى الإعلان")
            return
        }

        try {
            setIsSendingAnnouncement(true)
            await instituteService.sendStudentAnnouncement({
                title: announcementTitle,
                message: announcementMessage,
                recipientId: announcementTarget ? announcementTarget.id : undefined
            })
            toast.success("تم إرسال الإعلان بنجاح")
            setIsAnnouncementOpen(false)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "فشل إرسال الإعلان")
        } finally {
            setIsSendingAnnouncement(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الطلاب</h1>
                    <p className="text-gray-600">متابعة وإدارة الطلاب المسجلين في دورات المعهد</p>
                </div>
                <Button onClick={() => handleOpenAnnouncement()} className="flex items-center gap-2 bg-primary text-white">
                    <Mail className="h-4 w-4" />
                    إرسال إعلان للجميع
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-indigo-600" />
                            <div className="mr-4">
                                <p className="text-sm font-medium text-gray-600 tracking-tight">إجمالي التسجيلات</p>
                                <p className="text-2xl font-bold">{data?.totalEnrollments ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="mr-4">
                                <p className="text-sm font-medium text-gray-600 tracking-tight">إجمالي الطلاب</p>
                                <p className="text-2xl font-bold">{data?.totalStudents ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 border-r-4 border-emerald-500">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                <span className="text-emerald-600 font-bold text-xl">$</span>
                            </div>
                            <div className="mr-4 text-right">
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-tight">إجمالي الأرباح</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-2xl font-bold text-emerald-700">{(data?.totalEarnings ?? 0).toLocaleString()}</p>
                                    <span className="text-xs font-medium text-emerald-600/70">ر.ي</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
                <div className="relative flex-1 min-w-[260px] max-w-[520px]">
                    <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="البحث بالاسم أو البريد..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-11 rounded-full bg-white pr-10 pl-4 text-sm"
                    />
                </div>

                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="تصفية حسب الدورة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الدورات</SelectItem>
                        {courses.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">الاسم</SelectItem>
                        <SelectItem value="courses">عدد الدورات</SelectItem>
                        <SelectItem value="lastActivity">آخر نشاط</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>الطلاب ({sortedStudents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {sortedStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {data?.totalStudents === 0 ? "لا يوجد طلاب مسجلون حتى الآن" : "لا يوجد طلاب مطابقون للبحث"}
                            </h3>
                            <p className="text-gray-500">
                                {data?.totalStudents === 0
                                    ? "سيظهر الطلاب هنا بمجرد تسجيلهم في إحدى دورات المعهد"
                                    : "جرّب تغيير معايير البحث أو التصفية"}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الطالب</TableHead>
                                    <TableHead className="text-right">الدورات والمدربون</TableHead>
                                    <TableHead className="text-right">آخر نشاط</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={student.avatar ? `${API_URL}${student.avatar}` : undefined}
                                                        alt={student.name}
                                                    />
                                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{student.name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {student.email}
                                                    </div>
                                                    {student.phone && (
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {student.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="space-y-2">
                                                {student.enrolledCourses.slice(0, 2).map(ec => {
                                                    const s = statusBadge[ec.status.toLowerCase()] ?? { label: ec.status, className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent shadow-none" }
                                                    return (
                                                        <div key={ec.enrollmentId} className="text-sm border-r-2 border-slate-100 pr-2">
                                                            <div className="font-medium line-clamp-1">{ec.courseTitle}</div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="outline" className={`text-[10px] py-0 px-2 ${s.className}`}>{s.label}</Badge>
                                                                <span className="text-[11px] text-slate-400">المدرب: {ec.trainerName || "—"}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {student.enrolledCourses.length > 2 && (
                                                    <div className="text-xs text-gray-400 pr-2">
                                                        +{student.enrolledCourses.length - 2} دورات أخرى
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(student.lastActivity).toLocaleDateString("ar-SA", {
                                                year: "numeric", month: "short", day: "numeric"
                                            })}
                                        </TableCell>

                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        عرض التفاصيل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenAnnouncement(student)} className="gap-2 cursor-pointer">
                                                        <Mail className="h-4 w-4" />
                                                        إرسال إعلان
                                                    </DropdownMenuItem>

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[550px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الطالب</DialogTitle>
                        <DialogDescription>معلومات شاملة حول تسجيلات الطالب ونشاطه</DialogDescription>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="space-y-6 py-4">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={selectedStudent.avatar ? `${API_URL}${selectedStudent.avatar}` : undefined} />
                                    <AvatarFallback className="text-xl">{getInitials(selectedStudent.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                            <Mail className="h-3 w-3" /> {selectedStudent.email}
                                        </span>
                                        {selectedStudent.phone && (
                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                                <Phone className="h-3 w-3" /> {selectedStudent.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" /> الدورات المسجلة ({selectedStudent.enrolledCourses.length})
                                </h4>
                                <div className="grid gap-3">
                                    {selectedStudent.enrolledCourses.map(ec => {
                                        const s = statusBadge[ec.status.toLowerCase()] ?? { label: ec.status, className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent shadow-none" }
                                        return (
                                            <div key={ec.enrollmentId} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium text-sm">{ec.courseTitle}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">المدرب: {ec.trainerName || "—"}</div>
                                                </div>
                                                <Badge variant="outline" className={`px-3 py-1 ${s.className}`}>{s.label}</Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Announcement Dialog */}
            <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إرسال إعلان {announcementTarget ? "مخصص" : "للجميع"}</DialogTitle>
                        <DialogDescription>
                            {announcementTarget 
                                ? `أنت تقوم بإرسال رسالة خاصة إلى الطالب: ${announcementTarget.name}`
                                : "سيتم إرسال هذا الإعلان إلى جميع الطلاب المسجلين ضمن دوراتك."
                            }
                            <br />
                            ستصلهم هذه الرسالة أيضاً كبريد إلكتروني.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">عنوان الإعلان</label>
                            <Input 
                                placeholder="مثال: تغيير موعد الجلسة، تنبيه هام..." 
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">نص الرسالة</label>
                            <textarea 
                                className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="اكتب رسالتك وتفاصيلها هنا..."
                                value={announcementMessage}
                                onChange={(e) => setAnnouncementMessage(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsAnnouncementOpen(false)} disabled={isSendingAnnouncement}>
                            إلغاء
                        </Button>
                        <Button onClick={handleSendAnnouncement} disabled={isSendingAnnouncement}>
                            {isSendingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Mail className="h-4 w-4 ml-2" />}
                            إرسال الإعلان
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
