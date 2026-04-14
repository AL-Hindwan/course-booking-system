"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { instituteService } from "@/lib/institute-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Calendar, CheckCircle, Clock, DollarSign, Edit,
    Users, User, ArrowRight, BookOpen, MapPin,
    Loader2, Globe, GraduationCap
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"

export default function CourseDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true)
                const data = await instituteService.getCourseById(params.id as string)
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
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مستمر</Badge>
            case 'completed':
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">مكتمل</Badge>
            case 'draft':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">مسودة</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ملغي</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMMM yyyy", { locale: ar })
        } catch {
            return dateString
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                            {getStatusBadge(course.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                {course.category}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                آخر تحديث: {formatDate(course.updatedAt || course.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/institute/courses/${course.id}/edit`}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل الدورة
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/institute/courses/${course.id}/students`}>
                            <Users className="ml-2 h-4 w-4" />
                            إدارة الطلاب
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                وصف الدورة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">نبذة مختصرة</h3>
                                <p className="text-gray-600 leading-relaxed">{course.shortDescription || "لا يوجد نبذة مختصرة"}</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">التفاصيل الكاملة</h3>
                                <div className="prose prose-sm max-w-none text-gray-600">
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    أهداف الدورة
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid gap-3">
                                    {course.objectives.map((objective: string, index: number) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="mt-1 bg-green-100 p-1 rounded-full">
                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                            </div>
                                            <span className="text-gray-700">{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Prerequisites Card */}
                    {course.prerequisites && course.prerequisites.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    المتطلبات السابقة
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid gap-3">
                                    {course.prerequisites.map((prerequisite: string, index: number) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="mt-1 bg-blue-100 p-1 rounded-full">
                                                <CheckCircle className="h-3 w-3 text-blue-600" />
                                            </div>
                                            <span className="text-gray-700">{prerequisite}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* Key Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">معلومات الدورة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">السعر</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Intl.NumberFormat('en-US').format(course.price)} ريال
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">المدة</p>
                                        <p className="font-semibold text-gray-900">{course.duration} ساعة</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">تاريخ البدء</p>
                                        <p className="font-semibold text-gray-900">{formatDate(course.startDate)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">تاريخ الانتهاء</p>
                                        <p className="font-semibold text-gray-900">{formatDate(course.endDate)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trainer Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                مدرب الدورة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                                    {course.trainer?.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{course.trainer?.name}</h4>
                                    <p className="text-sm text-gray-500">{course.trainer?.email}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full mt-4" size="sm">
                                عرض الملف الشخصي
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                إحصائيات التسجيل
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">الطلاب المسجلين</span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {course.enrolledStudents} / {course.maxStudents}
                                </Badge>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((course.enrolledStudents / course.maxStudents) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>{course.maxStudents - course.enrolledStudents} مقاعد متبقية</span>
                                <span>{Math.round((course.enrolledStudents / course.maxStudents) * 100)}% امتلاء</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
