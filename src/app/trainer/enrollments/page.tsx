"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, User, BookOpen, CreditCard, FileText, Download, Phone, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { trainerService } from "@/lib/trainer-service"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function resolveImage(src: string | null | undefined): string {
    if (!src) return "/images/placeholder.png"
    if (src.startsWith("http")) return src
    const cleanSrc = src.replace(/\\/g, "/")
    const separator = cleanSrc.startsWith("/") ? "" : "/"
    return `${API_BASE_URL}${separator}${cleanSrc}`
}

export default function TrainerEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedEnrollment, setSelectedEnrollment] = useState<any | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchEnrollments = useCallback(async () => {
        try {
            setLoading(true)
            const data = await trainerService.getEnrollments()
            setEnrollments(data)
        } catch (error: any) {
            toast.error("فشل في جلب طلبات التسجيل")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchEnrollments()
    }, [fetchEnrollments])

    const formatAmount = (amount: number) => `${(amount).toLocaleString("ar-YE")} ر.ي`

    const handleAccept = async (id: string) => {
        try {
            setProcessingId(id)
            await trainerService.updateEnrollmentStatus(id, 'ACTIVE')
            toast.success("تم قبول طلب التسجيل بنجاح")
            fetchEnrollments()
            setIsDialogOpen(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "فشل في قبول الطلب")
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id: string) => {
        const reason = window.prompt("سبب الرفض (اختياري):") || "";
        try {
            setProcessingId(id)
            await trainerService.updateEnrollmentStatus(id, 'CANCELLED', reason)
            toast.success("تم رفض طلب التسجيل")
            fetchEnrollments()
            setIsDialogOpen(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "فشل في رفض الطلب")
        } finally {
            setProcessingId(null)
        }
    }

    const handleRejectPayment = async (id: string) => {
        const reason = window.prompt("سبب رفض الدفعة (اختياري):") || "";
        try {
            setProcessingId(id)
            await trainerService.updateEnrollmentStatus(id, 'REJECT_PAYMENT', reason)
            toast.success("تم رفض الدفعة بنجاح")
            fetchEnrollments()
            setIsDialogOpen(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "فشل في رفض الدفعة")
        } finally {
            setProcessingId(null)
        }
    }

    const openPaymentDetails = (enrollment: any) => {
        setSelectedEnrollment(enrollment)
        setIsDialogOpen(true)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
            case "COMPLETED":
                return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">تم القبول</Badge>
            case "CANCELLED":
                return <Badge className="bg-rose-50 text-rose-700 border border-rose-200">مرفوض / ملغي</Badge>
            case "PRELIMINARY":
            case "PENDING_PAYMENT":
                return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">قيد المراجعة</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading && enrollments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]" dir="rtl">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500">جاري تحميل طلبات التسجيل...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto" dir="rtl">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">طلبات التسجيل</h1>
                    <Button variant="ghost" size="sm" onClick={fetchEnrollments} className="text-slate-500">
                        تحديث <Clock className="mr-2 h-4 w-4" />
                    </Button>
                </div>
                <p className="text-gray-600">مراجعة وقبول طلبات انضمام الطلاب للدورات التدريبية</p>
            </div>

            <div className="grid gap-6">
                {enrollments.length > 0 ? (
                    enrollments.map((enrollment) => {
                        const student = enrollment.student;
                        const course = enrollment.course;
                        const latestPayment = enrollment.payments?.[0];
                        const isPreliminary = enrollment.status === "PRELIMINARY";
                        const isPendingReview = enrollment.status === "PENDING_PAYMENT" && latestPayment?.status === "PENDING_REVIEW";

                        return (
                            <Card key={enrollment.id} className="overflow-hidden bg-white shadow-sm border border-slate-100">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                                                <AvatarImage src={student.avatar ? `${API_BASE_URL}${student.avatar}` : ""} />
                                                <AvatarFallback>{student.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                                                    {getStatusBadge(enrollment.status)}
                                                </div>
                                                <div className="text-sm text-slate-500 space-y-1">
                                                    <p>{student.email}</p>
                                                    <p className="flex items-center gap-1">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {student.phone || "لا يوجد رقم هاتف"}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${enrollment.status !== "CANCELLED" ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                        <span className={`text-xs font-medium ${enrollment.status !== "CANCELLED" ? 'text-slate-900' : 'text-slate-500'}`}>التسجيل المبدئي</span>
                                                        {enrollment.status !== "CANCELLED" && enrollment.status !== "PRELIMINARY" && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                                    </div>
                                                    <div className="w-px h-4 bg-slate-200"></div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${latestPayment?.status === "APPROVED" || enrollment.status === "ACTIVE" ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                        <span className={`text-xs font-medium ${latestPayment?.status === "APPROVED" || enrollment.status === "ACTIVE" ? 'text-slate-900' : 'text-slate-500'}`}>تأكيد الدفع</span>
                                                        {(latestPayment?.status === "APPROVED" || enrollment.status === "ACTIVE") && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3 text-sm">
                                                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-medium">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                        <span>{course.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>منذ {formatDate(enrollment.enrolledAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {latestPayment && !isPreliminary && (
                                                <Button
                                                    variant="outline"
                                                    disabled={processingId === enrollment.id}
                                                    onClick={() => openPaymentDetails(enrollment)}
                                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                >
                                                    {isPendingReview ? (
                                                        <FileText className="ml-2 h-4 w-4" />
                                                    ) : (
                                                        <Download className="ml-2 h-4 w-4" />
                                                    )}
                                                    {isPendingReview ? "مراجعة الدفع" : "تفاصيل الدفع"}
                                                </Button>
                                            )}
                                            {isPreliminary && (
                                                <>
                                                    <Button
                                                        disabled={processingId === enrollment.id}
                                                        onClick={() => handleAccept(enrollment.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        {processingId === enrollment.id ? (
                                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="ml-2 h-4 w-4" />
                                                        )}
                                                        قبول مبدئي
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        disabled={processingId === enrollment.id}
                                                        onClick={() => handleReject(enrollment.id)}
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                    >
                                                        <XCircle className="ml-2 h-4 w-4" />
                                                        رفض
                                                    </Button>
                                                </>
                                            )}
                                            {isPendingReview && (
                                                <>
                                                    <Button
                                                        disabled={processingId === enrollment.id}
                                                        onClick={() => handleAccept(enrollment.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        {processingId === enrollment.id ? (
                                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="ml-2 h-4 w-4" />
                                                        )}
                                                        تنشيط التسجيل
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        disabled={processingId === enrollment.id}
                                                        onClick={() => handleRejectPayment(enrollment.id)}
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                    >
                                                        <XCircle className="ml-2 h-4 w-4" />
                                                        رفض الدفعة
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات معلّقة</h3>
                            <p className="text-gray-500">جميع طلبات التسجيل تمت مراجعتها</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payment Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[820px] w-[95vw] rounded-2xl p-0 overflow-hidden">
                    <div className="px-6 pt-6">
                        <DialogHeader className="text-right">
                            <DialogTitle className="text-xl">تفاصيل الدفع</DialogTitle>
                        </DialogHeader>
                    </div>

                    {selectedEnrollment && (
                        <div className="px-6 pb-6 pt-4">
                            <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                                <div className="order-1">
                                    <div className="rounded-2xl border border-slate-100 bg-white p-4 h-full">
                                        <h4 className="flex items-center gap-2 font-semibold text-slate-900 text-right mb-4">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            سند الدفع
                                        </h4>
                                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                            {selectedEnrollment.payments?.[0]?.depositSlipImage ? (
                                                <Image
                                                    src={resolveImage(selectedEnrollment.payments[0].depositSlipImage)}
                                                    alt="سند الدفع"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized={true}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                    <Download className="h-10 w-10 mb-2 opacity-20" />
                                                    <p className="text-sm">لا يتوفر صورة للسند</p>
                                                    <p className="text-xs">المبلغ: {formatAmount(selectedEnrollment.payments?.[0]?.amount || 0)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="order-2 space-y-4 text-right">
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border border-slate-200 shadow-sm">
                                                <AvatarImage src={resolveImage(selectedEnrollment.student.avatar)} />
                                                <AvatarFallback>{selectedEnrollment.student.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-500">الطالب</p>
                                                <p className="text-lg font-semibold text-slate-900">{selectedEnrollment.student.name}</p>
                                                <div className="mt-1 space-y-1 text-sm text-slate-600">
                                                    <p>{selectedEnrollment.student.email}</p>
                                                    <p className="flex items-center gap-1 justify-end">
                                                        <span>{selectedEnrollment.student.phone || "لا يوجد رقم"}</span>
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                                        <p className="text-sm text-slate-500">ملخص الدفع</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm text-slate-500">الإجمالي</span>
                                            <span className="text-lg font-semibold text-slate-900">{formatAmount(selectedEnrollment.payments?.[0]?.amount || selectedEnrollment.course.price)}</span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm text-slate-500">حالة الدفع</span>
                                            <Badge variant="outline" className={selectedEnrollment.payments?.[0]?.status === 'APPROVED' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}>
                                                {selectedEnrollment.payments?.[0]?.status === 'APPROVED' ? 'مؤكد' : 'انتظار المراجعة'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                                        <p className="text-sm text-slate-500">الدورة</p>
                                        <p className="mt-1 font-semibold text-slate-900">{selectedEnrollment.course.title}</p>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 justify-end">
                                            <span>تاريخ التسجيل: {formatDate(selectedEnrollment.enrolledAt)}</span>
                                            <Clock className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                {(() => {
                                    const latestPayment = selectedEnrollment.payments?.[0];
                                    const isPreliminary = selectedEnrollment.status === "PRELIMINARY";
                                    const isPendingReview = selectedEnrollment.status === "PENDING_PAYMENT" && latestPayment?.status === "PENDING_REVIEW";

                                    if (isPreliminary) {
                                        return (
                                            <div className="flex gap-2 w-full">
                                                <Button
                                                    disabled={processingId === selectedEnrollment.id}
                                                    onClick={() => handleAccept(selectedEnrollment.id)}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    {processingId === selectedEnrollment.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="ml-2 h-4 w-4" />
                                                    )}
                                                    قبول مبدئي
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    disabled={processingId === selectedEnrollment.id}
                                                    onClick={() => handleReject(selectedEnrollment.id)}
                                                    className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                                                >
                                                    <XCircle className="ml-2 h-4 w-4" />
                                                    رفض الطلب
                                                </Button>
                                            </div>
                                        );
                                    }

                                    if (isPendingReview) {
                                        return (
                                            <div className="flex gap-2 w-full">
                                                <Button
                                                    disabled={processingId === selectedEnrollment.id}
                                                    onClick={() => handleAccept(selectedEnrollment.id)}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    {processingId === selectedEnrollment.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="ml-2 h-4 w-4" />
                                                    )}
                                                    قبول الدفعة وتنشيط الحساب
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    disabled={processingId === selectedEnrollment.id}
                                                    onClick={() => handleRejectPayment(selectedEnrollment.id)}
                                                    className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                                                >
                                                    <XCircle className="ml-2 h-4 w-4" />
                                                    رفض الدفعة
                                                </Button>
                                            </div>
                                        );
                                    }

                                    return null;
                                })()}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}


