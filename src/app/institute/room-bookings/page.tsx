"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, MapPin, Calendar, User, Loader2, Eye, BookOpen, Phone, Mail, DollarSign, Info, List } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import { instituteService } from "@/lib/institute-service"
import { toast } from "sonner"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

const DAY_LABELS: Record<string, string> = {
  SUNDAY: "الأحد",
  MONDAY: "الاثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  FRIDAY: "الجمعة",
  SATURDAY: "السبت",
}

const SESSION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "مجدولة", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "مكتملة", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ملغاة", className: "bg-red-100 text-red-800" },
  IN_PROGRESS: { label: "جارية", className: "bg-yellow-100 text-yellow-800" },
}

function formatArabicDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "d MMMM yyyy", { locale: ar })
  } catch {
    return dateStr
  }
}

function formatArabicDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return {
      date: format(d, "d MMMM yyyy", { locale: ar }),
      time: format(d, "hh:mm a", { locale: ar }),
    }
  } catch {
    return { date: dateStr, time: "" }
  }
}

export default function InstituteRoomBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "APPROVED" | "REJECTED" | null }>({
    open: false,
    type: null
  })
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; booking: any | null }>({
    open: false,
    booking: null
  })
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; booking: any | null }>({
    open: false,
    booking: null
  })
  const [notes, setNotes] = useState("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bookingsData, roomsData] = await Promise.all([
        instituteService.getRoomBookings(),
        instituteService.getHalls()
      ])
      setBookings(bookingsData)
      setRooms(roomsData)
    } catch (error) {
      toast.error("فشل في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApproveBooking = (booking: any) => {
    setSelectedBooking(booking)
    setActionDialog({ open: true, type: "APPROVED" })
    setSelectedRoom(booking.roomId)
  }

  const handleRejectBooking = (booking: any) => {
    setSelectedBooking(booking)
    setActionDialog({ open: true, type: "REJECTED" })
  }

  const executeAction = async () => {
    if (!selectedBooking || !actionDialog.type) return

    if (actionDialog.type === "APPROVED" && !selectedRoom) {
      toast.error("الرجاء تحديد قاعة")
      return
    }

    try {
      setActionLoading(true)
      await instituteService.updateRoomBookingStatus(selectedBooking.id, {
        status: actionDialog.type,
        notes: notes,
        roomId: actionDialog.type === "APPROVED" ? selectedRoom : undefined
      })

      toast.success(actionDialog.type === "APPROVED" ? "تم قبول الحجز بنجاح" : "تم رفض الحجز")

      setActionDialog({ open: false, type: null })
      setSelectedBooking(null)
      setNotes("")
      setSelectedRoom("")

      fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء تنفيذ الإجراء")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">مقبول</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>
      case "PENDING_APPROVAL":
        return <Badge className="bg-orange-100 text-orange-800">قيد المراجعة</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>
      case "PENDING_PAYMENT":
        return <Badge className="bg-blue-100 text-blue-800">في انتظار الدفع</Badge>
      case "CANCELLED":
        return <Badge className="bg-gray-100 text-gray-800">ملغى</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">طلبات حجز القاعات</h1>
        <p className="text-gray-600 mt-2">مراجعة وإدارة طلبات حجز قاعات المعهد</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الدورة</TableHead>
                <TableHead>الطلب بواسطة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>القاعة المقترحة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد طلبات حجز حالياً
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const { date, time } = formatArabicDateTime(booking.createdAt)
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.course?.title || "غير محدد"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {booking.requestedBy?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{time}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {booking.room?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(booking.status)}
                          {booking.payments && booking.payments.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPaymentDialog({ open: true, booking })}
                              className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1 ml-1" />
                              عرض الدفع
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {/* Details button — always visible */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailsDialog({ open: true, booking })}
                            className="w-full text-purple-700 border-purple-300 hover:bg-purple-50"
                          >
                            <List className="h-4 w-4 mr-1 ml-1" />
                            عرض تفاصيل الحجز
                          </Button>

                          {booking.status === "PENDING_APPROVAL" || booking.status === "PENDING_PAYMENT" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveBooking(booking)}
                                className="bg-green-600 hover:bg-green-700 w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-1 ml-1" />
                                قبول
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectBooking(booking)}
                                className="border-red-300 text-red-600 hover:bg-red-50 w-full"
                              >
                                <XCircle className="h-4 w-4 mr-1 ml-1" />
                                رفض
                              </Button>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {booking.status === "APPROVED" && booking.approvedBy && (
                                <span>بواسطة: {booking.approvedBy.name}</span>
                              )}
                              {(booking.notes || booking.rejectionReason) && (
                                <p className="mt-1 text-xs">{booking.notes || booking.rejectionReason}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ==================== Action Dialog (Approve / Reject) ==================== */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && !actionLoading && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "APPROVED" ? "قبول طلب الحجز" : "رفض طلب الحجز"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل الطلب:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>الدورة:</strong> {selectedBooking.course?.title || "غير محدد"}</p>
                  <p><strong>مقدم الطلب:</strong> {selectedBooking.requestedBy?.name}</p>
                  <p><strong>التاريخ:</strong> {formatDate(selectedBooking.startDate)} {selectedBooking.bookingMode === 'UNIFIED_TIME' ? `- ${formatDate(selectedBooking.endDate)}` : ''}</p>
                  <p><strong>الوقت:</strong> {formatTime(selectedBooking.defaultStartTime)} - {formatTime(selectedBooking.defaultEndTime)}</p>
                </div>
              </div>
            )}

            {actionDialog.type === "APPROVED" && (
              <div>
                <Label htmlFor="room-select">تأكيد / اختيار القاعة</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر قاعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">{actionDialog.type === "APPROVED" ? "ملاحظات إضافية (اختياري)" : "سبب الرفض"}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionDialog.type === "APPROVED" ? "اكتب ملاحظاتك..." : "اكتب سبب رفض الطلب..."}
                className="resize-none mt-1"
                rows={3}
                disabled={actionLoading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null })}
              disabled={actionLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={executeAction}
              className={actionDialog.type === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog.type === "APPROVED" ? "تأكيد القبول" : "تأكيد الرفض"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Payment Dialog ==================== */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => !open && setPaymentDialog({ open: false, booking: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الدفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {paymentDialog.booking && paymentDialog.booking.payments && paymentDialog.booking.payments.length > 0 ? (
              [...paymentDialog.booking.payments]
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((payment: any, index: number) => (
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
                    {payment.rejectionReason && (
                      <div className="mt-2 pt-2 border-t text-red-600 bg-red-50 p-2 rounded">
                        <span className="font-medium block mb-1">سبب الرفض:</span>
                        {payment.rejectionReason}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="text-center p-4 text-gray-500">لا توجد تفاصيل دفع متاحة</div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false, booking: null })}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Booking Details Dialog ==================== */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => !open && setDetailsDialog({ open: false, booking: null })}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="h-5 w-5 text-purple-600" />
              تفاصيل الحجز
            </DialogTitle>
          </DialogHeader>

          {detailsDialog.booking && (() => {
            const b = detailsDialog.booking
            return (
              <div className="space-y-6 py-2">

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">حالة الحجز</span>
                  {getStatusBadge(b.status)}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={<BookOpen className="h-4 w-4 text-purple-500" />} label="الدورة" value={b.course?.title || "حجز مباشر (بدون دورة)"} />
                  <InfoRow icon={<MapPin className="h-4 w-4 text-purple-500" />} label="القاعة" value={b.room?.name || "—"} />
                  <InfoRow icon={<User className="h-4 w-4 text-purple-500" />} label="مقدم الطلب" value={b.requestedBy?.name || "—"} />
                  <InfoRow icon={<Mail className="h-4 w-4 text-purple-500" />} label="البريد الإلكتروني" value={b.requestedBy?.email || "—"} />
                  {b.requestedBy?.phone && (
                    <InfoRow icon={<Phone className="h-4 w-4 text-purple-500" />} label="رقم الهاتف" value={b.requestedBy.phone} />
                  )}
                  <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="السعر الإجمالي" value={`${Number(b.totalPrice).toLocaleString()} ر.ي`} />
                </div>

                {/* Booking Period */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    نطاق الحجز
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 block">من</span>
                      <span className="font-medium">{formatArabicDate(b.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">إلى</span>
                      <span className="font-medium">{formatArabicDate(b.endDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">وقت البداية</span>
                      <span className="font-medium">{formatTime(b.defaultStartTime)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">وقت النهاية</span>
                      <span className="font-medium">{formatTime(b.defaultEndTime)}</span>
                    </div>
                  </div>
                  {b.selectedDays && b.selectedDays.length > 0 && (
                    <div>
                      <span className="text-gray-500 block mb-1 text-sm">الأيام المختارة</span>
                      <div className="flex flex-wrap gap-2">
                        {b.selectedDays.map((d: string) => (
                          <Badge key={d} variant="outline" className="bg-white">
                            {DAY_LABELS[d] || d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Purpose & Notes */}
                {(b.purpose || b.notes || b.rejectionReason) && (
                  <div className="space-y-2">
                    {b.purpose && (
                      <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">
                        <span className="font-semibold text-blue-700 block mb-1">الغرض من الحجز:</span>
                        <p className="text-blue-900">{b.purpose}</p>
                      </div>
                    )}
                    {b.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg text-sm border">
                        <span className="font-semibold text-gray-700 block mb-1">ملاحظات:</span>
                        <p className="text-gray-800">{b.notes}</p>
                      </div>
                    )}
                    {b.rejectionReason && (
                      <div className="bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                        <span className="font-semibold text-red-700 block mb-1">سبب الرفض:</span>
                        <p className="text-red-800">{b.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sessions Table */}
                <div>
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <List className="h-4 w-4 text-purple-600" />
                    الجلسات المحجوزة
                    {b.sessions && b.sessions.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 border-transparent">{b.sessions.length} جلسة</Badge>
                    )}
                  </h4>

                  {b.sessions && b.sessions.length > 0 ? (
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-right">#</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">من</TableHead>
                            <TableHead className="text-right">إلى</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            {b.sessions.some((s: any) => s.topic) && <TableHead className="text-right">الموضوع</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {b.sessions.map((session: any, idx: number) => {
                            const statusInfo = SESSION_STATUS_LABELS[session.status] ?? { label: session.status, className: "bg-gray-100 text-gray-700" }
                            return (
                              <TableRow key={session.id} className="hover:bg-slate-50">
                                <TableCell className="text-gray-500 text-sm">{idx + 1}</TableCell>
                                <TableCell className="text-sm font-medium">
                                  {formatArabicDate(session.startTime)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {format(new Date(session.startTime), "hh:mm a", { locale: ar })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {format(new Date(session.endTime), "hh:mm a", { locale: ar })}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-xs ${statusInfo.className} border-transparent`}>
                                    {statusInfo.label}
                                  </Badge>
                                </TableCell>
                                {b.sessions.some((s: any) => s.topic) && (
                                  <TableCell className="text-sm text-gray-600">{session.topic || "—"}</TableCell>
                                )}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-gray-400 text-sm">
                      لا توجد جلسات مسجلة لهذا الحجز حتى الآن
                    </div>
                  )}
                </div>

                {/* Created At */}
                <p className="text-xs text-gray-400 border-t pt-3">
                  تاريخ تقديم الطلب: {formatArabicDateTime(b.createdAt).date} — {formatArabicDateTime(b.createdAt).time}
                </p>
              </div>
            )
          })()}

          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setDetailsDialog({ open: false, booking: null })}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper component for info rows
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-xs text-gray-500 block">{label}</span>
        <span className="text-sm font-medium text-gray-800">{value}</span>
      </div>
    </div>
  )
}
