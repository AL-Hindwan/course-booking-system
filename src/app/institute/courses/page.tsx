"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Eye, Users, MoreVertical, UserCog, Plus, Edit, Trash2, Search, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { getFileUrl } from "@/lib/utils"
import { instituteService } from "@/lib/institute-service"

export default function InstituteCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [trainerFilter, setTrainerFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  // Available trainers from DB
  const [availableTrainers, setAvailableTrainers] = useState<{ id: string; name: string; email: string }[]>([])

  // State for changing trainer
  const [isChangeTrainerOpen, setIsChangeTrainerOpen] = useState(false)
  const [selectedCourseForTrainerChange, setSelectedCourseForTrainerChange] = useState<any | null>(null)
  const [newTrainerId, setNewTrainerId] = useState("")

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await instituteService.getCourses()
      setCourses(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل في جلب الدورات")
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainers = async () => {
    try {
      const data = await instituteService.getTrainers()
      setAvailableTrainers(data)
    } catch {
      // Silently fail for trainers list
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchTrainers()
  }, [])

  const normalizeText = (value: string) => {
    if (!value) return value
    if (!/[ØÙ]/.test(value)) return value
    try {
      return decodeURIComponent(escape(value))
    } catch {
      return value
    }
  }

  const filteredCourses = courses.filter(course => {
    const normalizedTitle = normalizeText(course.title)
    // Support both trainer (single) and trainers (multi)
    const trainerNames = (course.trainers as any[] | undefined)?.map((t: any) => normalizeText(t.name ?? '')).join(' ') 
      || normalizeText(course.trainer?.name ?? '')
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesTrainer = trainerFilter === "all" || trainerNames.includes(trainerFilter)
    const matchesSearch = normalizedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainerNames.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesTrainer && matchesSearch
  })

  const handleDeleteCourse = async () => {
    if (courseToDelete) {
      try {
        await instituteService.deleteCourse(courseToDelete.id)
        setCourses(courses.filter(c => c.id !== courseToDelete.id))
        toast.success("تم حذف الدورة بنجاح")
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "فشل في حذف الدورة")
      }
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  const openChangeTrainerDialog = (course: any) => {
    setSelectedCourseForTrainerChange(course)
    setNewTrainerId(course.trainerId)
    setIsChangeTrainerOpen(true)
  }

  const handleChangeTrainer = async () => {
    if (selectedCourseForTrainerChange && newTrainerId) {
      try {
        await instituteService.changeTrainer(selectedCourseForTrainerChange.id, newTrainerId)
        const selectedTrainer = availableTrainers.find(t => t.id === newTrainerId)
        if (selectedTrainer) {
          setCourses(courses.map(course =>
            course.id === selectedCourseForTrainerChange.id
              ? {
                ...course,
                trainerId: newTrainerId,
                trainer: { ...course.trainer, id: newTrainerId, name: selectedTrainer.name }
              }
              : course
          ))
        }
        toast.success("تم تغيير المدرب بنجاح")
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "فشل في تغيير المدرب")
      }
      setIsChangeTrainerOpen(false)
      setSelectedCourseForTrainerChange(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مستمر</Badge>
      case 'completed':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">مكتمل</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">مسودة</Badge>
      case 'pending_review':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">بانتظار الموافقة على الدفع</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ملغي</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">مرفوض</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Collect unique trainer names from trainers[] or trainer
  const uniqueTrainers = Array.from(new Set(
    courses.flatMap(course => 
      (course as any).trainers?.length > 0
        ? (course as any).trainers.map((t: any) => normalizeText(t.name ?? ''))
        : [normalizeText(course.trainer?.name ?? '')]
    ).filter(Boolean)
  ))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الدورات...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Button onClick={fetchCourses}>إعادة المحاولة</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الدورات</h1>
          <p className="text-gray-600 mt-2">مراجعة وإدارة دورات المعهد</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/institute/courses/create">
            <Plus className="h-4 w-4" />
            إنشاء دورة جديدة
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في الدورات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="حالة الدورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">مستمر</SelectItem>
              <SelectItem value="pending_review">بانتظار الموافقة على الدفع</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
            </SelectContent>
          </Select>
          <Select value={trainerFilter} onValueChange={setTrainerFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="المدرب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدربين</SelectItem>
              {uniqueTrainers.map(trainer => (
                <SelectItem key={trainer} value={trainer as string}>{trainer as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            لا توجد دورات مطابقة لخيارات البحث الحالية.
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              dir="rtl"
              className="w-full h-auto sm:h-[220px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] text-right flex flex-col sm:flex-row items-start gap-5 transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
            >
              <div className="relative h-[160px] sm:h-[185px] w-full sm:w-[185px] shrink-0 overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center">
                {course.image && !imageErrors[course.id] ? (
                  <Image
                    src={getFileUrl(course.image) || ""}
                    alt={course.title}
                    fill
                    sizes="185px"
                    className="h-full w-full object-cover"
                    unoptimized={true}
                    onError={() => setImageErrors(prev => ({ ...prev, [course.id]: true }))}
                  />
                ) : (
                  <span className="text-slate-400 font-bold text-2xl text-center px-2">{normalizeText(course.title).charAt(0)}</span>
                )}
              </div>

              <div className="flex h-full w-full flex-1 flex-col text-right">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pl-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 mb-2">
                      {normalizeText(course.category)}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                      {normalizeText(course.title)}
                    </h3>
                  </div>

                  {/* Dropdown Menu actions */}
                  <div className="flex items-center shrink-0">
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link href={`/institute/courses/${course.id}/students`} className="flex items-center cursor-pointer w-full">
                            <Users className="ml-2 h-4 w-4" />
                            إدارة الطلاب
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/institute/courses/${course.id}`} className="flex items-center cursor-pointer w-full">
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/institute/courses/${course.id}/edit`} className="flex items-center cursor-pointer w-full">
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل الدورة
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openChangeTrainerDialog(course)}>
                          <UserCog className="ml-2 h-4 w-4" />
                          تغيير المدرب
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => {
                            setCourseToDelete(course)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف الدورة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  {(course as any).trainers?.length > 1 ? (
                    <>
                      <span className="font-medium text-slate-600">المدربون: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(course as any).trainers.map((t: any) => (
                          <span key={t.id} className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {normalizeText(t.name)}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>المدرب: <span className="font-medium text-slate-700">{normalizeText((course as any).trainers?.[0]?.name ?? course.trainer?.name ?? "-")}</span></>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-start gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    السعة: <span className="font-medium text-slate-900">{course.enrolledStudents}/{course.maxStudents}</span>
                  </span>
                </div>

                <div className="mt-auto flex w-full items-center justify-between pt-4">
                  <span className="inline-flex h-9 items-center rounded-full bg-blue-50 px-3.5 text-sm font-bold text-blue-700">
                    {new Intl.NumberFormat('en-US').format(course.price)} ر.ي
                  </span>
                  <div>
                    {getStatusBadge(course.status)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isChangeTrainerOpen} onOpenChange={setIsChangeTrainerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير مدرب الدورة</DialogTitle>
            <DialogDescription>
              اختر المدرب الجديد للدورة &quot;{selectedCourseForTrainerChange?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="trainer-select" className="mb-2 block">اختر المدرب</Label>
            <Select value={newTrainerId} onValueChange={setNewTrainerId}>
              <SelectTrigger id="trainer-select">
                <SelectValue placeholder="اختر مدربًا" />
              </SelectTrigger>
              <SelectContent>
                {availableTrainers.map(trainer => (
                  <SelectItem key={trainer.id} value={trainer.id}>{trainer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeTrainerOpen(false)}>إلغاء</Button>
            <Button onClick={handleChangeTrainer}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف الدورة &quot;{courseToDelete?.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteCourse}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
