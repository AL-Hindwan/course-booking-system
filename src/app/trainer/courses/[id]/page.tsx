"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { trainerService } from "@/lib/trainer-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Calendar, CheckCircle, Clock, DollarSign, Edit,
    Users, User, ArrowRight, BookOpen, MapPin,
    Loader2, Globe, GraduationCap, Video, Map
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"

export default function TrainerCourseDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true)
                const data = await trainerService.getTrainerCourseById(params.id as string)
                setCourse(data)
            } catch (err: any) {
                setError(err?.response?.data?.message || "فشل في جلب تفاصيل الدورة")
                toast.error("حدث خطأ أثناء تحميل تفاصيل الدورة")
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchCourse()
        }
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mr-2">جاري تحميل تفاصيل الدورة...</span>
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <p>{error || "لم يتم العثور على الدورة المطلوبة"}</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة
                </Button>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge>
            case 'completed':
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">مكتمل</Badge>
            case 'draft':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">مسودة</Badge>
            case 'pending_review':
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">بانتظار الموافقة على الدفع</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ملغي</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "—"
        try {
            return format(new Date(dateString), "dd MMMM yyyy", { locale: ar })
        } catch {
            return dateString
        }
    }

    const deliveryLabels: Record<string, string> = {
        online: "أونلاين",
        in_person: "حضوري",
        hybrid: "مدمج"
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/trainer/courses')} className="rounded-full">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                            {getStatusBadge(course.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4 text-primary/70" />
                                {course.category || "عام"}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-primary/70" />
                                آخر تحديث: {formatDate(course.updatedAt || course.createdAt)}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <Badge variant="outline" className="flex items-center gap-1 font-normal border-primary/20 bg-primary/5 text-primary">
                                {course.deliveryType === 'online' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                {deliveryLabels[course.deliveryType] || course.deliveryType}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild className="rounded-xl border-blue-200 hover:bg-blue-50 text-blue-600">
                        <Link href={`/trainer/courses/${course.id}/edit`}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل الدورة
                        </Link>
                    </Button>
                    <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
                        <Link href={`/trainer/courses/${course.id}/students`}>
                            <Users className="ml-2 h-4 w-4" />
                            إدارة الطلاب
                        </Link>
                    </Button>
                </div>
            </div>

            {course.status === 'PENDING_REVIEW' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="font-medium">
                        طلبك قيد المراجعة من قِبَل المعهد. سيتم تفعيل الدورة فور التأكد من سند الدفع والموافقة على الحجز.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description Card */}
                    <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white/70 backdrop-blur-sm border border-slate-100">
                        <CardHeader className="border-b border-slate-50">
                            <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                وصف الدورة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    نبذة مختصرة
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-lg">{course.shortDescription || "لا يوجد نبذة مختصرة"}</p>
                            </div>
                            <Separator className="bg-slate-50" />
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    التفاصيل الكاملة
                                </h3>
                                <div className="prose prose-slate prose-lg max-w-none text-slate-600">
                                    {course.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: course.description.replace(/\n/g, '<br />') }} />
                                    ) : (
                                        <p>لا يوجد وصف تفصيلي</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Objectives Card */}
                    {course.objectives && course.objectives.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-sm bg-white/70 backdrop-blur-sm border border-slate-100">
                            <CardHeader className="border-b border-slate-50">
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                    <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    أهداف الدورة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {course.objectives.map((objective: string, index: number) => (
                                        <li key={index} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                            <span className="text-slate-700 font-medium">{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Prerequisites Card */}
                    {course.prerequisites && course.prerequisites.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-sm bg-white/70 backdrop-blur-sm border border-slate-100">
                            <CardHeader className="border-b border-slate-50">
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    المتطلبات السابقة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3">
                                    {course.prerequisites.map((prerequisite: string, index: number) => (
                                        <li key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/30">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                                            <span className="text-slate-700">{prerequisite}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-8">
                    {/* Key Info Card */}
                    <Card className="rounded-3xl border-none shadow-xl bg-white sticky top-24 overflow-hidden border border-slate-100">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                        <CardHeader>
                            <CardTitle className="text-lg">معلومات الدورة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:shadow-inner group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                                        <DollarSign className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">السعر</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {new Intl.NumberFormat('en-US').format(course.price)} ر.ي
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:shadow-inner group">
                                    <div className="bg-purple-100 p-2.5 w-fit rounded-xl text-purple-600 mb-3 group-hover:rotate-12 transition-transform">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 uppercase">المدة</p>
                                    <p className="font-bold text-slate-900">{course.duration} ساعة</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:shadow-inner group">
                                    <div className="bg-orange-100 p-2.5 w-fit rounded-xl text-orange-600 mb-3 group-hover:-rotate-12 transition-transform">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 uppercase">الحد الأقصى</p>
                                    <p className="font-bold text-slate-900">{course.maxStudents} طالب</p>
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar className="h-4 w-4" />
                                        <span>تاريخ البدء</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">{formatDate(course.startDate)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar className="h-4 w-4" />
                                        <span>تاريخ الانتهاء</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">{formatDate(course.endDate)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden border border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-indigo-600" />
                                إحصائيات التسجيل
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{course.enrolledStudents || 0}</p>
                                    <p className="text-xs text-slate-500 font-medium">طالب مسجل</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-slate-300">{course.maxStudents}</p>
                                    <p className="text-xs text-slate-500 font-medium">السعة القصوى</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                                        style={{ width: `${Math.min(((course.enrolledStudents || 0) / course.maxStudents) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium">
                                    <span className="text-indigo-600">{Math.round(((course.enrolledStudents || 0) / course.maxStudents) * 100)}% مكتمل</span>
                                    <span className="text-slate-400">{course.maxStudents - (course.enrolledStudents || 0)} مقعد متبقٍ</span>
                                </div>
                            </div>

                            <Button className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 h-12 shadow-inner" asChild>
                                <Link href={`/trainer/courses/${course.id}/students`}>
                                    عرض قائمة الطلاب
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Info (Hall/Link) */}
                    {course.deliveryType === 'in_person' && course.roomBooking && (
                        <Card className="rounded-3xl border-none shadow-sm bg-green-50/50 border border-green-100">
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 text-green-700 font-semibold">
                                        <Map className="h-5 w-5" />
                                        تفاصيل القاعة
                                    </div>
                                    <div className="text-sm text-green-600 space-y-1">
                                        <p className="font-bold">{course.roomBooking.hall?.name || "سيتم التحديد"}</p>
                                        <p>{course.roomBooking.hall?.location || course.roomBooking.hall?.institute?.address || ""}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {course.deliveryType === 'online' && (
                        <Card className="rounded-3xl border-none shadow-sm bg-blue-50/50 border border-blue-100">
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 text-blue-700 font-semibold">
                                        <Video className="h-5 w-5" />
                                        رابط الاجتماع
                                    </div>
                                    <p className="text-sm text-blue-600">
                                        {course.meetingLink ? (
                                            <a href={course.meetingLink} target="_blank" className="underline break-all">{course.meetingLink}</a>
                                        ) : "لم يتم إعداد رابط الاجتماع بعد"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
