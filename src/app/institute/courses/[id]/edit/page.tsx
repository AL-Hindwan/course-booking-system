"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { instituteService } from "@/lib/institute-service"
import { HallImage } from "@/components/halls/HallImage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowRight, Save, Send, X, Plus, ImageIcon, MapPin, Users, Building, Globe, Calendar, CheckCircle, Banknote, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getFileUrl } from "@/lib/utils"
import Image from "next/image"

const platforms = [
    { value: "zoom", label: "Zoom" },
    { value: "teams", label: "Microsoft Teams" },
    { value: "meet", label: "Google Meet" },
    { value: "webex", label: "Webex" },
    { value: "other", label: "أخرى" }
]

const timeSlots = [
    "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
    "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
    "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00"
]
const weekDaysShort = ["أحد", "اثن", "ثلا", "أرب", "خم", "جم", "سبت"]

export default function EditCoursePage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState("info")
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [trainers, setTrainers] = useState<{ id: string, name: string }[]>([])

    const [courseData, setCourseData] = useState({
        title: "",
        categoryId: "",
        shortDescription: "",
        description: "",
        price: "",
        duration: "",
        minStudents: "",
        maxStudents: "",
        startDate: "",
        endDate: "",
        trainerId: "",
        status: "",
        image: "",
        deliveryType: "",
        objectives: [] as string[],
        prerequisites: [] as string[],
        tags: [] as string[]
    })

    // Helper inputs
    const [currentObjective, setCurrentObjective] = useState("")
    const [currentPrerequisite, setCurrentPrerequisite] = useState("")
    const [currentTag, setCurrentTag] = useState("")

    // Image Upload
    const [isImageDragging, setIsImageDragging] = useState(false)
    const [imagePreviewUrl, setImagePreviewUrl] = useState("")
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ---- Schedule State (Tab 2 - only for DRAFT) ----
    const [halls, setHalls] = useState<any[]>([])
    const [selectedHallId, setSelectedHallId] = useState("")
    const [isHallDialogOpen, setIsHallDialogOpen] = useState(false)
    const [selectedSessions, setSelectedSessions] = useState<{ date: string, slot: string }[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [calendarOffset, setCalendarOffset] = useState(0)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isSlotsLoading, setIsSlotsLoading] = useState(false)
    const [unavailableMessage, setUnavailableMessage] = useState("")



    type OnlineSession = { date: string; startTime: string; duration: string; topic: string }
    const [onlineSchedule, setOnlineSchedule] = useState({ platform: "", meetingLink: "" })
    const [onlineSessions, setOnlineSessions] = useState<OnlineSession[]>([
        { date: "", startTime: "", duration: "60", topic: "" }
    ])
    const addOnlineSession = () => setOnlineSessions(prev => [...prev, { date: "", startTime: "", duration: "60", topic: "" }])
    const removeOnlineSession = (idx: number) => setOnlineSessions(prev => prev.filter((_, i) => i !== idx))
    const updateOnlineSession = (idx: number, field: keyof OnlineSession, value: string) =>
        setOnlineSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))

    // Calendar helpers
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const maxMonthsAhead = 5
    const monthDate = new Date(todayStart.getFullYear(), todayStart.getMonth() + calendarOffset, 1)
    const calYear = monthDate.getFullYear()
    const calMonth = monthDate.getMonth()
    const monthLabel = monthDate.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const calendarDays: Array<{ day: number; dateKey: string; isPast: boolean } | null> = []
    for (let i = 0; i < firstDay; i++) calendarDays.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        calendarDays.push({ day, dateKey, isPast: new Date(calYear, calMonth, day) < todayStart })
    }
    while (calendarDays.length % 7 !== 0) calendarDays.push(null)

    const formatDateLabel = (dateKey: string) => { const [y, m, d] = dateKey.split("-"); return `${d}-${m}-${y}` }

    const mappedHalls = halls.map(h => ({
        id: h.id, name: h.name,
        type: h.type || "قاعة تدريب",
        location: h.location || "مقر المعهد",
        capacity: h.capacity,
        hourlyRate: Number(h.pricePerHour),
        image: h.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
        features: h.facilities?.length > 0 ? h.facilities : ["مجهزة بالكامل"],
        description: h.description || h.facilities?.join(' • ') || '',
        owner: h.institute?.name || "المعهد"
    }))
    const selectedHall = mappedHalls.find(h => h.id === selectedHallId)
    const totalPrice = selectedHall ? selectedHall.hourlyRate * selectedSessions.length : 0

    useEffect(() => { setSelectedDate(null); setSelectedSessions([]); setAvailableSlots([]); setCalendarOffset(0) }, [selectedHallId])

    const handleSelectDay = async (dateKey: string) => {
        setSelectedDate(dateKey); setUnavailableMessage(""); setAvailableSlots([])
        if (!selectedHallId) return
        setIsSlotsLoading(true)
        try {
            const data = await instituteService.getHallAvailability(selectedHallId, dateKey)
            const dateObj = new Date(dateKey)
            const dayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][dateObj.getDay()]
            const allowedPeriods = data.availability?.filter((a: any) => a.day === dayName) || []
            const hasAvailability = data.availability?.length > 0
            const booked = data.bookedSessions || []
            const open = timeSlots.filter(slot => {
                const [s, e] = slot.split(" - ")
                if (hasAvailability && !allowedPeriods.some((p: any) => s >= p.startTime.substring(0, 5) && e <= p.endTime.substring(0, 5))) return false
                const slotStart = new Date(`${dateKey}T${s}:00`)
                const slotEnd = new Date(`${dateKey}T${e}:00`)
                return !booked.some((b: any) => slotStart < new Date(b.endTime) && slotEnd > new Date(b.startTime))
            })
            setAvailableSlots(open)
            if (!open.length) setUnavailableMessage("لا يوجد أوقات متاحة في هذا اليوم أو القاعة مغلقة")
        } catch { toast.error("فشل جلب أوقات القاعة المتاحة") }
        finally { setIsSlotsLoading(false) }
    }

    const toggleSlot = (date: string, slot: string) => {
        const exists = selectedSessions.some(s => s.date === date && s.slot === slot)
        setSelectedSessions(prev => exists ? prev.filter(s => !(s.date === date && s.slot === slot)) : [...prev, { date, slot }])
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [course, cats, trns, hls] = await Promise.all([
                    instituteService.getCourseById(params.id as string),
                    instituteService.getCategories(),
                    instituteService.getTrainers(),
                    instituteService.getHalls()
                ])
                setCategories(cats)
                setTrainers(trns)
                setHalls(hls)
                setCourseData({
                    title: course.title,
                    categoryId: course.categoryId || "",
                    shortDescription: course.shortDescription || "",
                    description: course.description || "",
                    price: course.price.toString(),
                    duration: course.duration.toString(),
                    minStudents: course.minStudents.toString(),
                    maxStudents: course.maxStudents.toString(),
                    startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : "",
                    endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : "",
                    trainerId: course.trainer?.id || "",
                    status: course.status,
                    image: course.image || "",
                    deliveryType: course.deliveryType || "",
                    objectives: course.objectives || [],
                    prerequisites: course.prerequisites || [],
                    tags: course.tags || []
                })
                if (course.image) setImagePreviewUrl(getFileUrl(course.image) || "")
            } catch (err: any) {
                toast.error("فشل في تحميل بيانات الدورة")
                console.error(err)
            } finally { setLoading(false) }
        }
        if (params.id) fetchData()
    }, [params.id])

    const handleFile = (file?: File | null) => {
        if (!file) return
        if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة صحيح"); return }
        setImagePreviewUrl(URL.createObjectURL(file))
        setSelectedImageFile(file)
    }

    const handleSubmit = async (publishStatus?: 'DRAFT' | 'ACTIVE') => {
        try {
            setSubmitting(true)
            const formData = new FormData()
            Object.entries(courseData).forEach(([key, value]) => {
                if (key === 'objectives' || key === 'tags' || key === 'prerequisites') {
                    formData.append(key, JSON.stringify(value))
                } else if (key !== 'image') {
                    formData.append(key, String(value))
                }
            })
            if (publishStatus) formData.set('status', publishStatus)
            if (selectedImageFile) formData.append('image', selectedImageFile)

            // If publishing, validate and include sessions
            if (publishStatus === 'ACTIVE') {
                if (!courseData.deliveryType) throw new Error("يجب اختيار طريقة التقديم")
                let startDate: string, endDate: string
                let sessionsPayload: any[] = []

                if (courseData.deliveryType === 'in_person') {
                    if (!selectedHallId) throw new Error("يجب اختيار القاعة")
                    if (selectedSessions.length === 0) throw new Error("يجب اختيار جلسة واحدة على الأقل")
                    const sorted = [...selectedSessions].sort((a, b) => a.date.localeCompare(b.date))
                    startDate = sorted[0].date; endDate = sorted[sorted.length - 1].date
                    sessionsPayload = selectedSessions.map(s => ({
                        date: s.date, startTime: s.slot.split(" - ")[0], endTime: s.slot.split(" - ")[1],
                        location: selectedHall?.name || "القاعة", topic: "جلسة حضورية"
                    }))
                    formData.set('hallId', selectedHallId)
                    formData.set('duration', selectedSessions.length.toString())

                } else if (courseData.deliveryType === 'online') {
                    const valid = onlineSessions.filter(s => s.date && s.startTime)
                    if (!valid.length) throw new Error("يجب إضافة جلسة أونلاين واحدة على الأقل مع التاريخ والوقت")
                    const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date))
                    startDate = sorted[0].date; endDate = sorted[sorted.length - 1].date
                    sessionsPayload = valid.map(s => {
                        const start = new Date(`${s.date}T${s.startTime}`)
                        const end = new Date(start.getTime() + Number(s.duration || 60) * 60000)
                        return { date: s.date, startTime: s.startTime, endTime: end.toTimeString().substring(0, 5), location: onlineSchedule.platform || 'Online', meetingLink: onlineSchedule.meetingLink || undefined, topic: s.topic || 'جلسة أونلاين' }
                    })
                    formData.set('duration', (valid.reduce((sum, s) => sum + Number(s.duration || 60), 0) / 60).toString())
                } else {
                    startDate = courseData.startDate || new Date().toISOString().split('T')[0]
                    endDate = courseData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }

                formData.set('startDate', startDate)
                formData.set('endDate', endDate)
                formData.append('sessions', JSON.stringify(sessionsPayload))
            }

            await instituteService.updateCourse(params.id as string, formData)
            toast.success(publishStatus === 'ACTIVE' ? "تم نشر الدورة بنجاح" : "تم تحديث الدورة بنجاح")
            router.push(`/institute/courses/${params.id}`)
        } catch (err: any) {
            toast.error(err?.message || err?.response?.data?.message || "فشل في تحديث الدورة")
        } finally { setSubmitting(false) }
    }

    const addObjective = () => { if (currentObjective.trim()) { setCourseData(p => ({ ...p, objectives: [...p.objectives, currentObjective.trim()] })); setCurrentObjective("") } }
    const removeObjective = (i: number) => setCourseData(p => ({ ...p, objectives: p.objectives.filter((_, idx) => idx !== i) }))
    const addPrerequisite = () => { if (currentPrerequisite.trim()) { setCourseData(p => ({ ...p, prerequisites: [...p.prerequisites, currentPrerequisite.trim()] })); setCurrentPrerequisite("") } }
    const removePrerequisite = (i: number) => setCourseData(p => ({ ...p, prerequisites: p.prerequisites.filter((_, idx) => idx !== i) }))
    const addTag = () => { if (currentTag.trim() && !courseData.tags.includes(currentTag.trim())) { setCourseData(p => ({ ...p, tags: [...p.tags, currentTag.trim()] })); setCurrentTag("") } }
    const removeTag = (t: string) => setCourseData(p => ({ ...p, tags: p.tags.filter(tag => tag !== t) }))

    const isDraft = courseData.status === 'DRAFT' || courseData.status === 'draft'

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل البيانات...</span>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto pb-12" dir="rtl">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowRight className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">تعديل الدورة: {courseData.title}</h1>
                    {isDraft && <Badge variant="secondary" className="mt-1">مسودة — أكمل الحجز والمواعيد لنشر الدورة</Badge>}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                <div className="w-full bg-white p-2 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                    <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-50/50">
                        <TabsTrigger value="info" className="data-[state=active]:bg-white h-10">1. بيانات الدورة</TabsTrigger>
                        <TabsTrigger value="schedule" className="data-[state=active]:bg-white h-10" disabled={!isDraft}>
                            {isDraft ? "2. الحجز والمواعيد (لنشر الدورة)" : "2. الحجز والمواعيد"}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ---- Tab 1: Info ---- */}
                <TabsContent value="info" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>المعلومات الأساسية</CardTitle><CardDescription>قم بتعديل المعلومات الرئيسية للدورة</CardDescription></CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">عنوان الدورة</Label>
                                    <Input id="title" value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">الفئة</Label>
                                    <Select value={courseData.categoryId} onValueChange={val => setCourseData({ ...courseData, categoryId: val })}>
                                        <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shortDesc">وصف مختصر</Label>
                                <Textarea id="shortDesc" value={courseData.shortDescription} onChange={e => setCourseData({ ...courseData, shortDescription: e.target.value })} rows={2} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">الوصف التفصيلي</Label>
                                <Textarea id="desc" value={courseData.description} onChange={e => setCourseData({ ...courseData, description: e.target.value })} rows={5} />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">صورة الدورة</Label>
                                <div
                                    className={`relative h-48 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-dashed bg-slate-50/60 transition-colors ${isImageDragging ? "ring-2 ring-blue-500 ring-offset-2 border-blue-300" : "border-slate-200"}`}
                                    onDragOver={e => { e.preventDefault(); setIsImageDragging(true) }}
                                    onDragLeave={() => setIsImageDragging(false)}
                                    onDrop={e => { e.preventDefault(); setIsImageDragging(false); handleFile(e.dataTransfer.files?.[0]) }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={e => { handleFile(e.target.files?.[0]); e.currentTarget.value = "" }} />
                                    {imagePreviewUrl ? (
                                        <>
                                            <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                                            <div className="absolute inset-x-3 bottom-3 flex items-center justify-end gap-2">
                                                <Button type="button" size="sm" variant="secondary" className="h-8 bg-white/95 hover:bg-white" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>تغيير</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer">
                                            <ImageIcon className="h-8 w-8 text-slate-400" />
                                            <p className="text-sm font-medium text-slate-700">اسحب الصورة أو اضغط للرفع</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>المواعيد والتسعير</CardTitle></CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">السعر (ر.ي)</Label>
                                    <Input id="price" type="number" value={courseData.price} onChange={e => setCourseData({ ...courseData, price: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">المدة (ساعة)</Label>
                                    <Input id="duration" type="number" value={courseData.duration} onChange={e => setCourseData({ ...courseData, duration: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trainer">المدرب</Label>
                                    <Select value={courseData.trainerId} onValueChange={val => setCourseData({ ...courseData, trainerId: val })}>
                                        <SelectTrigger><SelectValue placeholder="اختر المدرب" /></SelectTrigger>
                                        <SelectContent>{trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minStudents">الحد الأدنى للطلاب</Label>
                                    <Input id="minStudents" type="number" value={courseData.minStudents} onChange={e => setCourseData({ ...courseData, minStudents: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxStudents">الحد الأقصى للطلاب</Label>
                                    <Input id="maxStudents" type="number" value={courseData.maxStudents} onChange={e => setCourseData({ ...courseData, maxStudents: e.target.value })} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base">أهداف الدورة</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2"><Input placeholder="أضف هدف..." value={currentObjective} onChange={e => setCurrentObjective(e.target.value)} className="h-8 text-sm" /><Button type="button" size="sm" onClick={addObjective}><Plus className="h-4 w-4" /></Button></div>
                                <div className="space-y-2">{courseData.objectives.map((o, i) => (<div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"><span>{o}</span><Button type="button" variant="ghost" size="sm" onClick={() => removeObjective(i)} className="h-6 w-6 p-0 text-red-500"><X className="h-3 w-3" /></Button></div>))}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-base">المتطلبات السابقة</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2"><Input placeholder="أضف متطلب..." value={currentPrerequisite} onChange={e => setCurrentPrerequisite(e.target.value)} className="h-8 text-sm" /><Button type="button" size="sm" onClick={addPrerequisite}><Plus className="h-4 w-4" /></Button></div>
                                <div className="space-y-2">{courseData.prerequisites.map((p, i) => (<div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"><span>{p}</span><Button type="button" variant="ghost" size="sm" onClick={() => removePrerequisite(i)} className="h-6 w-6 p-0 text-red-500"><X className="h-3 w-3" /></Button></div>))}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-base">الكلمات المفتاحية</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2"><Input placeholder="أضف كلمة..." value={currentTag} onChange={e => setCurrentTag(e.target.value)} className="h-8 text-sm" /><Button type="button" size="sm" onClick={addTag}><Plus className="h-4 w-4" /></Button></div>
                                <div className="flex flex-wrap gap-2">{courseData.tags.map(t => (<Badge key={t} variant="secondary">{t} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(t)} /></Badge>))}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t">
                        <Button variant="outline" type="button" onClick={() => router.back()}>إلغاء</Button>
                        <div className="flex gap-2">
                            {isDraft && (
                                <Button variant="outline" onClick={() => setActiveTab("schedule")}>
                                    الحجز والمواعيد ←
                                </Button>
                            )}
                            <Button onClick={() => handleSubmit()} disabled={submitting}>
                                {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                حفظ التغييرات
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* ---- Tab 2: Schedule (DRAFT only) ---- */}
                <TabsContent value="schedule" className="space-y-6">
                    {!isDraft ? (
                        <Card><CardContent className="py-12 text-center text-gray-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                            <p>لا يمكن تعديل الحجز والمواعيد إلا للدورات في حالة المسودة.</p>
                        </CardContent></Card>
                    ) : (
                        <>
                            {/* Delivery Type */}
                            <Card>
                                <CardHeader><CardTitle>طريقة التقديم</CardTitle></CardHeader>
                                <CardContent>
                                    <RadioGroup value={courseData.deliveryType} onValueChange={v => setCourseData({ ...courseData, deliveryType: v })} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <label className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${courseData.deliveryType === 'online' ? 'border-blue-600 bg-blue-50' : ''}`}>
                                            <RadioGroupItem value="online" className="sr-only" />
                                            <Globe className="h-6 w-6 text-blue-600" /><span className="font-bold">أونلاين</span>
                                        </label>
                                        <label className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${courseData.deliveryType === 'in_person' ? 'border-green-600 bg-green-50' : ''}`}>
                                            <RadioGroupItem value="in_person" className="sr-only" />
                                            <Building className="h-6 w-6 text-green-600" /><span className="font-bold">حضوري</span>
                                        </label>
                                        <label className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${courseData.deliveryType === 'capacity_based' ? 'border-purple-600 bg-purple-50' : ''}`}>
                                            <RadioGroupItem value="capacity_based" className="sr-only" />
                                            <Users className="h-6 w-6 text-purple-600" /><span className="font-bold">حجز مرن</span>
                                        </label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* In-Person Flow */}
                            {courseData.deliveryType === 'in_person' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>اختيار القاعة</CardTitle></CardHeader>
                                        <CardContent>
                                            {!selectedHall ? (
                                                <Button variant="outline" className="w-full justify-between h-14 border-dashed border-2 hover:bg-gray-50 hover:border-blue-500 text-gray-600" onClick={() => setIsHallDialogOpen(true)}>
                                                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> اختر قاعة التدريب لعرض المواعيد المتاحة</span>
                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-medium">الاستعراض والقائمة</span>
                                                </Button>
                                            ) : (
                                                <div className="mt-2 p-5 border-2 border-blue-100 bg-blue-50/40 rounded-xl flex flex-col md:flex-row gap-5 items-start md:items-center cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setIsHallDialogOpen(true)}>
                                                    <div className="relative h-24 w-full md:w-36 rounded-lg overflow-hidden shadow-sm shrink-0 border border-gray-100">
                                                        <HallImage src={selectedHall.image} alt={selectedHall.name} className="object-cover" />
                                                    </div>
                                                    <div className="flex-1 space-y-2 w-full">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-bold text-lg text-gray-900">{selectedHall.name}</h4>
                                                            <Badge variant="outline" className="bg-white hidden md:inline-flex">قاعة مختارة <CheckCircle className="mr-1 h-3 w-3 text-green-500 inline" /></Badge>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                                                            <span className="flex items-center gap-1.5 bg-white text-gray-700 px-2 py-1.5 rounded-md border shadow-sm"><Building className="h-4 w-4 text-purple-500" /> معهد: <strong>{selectedHall.owner}</strong></span>
                                                            <span className="flex items-center gap-1.5 bg-white text-gray-700 px-2 py-1.5 rounded-md border shadow-sm"><Users className="h-4 w-4 text-blue-500" /> السعة: <strong>{selectedHall.capacity}</strong></span>
                                                            <span className="flex items-center gap-1.5 bg-white text-gray-700 px-2 py-1.5 rounded-md border shadow-sm"><Banknote className="h-4 w-4 text-green-500" /> التكلفة: <strong>{selectedHall.hourlyRate} ر.ي/ساعة</strong></span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 hover:bg-white border w-full md:w-auto mt-2 md:mt-0" onClick={e => { e.stopPropagation(); setIsHallDialogOpen(true) }}>تغيير القاعة</Button>
                                                </div>
                                            )}
                                            <Dialog open={isHallDialogOpen} onOpenChange={setIsHallDialogOpen}>
                                                <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                                                    <DialogHeader><DialogTitle>اختيار القاعة</DialogTitle><DialogDescription>اختر قاعة من القائمة</DialogDescription></DialogHeader>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                                        {mappedHalls.map(hall => (
                                                            <div key={hall.id} className="border rounded-xl overflow-hidden hover:border-blue-500 transition-colors group flex flex-col bg-white">
                                                                <div className="relative h-40 bg-slate-100 group-hover:opacity-90 transition-opacity">
                                                                    <HallImage src={hall.image} alt={hall.name} className="object-cover" />
                                                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm">{hall.type}</Badge>
                                                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" /> {hall.location}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 flex-1 flex flex-col">
                                                                    <h4 className="font-bold whitespace-nowrap overflow-hidden text-ellipsis mb-1">{hall.name}</h4>
                                                                    <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3">
                                                                        <Building className="h-3 w-3 shrink-0 mt-0.5" /> <span className="line-clamp-2 leading-tight">{hall.owner}</span>
                                                                    </div>
                                                                    {hall.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{hall.description}</p>}
                                                                    {hall.features?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                                            {hall.features.slice(0, 3).map((f: string, i: number) => <span key={i} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">{f}</span>)}
                                                                            {hall.features.length > 3 && <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">+{hall.features.length - 3}</span>}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center mb-4 text-sm text-gray-500 border-t pt-3 mt-auto">
                                                                        <span>السعة: {hall.capacity}</span>
                                                                        <span className="text-blue-600 font-medium">{hall.hourlyRate} ر.ي/ساعة</span>
                                                                    </div>
                                                                    <Button variant="outline" className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors" onClick={() => { setSelectedHallId(hall.id); setIsHallDialogOpen(false) }}>اختيار القاعة</Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {!mappedHalls.length && <div className="col-span-full py-12 text-center text-gray-500">لا توجد قاعات متاحة</div>}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </CardContent>
                                    </Card>

                                    {selectedHall && (
                                        <Card>
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <CardTitle>جدول المواعيد - {monthLabel}</CardTitle>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => setCalendarOffset(p => Math.max(0, p - 1))} disabled={calendarOffset === 0}>السابق</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setCalendarOffset(p => Math.min(maxMonthsAhead, p + 1))}>التالي</Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">{weekDaysShort.map(d => <div key={d}>{d}</div>)}</div>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {calendarDays.map((d, i) => {
                                                        if (!d) return <div key={i} />
                                                        const isSel = selectedDate === d.dateKey
                                                        const hasS = selectedSessions.some(s => s.date === d.dateKey)
                                                        return <button key={i} type="button" onClick={() => handleSelectDay(d.dateKey)} disabled={d.isPast} className={`h-10 rounded-lg text-sm transition-all ${isSel ? 'bg-blue-600 text-white' : d.isPast ? 'bg-gray-100 text-gray-300' : hasS ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-white border hover:bg-gray-50'}`}>{d.day}</button>
                                                    })}
                                                </div>
                                                {selectedDate && (
                                                    <div className="border-t pt-4">
                                                        <h4 className="font-semibold mb-3">الأوقات المتاحة ليوم {formatDateLabel(selectedDate)}</h4>
                                                        {isSlotsLoading ? <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                                                            : availableSlots.length > 0 ? (
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {availableSlots.map(slot => {
                                                                        const sel = selectedSessions.some(s => s.date === selectedDate && s.slot === slot)
                                                                        return <button key={slot} type="button" onClick={() => toggleSlot(selectedDate, slot)} className={`p-2 text-sm rounded border ${sel ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>{slot}</button>
                                                                    })}
                                                                </div>
                                                            ) : <p className="text-sm text-gray-500 text-center py-4">{unavailableMessage || "لا يوجد أوقات متاحة"}</p>}
                                                    </div>
                                                )}
                                                {selectedSessions.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="bg-blue-50 p-4 rounded-lg">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-bold text-blue-800">تم اختيار {selectedSessions.length} جلسات</h4>
                                                                <span className="text-blue-900 font-bold">الإجمالي: {totalPrice.toLocaleString()} ر.ي</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">{selectedSessions.map((s, i) => <Badge key={i} variant="secondary" className="bg-white">{formatDateLabel(s.date)} ({s.slot})</Badge>)}</div>
                                                        </div>

                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Online Flow */}
                            {courseData.deliveryType === 'online' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-blue-600" />منصة البث والرابط</CardTitle></CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>منصة البث</Label>
                                                <Select value={onlineSchedule.platform} onValueChange={v => setOnlineSchedule({ ...onlineSchedule, platform: v })}>
                                                    <SelectTrigger><SelectValue placeholder="اختر المنصة" /></SelectTrigger>
                                                    <SelectContent>{platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رابط الاجتماع (Meeting Link)</Label>
                                                <Input placeholder="https://zoom.us/j/... أو meet.google.com/..." value={onlineSchedule.meetingLink} onChange={e => setOnlineSchedule({ ...onlineSchedule, meetingLink: e.target.value })} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" />الجلسات ({onlineSessions.length})</CardTitle>
                                                <Button type="button" size="sm" variant="outline" onClick={addOnlineSession}><Plus className="h-4 w-4 mr-1" /> إضافة جلسة</Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {onlineSessions.map((session, idx) => (
                                                <div key={idx} className="border rounded-xl p-4 space-y-3 bg-blue-50/40">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-sm text-blue-800">جلسة {idx + 1}</span>
                                                        {onlineSessions.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeOnlineSession(idx)}><X className="h-4 w-4" /></Button>}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">التاريخ</Label><Input type="date" value={session.date} onChange={e => updateOnlineSession(idx, 'date', e.target.value)} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">وقت البدء</Label><Input type="time" value={session.startTime} onChange={e => updateOnlineSession(idx, 'startTime', e.target.value)} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">المدة (دقيقة)</Label>
                                                            <Select value={session.duration} onValueChange={v => updateOnlineSession(idx, 'duration', v)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="30">30 دقيقة</SelectItem><SelectItem value="45">45 دقيقة</SelectItem>
                                                                    <SelectItem value="60">60 دقيقة</SelectItem><SelectItem value="90">90 دقيقة</SelectItem>
                                                                    <SelectItem value="120">120 دقيقة</SelectItem><SelectItem value="180">180 دقيقة</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1"><Label className="text-xs">عنوان الجلسة (اختياري)</Label><Input placeholder="مثال: المقدمة والتعريف بالمنهج" value={session.topic} onChange={e => updateOnlineSession(idx, 'topic', e.target.value)} /></div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div className="flex justify-between pt-6 border-t mt-8">
                                <Button variant="outline" onClick={() => setActiveTab("info")}>السابق</Button>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleSubmit('ACTIVE')} disabled={submitting || !courseData.deliveryType}>
                                        {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                                        نشر الدورة
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
