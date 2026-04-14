"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { trainerService } from "@/lib/trainer-service"
import { HallImage } from "@/components/halls/HallImage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Save, Send, Trash2, ArrowLeft, X, MapPin, Users, Building, Globe, Plus, Calendar, Clock, CheckCircle, AlertCircle, Banknote, Lock, Loader2, Landmark } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const platforms = [
    { value: "zoom", label: "Zoom" },
    { value: "teams", label: "Microsoft Teams" },
    { value: "meet", label: "Google Meet" },
    { value: "webex", label: "Webex" },
    { value: "other", label: "أخرى" }
]

const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00"
]

const weekDaysShort = ["أحد", "اثن", "ثلا", "أرب", "خم", "جم", "سبت"]

export default function CreateCoursePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [activeTab, setActiveTab] = useState("info")

    // Reference Data State
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [halls, setHalls] = useState<any[]>([])
    const [newCategoryInput, setNewCategoryInput] = useState("")
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    const [courseData, setCourseData] = useState({
        title: "",
        categoryId: "",
        shortDescription: "",
        description: "",
        deliveryType: "", // in_person, online, hybrid, capacity_based (risk-free)
        price: "",
        minStudents: "",
        maxStudents: "",
        isFree: false,
        hallId: "",
        objectives: [] as string[],
        prerequisites: [] as string[],
        tags: [] as string[]
    })

    // Schedule State
    const [selectedSessions, setSelectedSessions] = useState<{ date: string, slot: string }[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [calendarOffset, setCalendarOffset] = useState(0)
    const [unavailableMessage, setUnavailableMessage] = useState("")
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isSlotsLoading, setIsSlotsLoading] = useState(false)
    const [isHallDialogOpen, setIsHallDialogOpen] = useState(false)
    const [onlineSchedule, setOnlineSchedule] = useState({
        platform: "",
        meetingLink: ""
    })

    type OnlineSession = { date: string; startTime: string; duration: string; topic: string }
    const [onlineSessions, setOnlineSessions] = useState<OnlineSession[]>([
        { date: "", startTime: "", duration: "60", topic: "" }
    ])

    const addOnlineSession = () => {
        setOnlineSessions(prev => [...prev, { date: "", startTime: "", duration: "60", topic: "" }])
    }
    const removeOnlineSession = (idx: number) => {
        setOnlineSessions(prev => prev.filter((_, i) => i !== idx))
    }
    const updateOnlineSession = (idx: number, field: keyof OnlineSession, value: string) => {
        setOnlineSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
    }

    const [currentObjective, setCurrentObjective] = useState("")
    const [currentPrerequisite, setCurrentPrerequisite] = useState("")
    const [currentTag, setCurrentTag] = useState("")

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [paymentFile, setPaymentFile] = useState<File | null>(null)
    const [paymentPreview, setPaymentPreview] = useState<string>("")
    const paymentInputRef = useRef<HTMLInputElement>(null)

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setPaymentFile(file)
            setPaymentPreview(URL.createObjectURL(file))
        }
    }

    const handleAddCategory = async () => {
        if (!newCategoryInput.trim()) return
        try {
            setIsCreatingCategory(true)
            const newCat = await trainerService.createCategory(newCategoryInput.trim())
            setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat].sort((a, b) => a.name.localeCompare(b.name)))
            setCourseData(prev => ({ ...prev, categoryId: newCat.id }))
            setNewCategoryInput("")
            setIsAddingCategory(false)
            toast.success(`تم إضافة التصنيف "${newCat.name}" بنجاح`)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "فشل في إضافة التصنيف")
        } finally {
            setIsCreatingCategory(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [cats, hls] = await Promise.all([
                    trainerService.getCategories(),
                    trainerService.getHalls()
                ])
                setCategories(cats)
                // Note: Trainers do not fetch a 'trainers' list because they are the trainer
                setHalls(hls)
                console.log("HLS DATA FETCHED:", hls)
            } catch (err) {
                toast.error("فشل في تحميل البيانات الأساسية")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Derived Halls for UI
    const mappedHalls = halls.map(h => ({
        id: h.id,
        name: h.name,
        type: h.type || "قاعة تدريب",
        location: h.location || "مقر المعهد",
        capacity: h.capacity,
        hourlyRate: Number(h.pricePerHour),
        image: h.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
        features: h.facilities && h.facilities.length > 0 ? h.facilities : ["مجهزة بالكامل"],
        description: h.description || `${h.facilities?.join(' • ') || 'لا يوجد وصف'}`,
        owner: h.institute?.name || "المعهد",
        bankAccounts: h.institute?.bankAccounts || []
    }))

    const selectedHall = mappedHalls.find(h => h.id === courseData.hallId)
    const totalPrice = selectedHall ? selectedHall.hourlyRate * selectedSessions.length : 0;

    // Calendar Logic (Simplified Mock)
    useEffect(() => {
        setSelectedDate(null)
        setSelectedSessions([])
        setUnavailableMessage("")
        setAvailableSlots([])
        setCalendarOffset(0)
    }, [courseData.hallId])

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const maxMonthsAhead = 5

    const formatDateLabel = (dateKey: string) => {
        const [year, month, day] = dateKey.split("-")
        return `${day}-${month}-${year}`
    }
    const formatDateKey = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    const monthDate = new Date(todayStart.getFullYear(), todayStart.getMonth() + calendarOffset, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const monthLabel = monthDate.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const calendarDays: Array<{ day: number; dateKey: string; isPast: boolean } | null> = []
    for (let i = 0; i < firstDay; i += 1) calendarDays.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) {
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const dateValue = new Date(year, month, day)
        const isPast = dateValue < todayStart
        calendarDays.push({ day, dateKey, isPast })
    }
    while (calendarDays.length % 7 !== 0) calendarDays.push(null)

    const handleSelectDay = async (dateKey: string) => {
        setSelectedDate(dateKey)
        setUnavailableMessage("")
        setAvailableSlots([])

        if (!courseData.hallId) return

        setIsSlotsLoading(true)
        try {
            const data = await trainerService.getHallAvailability(courseData.hallId, dateKey)

            const [yearStr, monthStr, dayStr] = dateKey.split("-")
            const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
            const dayOfWeekMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
            const dayName = dayOfWeekMap[dateObj.getDay()]

            const allowedPeriods = data.availability?.filter((a: any) => a.day === dayName) || []
            const hasAvailabilityDefined = data.availability && data.availability.length > 0

            const booked = data.bookedSessions || []

            const openSlots = timeSlots.filter(slot => {
                const [startHourStr, endHourStr] = slot.split(" - ")

                // 1. Check against base availability (working hours)
                if (hasAvailabilityDefined) {
                    const isWithinWorkingHours = allowedPeriods.some((period: any) => {
                        const pStart = period.startTime.substring(0, 5)
                        const pEnd = period.endTime.substring(0, 5)
                        return startHourStr >= pStart && endHourStr <= pEnd
                    })
                    if (!isWithinWorkingHours) return false
                }

                // 2. Check against booked sessions
                const slotStart = new Date(`${dateKey}T${startHourStr}:00`)
                const slotEnd = new Date(`${dateKey}T${endHourStr}:00`)

                const isOverlap = booked.some((b: any) => {
                    const bStart = new Date(b.startTime)
                    const bEnd = new Date(b.endTime)
                    return slotStart < bEnd && slotEnd > bStart
                })

                return !isOverlap
            })

            setAvailableSlots(openSlots)
            if (openSlots.length === 0) setUnavailableMessage("لا يوجد أوقات متاحة في هذا اليوم أوالقاعة مغلقة")
        } catch (e: any) {
            toast.error("فشل جلب أوقات القاعة المتاحة")
        } finally {
            setIsSlotsLoading(false)
        }
    }

    const toggleSessionSlot = (date: string, slot: string) => {
        const exists = selectedSessions.some((s) => s.date === date && s.slot === slot)
        if (exists) {
            setSelectedSessions(prev => prev.filter(s => !(s.date === date && s.slot === slot)))
        } else {
            setSelectedSessions(prev => [...prev, { date, slot }])
        }
    }

    // --- Submission Logic ---
    const handleSubmit = async (status: 'DRAFT' | 'ACTIVE') => {
        try {
            setIsSubmitting(true)

            // Calculate Dates
            let startDate: string, endDate: string;
            let sessionsPayload: any[] = [];

            if (status === 'DRAFT') {
                // Drafts don't need hall/session — save with placeholders
                startDate = new Date().toISOString().split('T')[0];
                endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                sessionsPayload = [];
            } else if (courseData.deliveryType === 'in_person') {
                if (selectedSessions.length === 0) throw new Error("يجب اختيار جلسة واحدة على الأقل");
                if (!paymentFile) throw new Error("يجب إرفاق سند الدفع لحجز القاعة");

                const sortedSessions = [...selectedSessions].sort((a, b) => a.date.localeCompare(b.date));
                startDate = sortedSessions[0].date;
                endDate = sortedSessions[sortedSessions.length - 1].date;

                sessionsPayload = selectedSessions.map(s => ({
                    date: s.date,
                    startTime: s.slot.split(" - ")[0],
                    endTime: s.slot.split(" - ")[1],
                    location: selectedHall?.name || "القاعة المختارة",
                    topic: "عنوان الجلسة"
                }));

            } else if (courseData.deliveryType === 'online') {
                const validSessions = onlineSessions.filter(s => s.date && s.startTime)
                if (validSessions.length === 0) throw new Error("يجب إضافة جلسة واحدة على الأقل مع تحديد التاريخ والوقت");
                const sortedDates = [...validSessions].sort((a, b) => a.date.localeCompare(b.date));
                startDate = sortedDates[0].date;
                endDate = sortedDates[sortedDates.length - 1].date;

                sessionsPayload = validSessions.map(s => {
                    const start = new Date(`${s.date}T${s.startTime}`);
                    const end = new Date(start.getTime() + Number(s.duration || 60) * 60000);
                    return {
                        date: s.date,
                        startTime: s.startTime,
                        endTime: end.toTimeString().substring(0, 5),
                        location: onlineSchedule.platform || 'Online',
                        meetingLink: onlineSchedule.meetingLink || undefined,
                        topic: s.topic || 'جلسة أونلاين'
                    };
                });
            } else {
                // Capacity based or other
                startDate = new Date().toISOString().split('T')[0];
                endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            const formData = new FormData()
            formData.append('title', courseData.title)
            formData.append('categoryId', courseData.categoryId)
            formData.append('shortDescription', courseData.shortDescription)
            formData.append('description', courseData.description)
            formData.append('deliveryType', courseData.deliveryType)
            formData.append('price', courseData.price.toString())
            formData.append('minStudents', courseData.minStudents.toString())
            formData.append('maxStudents', courseData.maxStudents.toString())
            formData.append('isFree', courseData.isFree.toString())
            formData.append('hallId', courseData.hallId)
            formData.append('objectives', JSON.stringify(courseData.objectives))
            formData.append('prerequisites', JSON.stringify(courseData.prerequisites))
            formData.append('tags', JSON.stringify(courseData.tags))

            formData.append('status', status)
            formData.append('startDate', startDate)
            formData.append('endDate', endDate)
            formData.append('duration', (courseData.deliveryType === 'in_person' ? selectedSessions.length : (onlineSessions.reduce((sum, s) => sum + Number(s.duration || 60), 0) / 60)).toString())
            formData.append('sessions', JSON.stringify(sessionsPayload))

            if (imageFile) {
                formData.append('image', imageFile)
            }

            if (paymentFile) {
                formData.append('paymentReceipt', paymentFile)
            }

            await trainerService.createCourse(formData);

            toast.success(status === 'DRAFT' ? 'تم حفظ المسودة بنجاح' : 'تم إنشاء الدورة بنجاح');
            router.push('/trainer/courses');

        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ أثناء إنشاء الدورة');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    // --- Handlers (Add/Remove) ---
    const addObjective = () => {
        if (currentObjective.trim()) {
            setCourseData(prev => ({ ...prev, objectives: [...prev.objectives, currentObjective.trim()] }))
            setCurrentObjective("")
        }
    }
    const removeObjective = (i: number) => setCourseData(prev => ({ ...prev, objectives: prev.objectives.filter((_, idx) => idx !== i) }))

    const addPrerequisite = () => {
        if (currentPrerequisite.trim()) {
            setCourseData(prev => ({ ...prev, prerequisites: [...prev.prerequisites, currentPrerequisite.trim()] }))
            setCurrentPrerequisite("")
        }
    }
    const removePrerequisite = (i: number) => setCourseData(prev => ({ ...prev, prerequisites: prev.prerequisites.filter((_, idx) => idx !== i) }))

    const addTag = () => {
        if (currentTag.trim() && !courseData.tags.includes(currentTag.trim())) {
            setCourseData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }))
            setCurrentTag("")
        }
    }
    const removeTag = (t: string) => setCourseData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }))

    // --- Validation ---
    const isInfoValid = courseData.title && courseData.categoryId && courseData.description && courseData.price && courseData.minStudents && courseData.maxStudents;
    const isLocationValid = () => {
        if (courseData.deliveryType === 'in_person') return !!courseData.hallId && selectedSessions.length > 0;
        if (courseData.deliveryType === 'online') return onlineSessions.some(s => s.date && s.startTime);
        return true; // capacity_based doesn't need location yet
    }

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-5xl mx-auto pb-12" dir="rtl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/trainer/courses">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            العودة للدورات
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء دورة تدريبية جديدة</h1>
                <p className="text-gray-600">اتبع الخطوات التالية لإنشاء ونشر دورتك التدريبية</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                <div className="w-full bg-white p-2 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                    <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-50/50">
                        <TabsTrigger value="info" className="data-[state=active]:bg-white h-10 gap-2">1. بيانات الدورة</TabsTrigger>
                        <TabsTrigger value="pricing" disabled={!isInfoValid} className="data-[state=active]:bg-white h-10 gap-2">2. الحجز والمواعيد</TabsTrigger>
                    </TabsList>
                </div>

                {/* --- Tab 1: Info --- */}
                <TabsContent value="info" className="space-y-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>عنوان الدورة *</Label>
                                    <Input value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })} placeholder="مثال: تعلم React" />
                                </div>
                                <div className="space-y-2">
                                    <Label>الفئة *</Label>
                                    <Select
                                        value={courseData.categoryId}
                                        onValueChange={v => {
                                            if (v === '__add_new__') {
                                                setIsAddingCategory(true)
                                            } else {
                                                setCourseData({ ...courseData, categoryId: v })
                                                setIsAddingCategory(false)
                                            }
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            <SelectItem value="__add_new__" className="text-blue-600 font-medium border-t mt-1">+ إضافة تصنيف جديد</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {isAddingCategory && (
                                        <div className="flex gap-2 items-center mt-1">
                                            <Input
                                                value={newCategoryInput}
                                                onChange={e => setNewCategoryInput(e.target.value)}
                                                placeholder="اسم التصنيف الجديد..."
                                                className="h-8 text-sm"
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                                autoFocus
                                            />
                                            <Button type="button" size="sm" onClick={handleAddCategory} disabled={isCreatingCategory}>
                                                {isCreatingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : 'إضافة'}
                                            </Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => { setIsAddingCategory(false); setNewCategoryInput(''); }}>إلغاء</Button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>وصف مختصر *</Label>
                                    <Textarea value={courseData.shortDescription} onChange={e => setCourseData({ ...courseData, shortDescription: e.target.value })} rows={2} />
                                </div>
                                <div className="space-y-4">
                                    <Label>صورة الدورة</Label>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="relative h-32 w-48 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            {imagePreview ? (
                                                <Image src={imagePreview} alt="Course Preview" fill className="object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-400">
                                                    <Plus className="h-8 w-8 mb-2" />
                                                    <span className="text-xs">إضافة صورة</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm text-gray-500">اختر صورة معبرة عن الدورة التدريبية. يفضل أن تكون صورتك بصيغة JPG أو PNG وبجودة عالية.</p>
                                            <div className="flex gap-2">
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>تغيير الصورة</Button>
                                                {imageFile && <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setImageFile(null); setImagePreview(""); }}>إزالة</Button>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>الوصف التفصيلي *</Label>
                                    <Textarea value={courseData.description} onChange={e => setCourseData({ ...courseData, description: e.target.value })} rows={4} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>العدد والتسعير</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>سعر الدورة (ر.ي) *</Label>
                                    <Input type="number" value={courseData.price} onChange={e => setCourseData({ ...courseData, price: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>أقل عدد مقاعد *</Label>
                                    <Input type="number" value={courseData.minStudents} onChange={e => setCourseData({ ...courseData, minStudents: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>أقصى عدد مقاعد *</Label>
                                    <Input type="number" value={courseData.maxStudents} onChange={e => setCourseData({ ...courseData, maxStudents: e.target.value })} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">الأهداف</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input value={currentObjective} onChange={e => setCurrentObjective(e.target.value)} placeholder="أضف هدف..." />
                                        <Button onClick={addObjective} size="icon"><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="space-y-2">
                                        {courseData.objectives.map((o, i) => (
                                            <div key={i} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span>{o}</span>
                                                <X className="h-4 w-4 cursor-pointer text-red-500" onClick={() => removeObjective(i)} />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base">المتطلبات السابقة</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input value={currentPrerequisite} onChange={e => setCurrentPrerequisite(e.target.value)} placeholder="أضف متطلب..." />
                                        <Button onClick={addPrerequisite} size="icon"><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="space-y-2">
                                        {courseData.prerequisites.map((p, i) => (
                                            <div key={i} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span>{p}</span>
                                                <X className="h-4 w-4 cursor-pointer text-red-500" onClick={() => removePrerequisite(i)} />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base">الوسوم</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input value={currentTag} onChange={e => setCurrentTag(e.target.value)} placeholder="أضف وسم..." />
                                        <Button onClick={addTag} size="icon"><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {courseData.tags.map(t => (
                                            <Badge key={t} variant="secondary">
                                                {t} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(t)} />
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={isSubmitting || !isInfoValid}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            حفظ كمسودة
                        </Button>
                        <Button onClick={() => setActiveTab("pricing")} disabled={!isInfoValid}>التالي ←</Button>
                    </div>
                </TabsContent>

                {/* --- Tab 2: Pricing & Schedule --- */}
                <TabsContent value="pricing" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>طريقة التقديم</CardTitle></CardHeader>
                        <CardContent>
                            <RadioGroup value={courseData.deliveryType} onValueChange={v => setCourseData({ ...courseData, deliveryType: v })} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${courseData.deliveryType === 'online' ? 'border-blue-600 bg-blue-50' : ''}`}>
                                    <RadioGroupItem value="online" className="sr-only" />
                                    <Globe className="h-6 w-6 text-blue-600" />
                                    <span className="font-bold">أونلاين</span>
                                </label>
                                <label className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${courseData.deliveryType === 'in_person' ? 'border-green-600 bg-green-50' : ''}`}>
                                    <RadioGroupItem value="in_person" className="sr-only" />
                                    <Building className="h-6 w-6 text-green-600" />
                                    <span className="font-bold">حضوري</span>
                                </label>
                                <label className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${courseData.deliveryType === 'capacity_based' ? 'border-purple-600 bg-purple-50' : ''}`}>
                                    <RadioGroupItem value="capacity_based" className="sr-only" />
                                    <Users className="h-6 w-6 text-purple-600" />
                                    <span className="font-bold">حجز مرن</span>
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
                                                    <span className="flex items-center gap-1.5 bg-white text-gray-700 px-2 py-1.5 rounded-md border shadow-sm"><Building className="h-4 w-4 text-purple-500" /> معهد: <strong>{selectedHall.owner}</strong> </span>
                                                    <span className="flex items-center gap-1.5 bg-white text-gray-700 px-2 py-1.5 rounded-md border shadow-sm"><Users className="h-4 w-4 text-blue-500" /> السعة: <strong>{selectedHall.capacity}</strong> </span>
                                                    <span className="flex items-center gap-1.5 bg-white text-gray-700 px-2 py-1.5 rounded-md border shadow-sm"><Banknote className="h-4 w-4 text-green-500" /> التكلفة: <strong>{selectedHall.hourlyRate} ر.ي/ساعة</strong></span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 hover:bg-white border w-full md:w-auto mt-2 md:mt-0" onClick={(e) => { e.stopPropagation(); setIsHallDialogOpen(true); }}>
                                                تغيير القاعة
                                            </Button>
                                        </div>
                                    )}

                                    <Dialog open={isHallDialogOpen} onOpenChange={setIsHallDialogOpen}>
                                        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                                            <DialogHeader className="sr-only">
                                                <DialogTitle>اختيار القاعة</DialogTitle>
                                                <DialogDescription>اختر قاعة من القائمة</DialogDescription>
                                                {halls.length > 0 && <div className="text-xs text-red-500 bg-red-50 p-2 mb-4 whitespace-normal break-words overflow-hidden" dir="ltr">{JSON.stringify(halls[0])}</div>}
                                            </DialogHeader>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                                {mappedHalls.map((hall) => (
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
                                                            {hall.description && (
                                                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                                    {hall.description}
                                                                </p>
                                                            )}
                                                            {hall.features && hall.features.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-3">
                                                                    {hall.features.slice(0, 3).map((feature: string, idx: number) => (
                                                                        <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                                                            {feature}
                                                                        </span>
                                                                    ))}
                                                                    {hall.features.length > 3 && (
                                                                        <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                                                            +{hall.features.length - 3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center mb-4 text-sm text-gray-500 border-t pt-3 mt-auto">
                                                                <span>السعة: {hall.capacity}</span>
                                                                <span className="text-blue-600 font-medium">{hall.hourlyRate} ر.ي/ساعة</span>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCourseData(p => ({ ...p, hallId: hall.id }));
                                                                    setIsHallDialogOpen(false);
                                                                }}
                                                            >
                                                                اختيار القاعة
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {mappedHalls.length === 0 && (
                                                    <div className="col-span-full py-12 text-center text-gray-500">لا توجد قاعات متاحة للاختيار</div>
                                                )}
                                            </div>                                        </DialogContent>
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
                                    <CardContent className="space-y-6">
                                        {/* Calendar Grid */}
                                        <div>
                                            <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">{weekDaysShort.map(d => <div key={d}>{d}</div>)}</div>
                                            <div className="grid grid-cols-7 gap-2">
                                                {calendarDays.map((d, i) => {
                                                    if (!d) return <div key={i} />
                                                    const isSelected = selectedDate === d.dateKey
                                                    const hasSessions = selectedSessions.some(s => s.date === d.dateKey)
                                                    return (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => handleSelectDay(d.dateKey)}
                                                            disabled={d.isPast}
                                                            className={`h-10 rounded-lg text-sm transition-all
                                                        ${isSelected ? 'bg-blue-600 text-white' :
                                                                    d.isPast ? 'bg-gray-100 text-gray-300' :
                                                                        hasSessions ? 'bg-blue-100 text-blue-800 border-blue-200 border' : 'bg-white border hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {d.day}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {selectedDate && (
                                            <div className="border-t pt-4">
                                                <h4 className="font-semibold mb-3">الأوقات المتاحة ليوم {formatDateLabel(selectedDate)}</h4>
                                                {isSlotsLoading ? (
                                                    <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                                                ) : availableSlots.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {availableSlots.map(slot => {
                                                            const isSelected = selectedSessions.some(s => s.date === selectedDate && s.slot === slot)
                                                            return (
                                                                <button
                                                                    key={slot}
                                                                    type="button"
                                                                    onClick={() => toggleSessionSlot(selectedDate, slot)}
                                                                    className={`p-2 text-sm rounded border ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                                                                >
                                                                    {slot}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 text-center py-4">{unavailableMessage || "لا يوجد أوقات متاحة"}</p>
                                                )}
                                            </div>
                                        )}

                                        {selectedSessions.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-bold text-blue-800">تم اختيار {selectedSessions.length} جلسات</h4>
                                                        <div className="text-blue-900 font-bold">الإجمالي: {totalPrice.toLocaleString()} ر.ي</div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedSessions.map((s, i) => (
                                                            <Badge key={i} variant="secondary" className="bg-white">{formatDateLabel(s.date)} ({s.slot})</Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Card className="border-2 border-dashed border-blue-200">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <Banknote className="h-5 w-5 text-blue-600" />
                                                            بيانات الدفع لحجز القاعة
                                                        </CardTitle>
                                                        <CardDescription>يرجى تحويل مبلغ {totalPrice.toLocaleString()} ر.ي إلى أحد الحسابات التالية وإرفاق صورة السند أدناه</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-6">

                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-semibold text-gray-700">الحسابات البنكية للمعهد</h4>
                                                            {selectedHall?.bankAccounts && selectedHall.bankAccounts.length > 0 ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {selectedHall.bankAccounts.map((bank: any) => (
                                                                        <div key={bank.id} className="relative overflow-hidden group p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border-gray-100">
                                                                            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600"></div>
                                                                            <div className="flex items-center gap-3 mb-4">
                                                                                <div className="h-10 w-10 bg-blue-50/80 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                                                                    <Landmark className="h-5 w-5" />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="font-bold text-gray-900 leading-tight">{bank.bankName}</h5>
                                                                                    <p className="text-xs text-gray-500 mt-1">{bank.accountName}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100/60">
                                                                                <div className="flex justify-between items-center text-sm">
                                                                                    <span className="text-xs text-gray-500 font-medium">رقم الحساب</span>
                                                                                    <span className="font-mono font-semibold text-blue-900" dir="ltr">{bank.accountNumber}</span>
                                                                                </div>
                                                                                {bank.iban && (
                                                                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                                                                        <span className="text-xs text-gray-500 font-medium">IBAN</span>
                                                                                        <span className="font-mono text-xs font-semibold text-gray-700" dir="ltr">{bank.iban}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg border border-dashed">
                                                                    لا توجد حسابات بنكية مضافة لهذا المعهد حالياً. يمكنك التواصل مع المعهد مباشرة.
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div
                                                            className="relative h-48 w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer overflow-hidden group"
                                                            onClick={() => paymentInputRef.current?.click()}
                                                        >
                                                            {paymentPreview ? (
                                                                <>
                                                                    <Image src={paymentPreview} alt="Payment Receipt" fill className="object-contain" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <Button variant="secondary" size="sm">تغيير الصورة</Button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="text-center p-6">
                                                                    <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                                                                        <Plus className="h-6 w-6 text-blue-600" />
                                                                    </div>
                                                                    <p className="font-medium text-gray-700">إرفاق صورة سند الدفع</p>
                                                                    <p className="text-xs text-gray-500 mt-1">اضغط هنا لرفع الملف (JPG, PNG)</p>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                ref={paymentInputRef}
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handlePaymentChange}
                                                            />
                                                        </div>

                                                        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                            <p>
                                                                سيتم مراجعة طلب حجز القاعة وتأكيده من قبل إدارة المعهد قبل تفعيل الدورة بشكل نهائي.
                                                                تأكد من وضوح بيانات السند لتسريع عملية القبول.
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
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
                            {/* Platform & Meeting Link */}
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-blue-600" />منصة البث والرابط</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>منصة البث</Label>
                                        <Select value={onlineSchedule.platform} onValueChange={v => setOnlineSchedule({ ...onlineSchedule, platform: v })}>
                                            <SelectTrigger><SelectValue placeholder="اختر المنصة" /></SelectTrigger>
                                            <SelectContent>
                                                {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>رابط الاجتماع (Meeting Link)</Label>
                                        <Input
                                            placeholder="https://zoom.us/j/... أو meet.google.com/..."
                                            value={onlineSchedule.meetingLink}
                                            onChange={e => setOnlineSchedule({ ...onlineSchedule, meetingLink: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sessions List */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" />الجلسات ({onlineSessions.length})</CardTitle>
                                        <Button type="button" size="sm" variant="outline" onClick={addOnlineSession}>
                                            <Plus className="h-4 w-4 mr-1" /> إضافة جلسة
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {onlineSessions.map((session, idx) => (
                                        <div key={idx} className="border rounded-xl p-4 space-y-3 bg-blue-50/40 relative">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-sm text-blue-800">جلسة {idx + 1}</span>
                                                {onlineSessions.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeOnlineSession(idx)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">التاريخ</Label>
                                                    <Input type="date" value={session.date} onChange={e => updateOnlineSession(idx, 'date', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">وقت البدء</Label>
                                                    <Input type="time" value={session.startTime} onChange={e => updateOnlineSession(idx, 'startTime', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">المدة (دقيقة)</Label>
                                                    <Select value={session.duration} onValueChange={v => updateOnlineSession(idx, 'duration', v)}>
                                                        <SelectTrigger><SelectValue placeholder="المدة" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="30">30 دقيقة</SelectItem>
                                                            <SelectItem value="45">45 دقيقة</SelectItem>
                                                            <SelectItem value="60">60 دقيقة</SelectItem>
                                                            <SelectItem value="90">90 دقيقة</SelectItem>
                                                            <SelectItem value="120">120 دقيقة</SelectItem>
                                                            <SelectItem value="180">180 دقيقة</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">عنوان الجلسة (اختياري)</Label>
                                                <Input placeholder="مثال: المقدمة والتعريف بالمنهج" value={session.topic} onChange={e => updateOnlineSession(idx, 'topic', e.target.value)} />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="flex justify-between pt-6 border-t mt-8">
                        <Button variant="outline" onClick={() => setActiveTab("info")}>السابق</Button>
                        <div className="flex gap-2">
                            <Button onClick={() => handleSubmit('ACTIVE')} disabled={!isLocationValid() || isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {courseData.deliveryType === 'in_person' ? 'إرسال للمراجعة' : 'نشر الدورة'}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
