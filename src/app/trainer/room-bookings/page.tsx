"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Clock, X, CheckCircle, AlertCircle, Filter, Loader2, Upload, Eye } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import { trainerService } from "@/lib/trainer-service"
import { toast } from "sonner"

export default function TrainerRoomBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  // For cancelling
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  // For resubmitting payment
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // For viewing payment
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false)

  // For viewing rejection reason
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await trainerService.getRoomBookings()
      setBookings(data)
    } catch (error) {
      toast.error("فشل في تحميل طلبات الحجز")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredBookings = bookings.filter(booking => {
    if (filter === "all") return true
    if (filter === "pending") return ["PENDING", "PENDING_APPROVAL", "PENDING_PAYMENT"].includes(booking.status)
    if (filter === "approved") return booking.status === "APPROVED"
    if (filter === "rejected") return booking.status === "REJECTED"
    if (filter === "cancelled") return booking.status === "CANCELLED"
    return true
  })

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'مقبول'
      case 'REJECTED': return 'مرفوض'
      case 'PENDING':
      case 'PENDING_APPROVAL': return 'بانتظار الموافقة'
      case 'PENDING_PAYMENT': return 'بانتظار الدفع'
      case 'CANCELLED': return 'ملغى'
      default: return status || 'غير معروف'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 border-green-200 bg-green-50'
      case 'REJECTED': return 'text-red-600 border-red-200 bg-red-50'
      case 'PENDING':
      case 'PENDING_APPROVAL': return 'text-yellow-600 border-yellow-200 bg-yellow-50'
      case 'PENDING_PAYMENT': return 'text-blue-600 border-blue-200 bg-blue-50'
      case 'CANCELLED': return 'text-gray-600 border-gray-200 bg-gray-50'
      default: return 'text-gray-600 border-gray-200 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'REJECTED': return <X className="h-4 w-4" />
      case 'PENDING':
      case 'PENDING_APPROVAL': return <Clock className="h-4 w-4" />
      case 'PENDING_PAYMENT': return <Clock className="h-4 w-4" />
      case 'CANCELLED': return <AlertCircle className="h-4 w-4" />
      default: return null
    }
  }

  const handleCancelBooking = (booking: any) => {
    setSelectedBooking(booking)
    setShowCancelDialog(true)
  }

  const confirmCancellation = async () => {
    if (!selectedBooking) return
    try {
      setCancelLoading(true)
      await trainerService.cancelBooking(selectedBooking.courseId, selectedBooking.id)
      toast.success("تم إلغاء طلب الحجز بنجاح")
      setShowCancelDialog(false)
      setSelectedBooking(null)
      fetchData() // Refresh
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل في إلغاء الطلب")
    } finally {
      setCancelLoading(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!selectedBooking || !paymentFile) {
      toast.error("الرجاء اختيار ملف الإيصال")
      return;
    }

    try {
      setPaymentLoading(true)
      await trainerService.resubmitBookingPayment(selectedBooking.courseId, selectedBooking.id, paymentFile)
      toast.success("تم إرسال الإيصال بنجاح")
      setShowPaymentDialog(false)
      setSelectedBooking(null)
      setPaymentFile(null)
      fetchData() // Refresh
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل في إرسال الإيصال")
    } finally {
      setPaymentLoading(false)
    }
  }



  const pendingBookings = bookings.filter(b => ["PENDING", "PENDING_APPROVAL", "PENDING_PAYMENT"].includes(b.status))
  const approvedBookings = bookings.filter(b => b.status === "APPROVED")
  const rejectedBookings = bookings.filter(b => b.status === "REJECTED")

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          طلبات حجز القاعات
        </h1>
        <p className="text-gray-600">
          إدارة طلبات حجز القاعات لدروس الدورات التدريبية
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">قيد المعالجة</p>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مقبولة</p>
                <p className="text-2xl font-bold">{approvedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مرفوضة</p>
                <p className="text-2xl font-bold">{rejectedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap items-center justify-start gap-3 text-right border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="h-5 w-5 text-slate-400" />
          <span className="font-medium">تصفية الطلبات:</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-11 w-48 rounded-full bg-white text-sm">
            <SelectValue placeholder="جميع الطلبات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الطلبات</SelectItem>
            <SelectItem value="pending">قيد المعالجة</SelectItem>
            <SelectItem value="approved">مقبولة</SelectItem>
            <SelectItem value="rejected">مرفوضة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات الحجز</CardTitle>
          <CardDescription>
            جميع طلبات حجز القاعات المرتبطة بدوراتك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                لا توجد طلبات حجز
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "لم تقم بطلب حجز أي قاعة بعد"
                  : `لا توجد طلبات في هذه الحالة`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الدورة</TableHead>

                  <TableHead>القاعة المطلوبة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.course?.title || "دورة غير محددة"}</div>
                        {/* Date/Time and Session title removed */}
                      </div>
                    </TableCell>
                    {/* Date/Time cell removed */}
                    <TableCell>
                      {booking.room ? (
                        <Link
                          href={`/trainer/halls/${booking.room.id}`}
                          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900"
                        >
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{booking.room.name}</span>
                        </Link>
                      ) : (
                        <span className="text-gray-500">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {getStatusLabel(booking.status)}
                        </Badge>
                        {booking.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={booking.rejectionReason}>
                            السبب: {booking.rejectionReason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.payments && booking.payments.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 mb-2"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowViewPaymentDialog(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          عرض الدفع
                        </Button>
                      )}

                      {booking.status === 'PENDING_PAYMENT' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 w-full mb-2"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowPaymentDialog(true)
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          رفع الإيصال
                        </Button>
                      )}

                      {booking.status === 'REJECTED' && booking.rejectionReason && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50 mb-2"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowRejectionDialog(true)
                          }}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          سبب الرفض
                        </Button>
                      )}

                      {(booking.status === 'PENDING' || booking.status === 'PENDING_APPROVAL') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 w-full"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          إلغاء الطلب
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Cards (Optional) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">طلب حجز قاعة</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• يتم طلب الحجز أثناء إنشاء الدورة واختيار النوع "حضوري"</li>
                <li>• إذا كانت القاعة تابعة للمعهد بمدفوعات، سيُطلب الإيصال للقبول النهائي</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">الدلالات والحالة</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• بانتظار الموافقة: قيد مراجعة طلب الحجز المبدئي</li>
                <li>• بانتظار الدفع: تم قبول الحجز مبدئياً ويتطلب إيصال دفع</li>
                <li>• مرفوض: تم رفض الحجز، سيظهر السبب في خانة الحالة</li>
                <li>• مقبول: تم اعتماد الحجز ويمكنك استخدامه في الدورة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Submit Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد إلغاء الطلب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في إلغاء طلب حجز القاعة لدرس &ldquo;{selectedBooking?.sessions?.[0]?.topic || selectedBooking?.sessions?.[0]?.title || selectedBooking?.course?.title}&rdquo;؟
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelLoading}>
              تراجع
            </Button>
            <Button variant="destructive" onClick={confirmCancellation} disabled={cancelLoading}>
              {cancelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "تأكيد الإلغاء"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRejectionDialog(false)
          setSelectedBooking(null)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              سبب رفض الطلب
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 leading-relaxed bg-red-50 p-4 rounded-md border border-red-100">
              {selectedBooking?.rejectionReason || "لم يتم توفير سبب الرفض."}
            </p>
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Submit Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPaymentDialog(false)
          setSelectedBooking(null)
          setPaymentFile(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الدفع</DialogTitle>
            <DialogDescription>
              الرجاء إرفاق صورة إيصال الدفع للحجز. يجب أن يكون الإيصال واضحاً ومقروءاً.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 border-slate-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-slate-500" />
                  <p className="mb-2 text-sm text-slate-500">
                    <span className="font-semibold">انقر للرفع</span> أو اسحب الملف هنا
                  </p>
                  <p className="text-xs text-slate-500">JPEG, PNG, JPG</p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setPaymentFile(e.target.files[0])
                    }
                  }}
                />
              </label>
            </div>
            {paymentFile && (
              <div className="text-sm text-center text-blue-600 bg-blue-50 p-2 rounded">
                الملف المحدد: {paymentFile.name}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={paymentLoading}>
              إلغاء
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={paymentLoading || !paymentFile} className="bg-blue-600 hover:bg-blue-700">
              {paymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "تأكيد واستمرار"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={showViewPaymentDialog} onOpenChange={(open) => {
        if (!open) {
          setShowViewPaymentDialog(false)
          setSelectedBooking(null)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              تفاصيل الدفع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedBooking && selectedBooking.payments && selectedBooking.payments.length > 0 ? (
              selectedBooking.payments.map((payment: any, index: number) => (
                <div key={payment.id} className={`p-4 rounded-lg space-y-2 text-sm border ${index === 0 ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">المبلغ:</span>
                      {index === 0 ? (
                        <Badge variant="default" className="bg-blue-600 text-[10px] px-1.5 h-5">الأحدث</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5">سابق</Badge>
                      )}
                    </div>
                    <span className="font-bold text-lg">{payment.amount} {payment.currency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">الحالة:</span>
                    <Badge variant={payment.status === 'APPROVED' ? 'default' : payment.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {payment.status === 'APPROVED' ? 'مقبول' : payment.status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة'}
                    </Badge>
                  </div>
                  {payment.notes && (
                    <div className="mt-2 pt-2 border-t text-gray-600">
                      <span className="font-medium text-gray-700 block mb-1">الملاحظات:</span>
                      {payment.notes}
                    </div>
                  )}
                  {payment.depositSlipImage && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="font-medium text-gray-700 block mb-2">صورة الإيصال:</span>
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${payment.depositSlipImage}`}
                        alt="Deposit Slip"
                        className="max-w-full h-auto rounded-md border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  {(payment.rejectionReason || selectedBooking.rejectionReason) && (
                    <div className="mt-2 pt-2 border-t text-red-600 bg-red-50 p-2 rounded">
                      <span className="font-medium block mb-1">سبب الرفض:</span>
                      {payment.rejectionReason || selectedBooking.rejectionReason}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">لا توجد تفاصيل دفع متاحة</div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowViewPaymentDialog(false)}
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
