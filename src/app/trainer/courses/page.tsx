"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Plus, Search, Users, Calendar, Edit, MoreVertical, DollarSign, UploadCloud, FileText, ChevronDown, X, Loader2, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate, getFileUrl } from "@/lib/utils"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { trainerService } from "@/lib/trainer-service"
import { Label } from "@/components/ui/label"

const bankAccounts = [
  {
    id: "inma",
    bankName: "بنك الإنماء",
    iban: "SA56 0500 0012 3456 7890 1234",
    beneficiary: "معهد التدريب المتقدم"
  }
]

export default function TrainerCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const data = await trainerService.getCourses()
        setCourses(data)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "فشل في تحميل الدورات")
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null)

  const normalizeText = (value: string) => {
    if (!value) return value
    if (!/[ØÙ]/.test(value)) return value
    try {
      return decodeURIComponent(escape(value))
    } catch {
      return value
    }
  }

  // Filter and sort courses
  const filteredCourses = courses.filter(course => {
    const normalizedTitle = normalizeText(course.title ?? '')
    const matchesSearch = normalizedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.shortDescription ?? course.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "title": return (a.title ?? '').localeCompare(b.title ?? '')
      case "students": return (b.enrolledStudents ?? 0) - (a.enrolledStudents ?? 0)
      case "price-low": return a.price - b.price
      case "price-high": return b.price - a.price
      default: return new Date(b.createdAt ?? b.startDate).getTime() - new Date(a.createdAt ?? a.startDate).getTime()
    }
  })

  const getStatusBadge = (course: any) => {
    const status = course.status?.toLowerCase()
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مستمر</Badge>
      case 'draft':
        return <Badge variant="secondary">مسودة</Badge>
      case 'pending':
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">بانتظار الموافقة</Badge>
      case 'pending_review':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">بانتظار الموافقة على الدفع</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">مكتمل</Badge>
      case 'rejected':
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">مرفوض</Badge>
            {course.rejectionReason && (
              <span className="text-[10px] text-red-600 max-w-[150px] line-clamp-1" title={course.rejectionReason}>
                السبب: {course.rejectionReason}
              </span>
            )}
          </div>
        )
      case 'payment_required':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">بانتظار سداد الرسوم</Badge>
      case 'processing_payment':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">جارٍ التحقق من الدفع</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">مكتمل</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptInfo, setReceiptInfo] = useState<{ name: string; note: string }>({
    name: "",
    note: ""
  })
  const [paymentError, setPaymentError] = useState("")
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [expandedBankId, setExpandedBankId] = useState<string | null>(bankAccounts[0]?.id ?? null)
  const paymentFileRef = useRef<HTMLInputElement | null>(null)

  const handlePaymentClick = (course: any) => {
    setSelectedCourse(course)
    setPaymentModalOpen(true)
  }

  const handlePaymentSubmit = () => {
    if (!receiptFile && !receiptInfo.name) {
      setPaymentError("يرجى رفع سند الدفع قبل التأكيد.")
      return
    }
    setPaymentError("")
    setPaymentModalOpen(false)
    toast.success("تم رفع السند بنجاح وبانتظار المراجعة")
  }

  const handleDeleteCourse = async () => {
    if (courseToDelete) {
      try {
        await trainerService.deleteCourse(courseToDelete.id)
        setCourses(courses.filter(c => c.id !== courseToDelete.id))
        toast.success("تم حذف الدورة بنجاح")
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "فشل في حذف الدورة")
      }
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  const formatYER = (value: number) =>
    `${new Intl.NumberFormat("en-US").format(value)} ر.ي`

  const formatFileSize = (size?: number) => {
    if (!size || Number.isNaN(size)) return ""
    if (size < 1024) return `${size} B`
    const kb = size / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const handleReceiptFile = (file: File | null) => {
    setReceiptFile(file)
    if (file) {
      setReceiptInfo((prev) => ({ ...prev, name: file.name }))
    }
    setPaymentError("")
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent
          dir="rtl"
          className="max-w-3xl [&>button[data-dialog-close='default']]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4"
        >
          <DialogClose className="absolute left-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30">
            <X className="h-4 w-4" />
            <span className="sr-only">إغلاق</span>
          </DialogClose>
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="text-right">إتمام عملية دفع رسوم القاعة</DialogTitle>
            <DialogDescription className="text-right">
              {selectedCourse ? `${selectedCourse.title} - ${formatYER(5000)}` : formatYER(5000)}
              <br />
              يرجى تحويل المبلغ وإرفاق سند الدفع لإكمال الخطوة.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 pt-4 lg:grid-cols-2">
            <div className="order-2 space-y-4 text-right lg:order-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-slate-900">رفع سند الدفع</h4>
                  <span className="text-xs text-slate-500">صور أو PDF</span>
                </div>
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDraggingFile(true)
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDraggingFile(false)
                    const file = event.dataTransfer.files?.[0] ?? null
                    handleReceiptFile(file)
                  }}
                  onClick={() => paymentFileRef.current?.click()}
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-5 text-sm transition ${isDraggingFile ? "border-blue-500 bg-blue-50/60" : "border-slate-200 bg-slate-50/60"
                    }`}
                >
                  <UploadCloud className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-slate-700">اسحب الملف هنا</span>
                  <span className="text-xs text-slate-500">أو اختر ملفًا من جهازك</span>
                  <Button type="button" size="sm" className="rounded-full">
                    اختيار ملف
                  </Button>
                  <Input
                    ref={paymentFileRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      handleReceiptFile(file)
                    }}
                  />
                </div>
                {(receiptFile?.name || receiptInfo.name) && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {receiptFile?.name ?? receiptInfo.name}
                        </p>
                        {receiptFile && (
                          <p className="text-[11px] text-slate-500">
                            {receiptFile.type || "ملف"} · {formatFileSize(receiptFile.size)}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReceiptFile(null)
                          setReceiptInfo((prev) => ({ ...prev, name: "" }))
                        }}
                        className="h-7 rounded-full px-3 text-xs"
                      >
                        إزالة الملف
                      </Button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => paymentFileRef.current?.click()}
                        className="h-7 rounded-full px-3 text-xs"
                      >
                        تغيير الملف
                      </Button>
                    </div>
                  </div>
                )}
                {!receiptFile?.name && !receiptInfo.name && (
                  <p className="mt-3 text-xs text-slate-500">
                    ارفع سند الدفع أولاً حتى تتمكن من التأكيد.
                  </p>
                )}
                {paymentError && <p className="mt-2 text-xs text-red-500">{paymentError}</p>}
              </div>
            </div>
            <div className="order-1 space-y-4 text-right lg:order-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-slate-900">الحسابات البنكية</h4>
                  <span className="text-xs text-slate-500">اختر بنكًا لعرض التفاصيل</span>
                </div>
                <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {bankAccounts.map((bank) => {
                    const isOpen = expandedBankId === bank.id
                    return (
                      <div key={bank.id} className="rounded-xl border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBankId((prev) => (prev === bank.id ? null : bank.id))
                          }
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right"
                          aria-expanded={isOpen}
                        >
                          <span className="text-sm font-semibold text-slate-900">
                            {bank.bankName}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""
                              }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="border-t border-slate-200 px-4 py-3 text-right text-sm">
                            <p className="text-xs text-slate-500">
                              اسم المستفيد: {bank.beneficiary}
                            </p>
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-slate-500">رقم IBAN</p>
                              <p className="font-mono text-sm font-semibold text-slate-900">
                                {bank.iban}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(bank.iban)
                                    toast.success("تم نسخ رقم الآيبان")
                                  } catch {
                                    toast.error("تعذر نسخ رقم الآيبان")
                                  }
                                }}
                                className="h-7 rounded-full px-3 text-xs"
                              >
                                نسخ IBAN
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              onClick={handlePaymentSubmit}
              disabled={!receiptFile?.name && !receiptInfo.name}
              className="w-full"
            >
              تأكيد الدفع بإرسال السند
            </Button>
            {!receiptFile?.name && !receiptInfo.name && (
              <p className="mt-2 text-xs text-red-500 text-right">
                ارفع السند أولاً لتفعيل زر التأكيد.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الدورات</h1>
          <p className="text-gray-600">إدارة ومتابعة دوراتك التدريبية</p>
        </div>
        <Button asChild className="rounded-xl px-5 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-105">
          <Link href="/trainer/courses/create">
            <Plus className="ml-2 h-5 w-5" />
            إنشاء دورة جديدة
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-600/10 p-3.5 rounded-2xl">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 mb-0.5">إجمالي الدورات</p>
                <p className="text-3xl font-black text-blue-900">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-green-50/50 rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-600/10 p-3.5 rounded-2xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 mb-0.5">إجمالي الطلاب</p>
                <p className="text-3xl font-black text-green-900">
                  {courses.reduce((acc, course) => acc + (course.enrolledStudents ?? 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="البحث في الدورات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11 rounded-2xl bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 h-11 rounded-2xl bg-white border-slate-200">
              <SelectValue placeholder="حالة الدورة" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">مستمر</SelectItem>
              <SelectItem value="pending_review">بانتظار الموافقة على الدفع</SelectItem>
              <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
              <SelectItem value="payment_required">بانتظار الدفع</SelectItem>
              <SelectItem value="processing_payment">التحقق من الدفع</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 h-11 rounded-2xl bg-white border-slate-200">
              <SelectValue placeholder="الترتيب" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="title">الاسم</SelectItem>
              <SelectItem value="students">عدد الطلاب</SelectItem>
              <SelectItem value="price-low">السعر: من الأقل</SelectItem>
              <SelectItem value="price-high">السعر: من الأعلى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedCourses.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {searchQuery || statusFilter !== "all" ? "لا توجد دورات تطابق البحث" : "لا توجد دورات بعد"}
            </h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">ابدأ رحلتك التدريبية بإنشاء أول دورة لك على المنصة</p>
            <Button asChild className="rounded-2xl px-8 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-bold">
              <Link href="/trainer/courses/create">
                <Plus className="ml-2 h-5 w-5" />
                إنشاء الدورة الأولى
              </Link>
            </Button>
          </div>
        ) : (
          sortedCourses.map((course) => (
            <div
              key={course.id}
              dir="rtl"
              className="group relative w-full h-auto sm:h-[225px] rounded-[2rem] border border-slate-100 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] transition-all hover:shadow-[0_20px_48px_rgba(15,23,42,0.08)] hover:-translate-y-1 flex flex-col sm:flex-row gap-5"
            >
              {/* Image Section */}
              <div className="relative h-[160px] sm:h-full w-full sm:w-[190px] shrink-0 overflow-hidden rounded-[1.5rem] bg-slate-50 flex items-center justify-center">
                {course.image && !imageErrors[course.id] ? (
                  <Image
                    src={getFileUrl(course.image) || ""}
                    alt={course.title || "صورة الدورة"}
                    fill
                    sizes="190px"
                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                    unoptimized={true}
                    onError={() => setImageErrors(prev => ({ ...prev, [course.id]: true }))}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-200">
                    <BookOpen className="h-10 w-10 mb-2 opacity-30" />
                    <span className="text-slate-400 font-black text-2xl tracking-tighter uppercase">{normalizeText(course.title).charAt(0)}</span>
                  </div>
                )}
                {/* Overlay Badge for Price on Image */}
                <div className="absolute bottom-3 right-3 sm:hidden">
                  <Badge className="bg-blue-600 text-white border-0 shadow-lg px-3 py-1 text-sm font-black rounded-xl">
                    {new Intl.NumberFormat('en-US').format(course.price)} ر.ي
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex h-full w-full flex-1 flex-col py-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0 ml-2">
                    {course.category && (
                      <span className="inline-flex items-center rounded-lg bg-blue-600/5 px-2.5 py-1 text-[10px] font-black text-blue-600 mb-2 uppercase tracking-widest">
                        {normalizeText(course.category)}
                      </span>
                    )}
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {normalizeText(course.title)}
                    </h3>
                  </div>

                  <div className="flex items-center shrink-0 gap-1">
                    <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
                      <Link href={`/trainer/courses/${course.id}`}>
                        <Eye className="h-5 w-5" />
                      </Link>
                    </Button>
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-slate-50/50 backdrop-blur-xl">
                        <DropdownMenuItem asChild className="rounded-xl cursor-copy py-2.5">
                          <Link href={`/trainer/courses/${course.id}`}>
                            <Eye className="ml-2 h-4 w-4 text-slate-500" />
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl cursor-copy py-2.5">
                          <Link href={`/trainer/courses/${course.id}/edit`}>
                            <Edit className="ml-2 h-4 w-4 text-blue-500" />
                            تعديل الدورة
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl cursor-copy py-2.5">
                          <Link href={`/trainer/courses/${course.id}/students`}>
                            <Users className="ml-2 h-4 w-4 text-green-500" />
                            إدارة الطلاب
                          </Link>
                        </DropdownMenuItem>
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <DropdownMenuItem
                          className="rounded-xl text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer py-2.5"
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

                <div className="flex flex-wrap gap-2.5 mt-1 mb-4">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100/50 px-3 py-1.5 text-[11px] text-slate-600 font-black">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    الطلاب: {course.enrolledStudents ?? 0}/{course.maxStudents}
                  </div>
                  {course.startDate && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100/50 px-3 py-1.5 text-[11px] text-slate-600 font-black">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(new Date(course.startDate))}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex w-full items-end justify-between border-t border-slate-50 pt-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xl font-black text-blue-600 hidden sm:block">
                      {new Intl.NumberFormat('en-US').format(course.price)} <span className="text-[10px] font-bold text-slate-400 mr-0.5 tracking-tight">ر.ي</span>
                    </span>

                    {/* Action Buttons based on status */}
                    <div className="flex gap-2">
                      {course.status?.toLowerCase() === 'payment_required' && (
                        <Button
                          size="sm"
                          className="h-9 bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-4 text-[11px] font-black shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95"
                          onClick={() => handlePaymentClick(course)}
                        >
                          <DollarSign className="h-3.5 w-3.5 ml-1.5" />
                          تأكيد الدفع
                        </Button>
                      )}
                      {course.status?.toLowerCase() === 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-9 rounded-xl px-4 text-[11px] font-black shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95"
                          asChild
                        >
                          <Link href={`/trainer/courses/${course.id}/edit`}>
                            <UploadCloud className="h-3.5 w-3.5 ml-1.5" />
                            إعادة الإرسال
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getStatusBadge(course)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent dir="rtl" className="max-w-[420px] rounded-[2.5rem] p-8 shadow-2xl border-0">
          <DialogHeader className="text-right">
            <div className="bg-red-50 w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">حذف الدورة نهائياً؟</DialogTitle>
            <DialogDescription className="text-slate-500 text-base mt-2 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف الدورة <span className="text-slate-900 font-bold">&quot;{courseToDelete?.title}&quot;</span>؟ هذا الإجراء سيقوم بحذف جميع البيانات والطلاب المسجلين والجلسات المرتبطة بها ولا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-10">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-2xl h-12 flex-1 font-bold border-slate-200">إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteCourse} className="rounded-2xl h-12 flex-1 font-bold shadow-lg shadow-red-200">حذف نهائي</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
