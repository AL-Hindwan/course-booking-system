"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, CheckCircle, XCircle, UserCheck, BookOpen, Trash2, Edit, AlertTriangle, Users, FileText } from "lucide-react"
import { formatDate, getFileUrl } from "@/lib/utils"
import { AdminPageHeader } from "@/components/admin/page-header"
import { adminService } from "@/lib/admin-service"

interface TrainerData {
  id: string
  userId: string
  bio: string | null
  cvUrl: string | null
  specialties: string[]
  certificatesUrls: string[]
  verificationStatus: string
  status: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  avatar: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    createdAt: string
    avatar: string | null
  }
}

import { useSearchParams } from "next/navigation"

export default function AdminTrainers() {
  const searchParams = useSearchParams()
  const viewId = searchParams.get('view')

  const [trainers, setTrainers] = useState<TrainerData[]>([])
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerData | null>(null)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'view' | 'approve' | 'reject' | 'edit' | null }>({
    open: false,
    type: null
  })
  const [actionReason, setActionReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [editForm, setEditForm] = useState<any>(null)

  useEffect(() => {
    loadTrainers()
  }, [])

  useEffect(() => {
    if (!loading && viewId && trainers.length > 0) {
      const trainer = trainers.find(t => t.id === viewId)
      if (trainer) {
        handleViewTrainer(trainer)
      }
    }
  }, [loading, trainers, viewId])

  const loadTrainers = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await adminService.getAllTrainers()
      setTrainers(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  const handleViewTrainer = (trainer: TrainerData) => {
    setSelectedTrainer(trainer)
    setActionDialog({ open: true, type: 'view' })
  }

  const handleEditTrainer = (trainer: TrainerData) => {
    setSelectedTrainer(trainer)
    setEditForm({
      name: trainer.name || trainer.user.name || "",
      email: trainer.email || trainer.user.email || "",
      phone: trainer.phone || trainer.user.phone || "",
      bio: trainer.bio || "",
      status: trainer.status || ""
    })
    setActionDialog({ open: true, type: 'edit' })
  }

  const handleApproveTrainer = (trainer: TrainerData) => {
    setSelectedTrainer(trainer)
    setActionDialog({ open: true, type: 'approve' })
  }

  const handleRejectTrainer = (trainer: TrainerData) => {
    setSelectedTrainer(trainer)
    setActionReason("")
    setActionDialog({ open: true, type: 'reject' })
  }

  const executeAction = async () => {
    if (!selectedTrainer) return

    try {
      setError("")
      setSuccess("")

      if (actionDialog.type === 'approve') {
        await adminService.approveTrainer(selectedTrainer.id)
        setSuccess("تم قبول المدرب بنجاح")
        loadTrainers()
      } else if (actionDialog.type === 'reject') {
        if (!actionReason || actionReason.trim() === "") {
          setError("يجب إدخال سبب الرفض")
          return
        }
        await adminService.rejectTrainer(selectedTrainer.id, actionReason)
        setSuccess("تم رفض المدرب")
        loadTrainers()
      } else if (actionDialog.type === 'edit') {
        await adminService.updateTrainer(selectedTrainer.id, editForm)
        setSuccess("تم تحديث بيانات المدرب بنجاح")
        loadTrainers()
      }

      setActionDialog({ open: false, type: null })
      setSelectedTrainer(null)
      setActionReason("")
      setEditForm(null)
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل تنفيذ العملية")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">معتمد</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">قيد المراجعة</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">مرفوض</Badge>
      case 'suspended': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">معلق</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="إدارة المدربين"
          description="مراجعة واعتماد طلبات المدربين الجدد وإدارة الحسابات الحالية"
        />
        <div className="flex items-center justify-center p-12">
          <p className="text-lg">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة المدربين"
        description="مراجعة واعتماد طلبات المدربين الجدد وإدارة الحسابات الحالية"
      />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدربين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainers.length}</div>
            <p className="text-xs text-muted-foreground">مدرب مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدربين النشطين</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainers.filter(t => t.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">حساب معتمد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد المراجعة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainers.filter(t => t.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">في انتظار الاعتماد</p>
          </CardContent>
        </Card>
      </div>

      {/* Trainers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المدربين</CardTitle>
        </CardHeader>
        <CardContent>
          {trainers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا يوجد مدربين مسجلين
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المدرب</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                          {trainer.avatar ? (
                            <img 
                              src={getFileUrl(trainer.avatar)} 
                              alt={trainer.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">
                              {(trainer.name || '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{trainer.name}</div>
                          <div className="text-sm text-gray-500">{trainer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trainer.phone || trainer.user?.phone || '-'}
                    </TableCell>
                    <TableCell>
                      {formatDate(new Date(trainer.createdAt || trainer.user?.createdAt))}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(trainer.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewTrainer(trainer)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditTrainer(trainer)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        {trainer.verificationStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveTrainer(trainer)}
                              className="bg-green-600 hover:bg-green-700 h-8"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              اعتماد
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectTrainer(trainer)}
                              className="h-8"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trainer Details Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'view'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل المدرب</DialogTitle>
          </DialogHeader>
          {selectedTrainer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {selectedTrainer.avatar ? (
                    <img 
                      src={getFileUrl(selectedTrainer.avatar)} 
                      alt={selectedTrainer.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                      {(selectedTrainer.name || '?').charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedTrainer.name}</h3>
                  <p className="text-gray-600">{selectedTrainer.email}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTrainer.phone || selectedTrainer.user.phone || 'لا يوجد رقم هاتف'}
                  </p>
                  <p className="text-sm text-gray-500">
                    انضم في {formatDate(new Date(selectedTrainer.createdAt || selectedTrainer.user.createdAt))}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedTrainer.status)}
                  </div>
                </div>
              </div>

              {selectedTrainer.bio && (
                <div>
                  <h4 className="font-semibold mb-2">النبذة:</h4>
                  <p className="text-gray-700">{selectedTrainer.bio}</p>
                </div>
              )}

              {selectedTrainer.specialties && selectedTrainer.specialties.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">التخصصات:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrainer.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTrainer.cvUrl && (
                <div>
                  <h4 className="font-semibold mb-2">السيرة الذاتية:</h4>
                  <a
                    href={getFileUrl(selectedTrainer.cvUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    عرض السيرة الذاتية
                  </a>
                </div>
              )}

              {selectedTrainer.certificatesUrls && selectedTrainer.certificatesUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">الشهادات ({selectedTrainer.certificatesUrls.length}):</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrainer.certificatesUrls.map((url, index) => (
                      <a
                        key={index}
                        href={getFileUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        شهادة {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setActionDialog({ open: false, type: null })} className="flex-1">
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Trainer Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'edit'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المدرب</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">النبذة</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null })}
            >
              إلغاء
            </Button>
            <Button onClick={executeAction} className="bg-blue-600 hover:bg-blue-700">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'approve'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>اعتماد المدرب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTrainer && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">هل ترغب في اعتماد حساب المدرب <strong>{selectedTrainer.name || selectedTrainer.user.name}</strong>؟</p>
                <p className="text-sm text-green-600 mt-2">سيتم تفعيل الحساب وتمكينه من إضافة الدورات.</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                إلغاء
              </Button>
              <Button onClick={executeAction} className="bg-green-600 hover:bg-green-700">
                تأكيد الاعتماد
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'reject'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>رفض المدرب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTrainer && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-800">هل أنت متأكد من رفض طلب انضمام المدرب <strong>{selectedTrainer.name || selectedTrainer.user.name}</strong>؟</p>
              </div>
            )}
            <div>
              <Label htmlFor="reject-reason">سبب الرفض</Label>
              <Textarea
                id="reject-reason"
                placeholder="اكتب سبب الرفض..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                إلغاء
              </Button>
              <Button onClick={executeAction} variant="destructive">
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}