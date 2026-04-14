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
import { Eye, CheckCircle, XCircle, Building, Clock, Trash2, Edit } from "lucide-react"
import { Institute } from "@/types"
import { formatDate, getFileUrl } from "@/lib/utils"

// ... (in component)


import { AdminPageHeader } from "@/components/admin/page-header"
import { adminService } from "@/lib/admin-service"

import { useSearchParams } from "next/navigation"

export default function AdminInstitutes() {
  const searchParams = useSearchParams()
  const viewId = searchParams.get('view')

  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'view' | 'approve' | 'suspend' | 'reactivate' | 'delete' | 'edit' | null }>({
    open: false,
    type: null
  })
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    address: "",
    website: "",
    logo: "",
    status: "pending",
    password: ""
  })
  const [suspendReason, setSuspendReason] = useState("")

  useEffect(() => {
    loadInstitutes()
  }, [])

  useEffect(() => {
    if (!loading && viewId && institutes.length > 0) {
      const institute = institutes.find(i => i.id === viewId)
      if (institute) {
        handleViewInstitute(institute)
      }
    }
  }, [loading, institutes, viewId])

  const loadInstitutes = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAllInstitutes()
      setInstitutes(data)
    } catch (err: any) {
      console.error(err)
      setError("فشل تحميل قائمة المعاهد")
    } finally {
      setLoading(false)
    }
  }

  const handleViewInstitute = (institute: Institute) => {
    setSelectedInstitute(institute)
    setActionDialog({ open: true, type: 'view' })
  }

  const handleApproveInstitute = (institute: Institute) => {
    setSelectedInstitute(institute)
    setActionDialog({ open: true, type: 'approve' })
  }

  const handleSuspendInstitute = (institute: Institute) => {
    setSelectedInstitute(institute)
    setActionDialog({ open: true, type: 'suspend' })
  }

  const handleReactivateInstitute = (institute: Institute) => {
    setSelectedInstitute(institute)
    setActionDialog({ open: true, type: 'reactivate' })
  }

  const handleDeleteInstitute = (institute: Institute) => {
    setSelectedInstitute(institute)
    setActionDialog({ open: true, type: 'delete' })
  }

  const handleEditInstitute = (institute: Institute) => {
    setSelectedInstitute(institute)
    setEditForm({
      name: institute.name || "",
      email: institute.email || "",
      phone: institute.phone || "",
      description: institute.description || "",
      address: institute.address || "",
      website: institute.website || "",
      logo: institute.logo || "",
      status: institute.status || "pending",
      password: ""
    })
    setActionDialog({ open: true, type: 'edit' })
  }

  const executeAction = async () => {
    if (!selectedInstitute) return

    try {
      if (actionDialog.type === 'approve') {
        await adminService.approveInstitute(selectedInstitute.id)
      } else if (actionDialog.type === 'suspend') {
        await adminService.suspendInstitute(selectedInstitute.id, suspendReason)
      } else if (actionDialog.type === 'reactivate') {
        await adminService.reactivateInstitute(selectedInstitute.id)
      } else if (actionDialog.type === 'delete') {
        await adminService.deleteInstitute(selectedInstitute.id)
      } else if (actionDialog.type === 'edit') {
        await adminService.updateInstitute(selectedInstitute.id, editForm)
      }

      await loadInstitutes()
      setActionDialog({ open: false, type: null })
      setSelectedInstitute(null)
      setSuspendReason("")
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (status: Institute['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">معتمد</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">معلق</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) return <div className="p-8 text-center">جاري تحميل المعاهد...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة المعاهد"
        description="مراجعة وإدارة المعاهد المسجلة في المنصة"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعاهد</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutes.length}</div>
            <p className="text-xs text-muted-foreground">معاهد مسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معاهد معتمدة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutes.filter(inst => inst.status === 'approved' || inst.verificationStatus === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">معاهد نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد المراجعة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutes.filter(inst => inst.status === 'pending' || inst.verificationStatus === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">طلبات جديدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Institutes Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المعاهد</CardTitle>
        </CardHeader>
        <CardContent>
          {institutes.length === 0 ? (
            <div className="text-center p-8 text-gray-500">لا توجد معاهد مسجلة</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعاهد</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutes.map((institute) => (
                  <TableRow key={institute.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {institute.logo ? (
                          <img
                            src={getFileUrl(institute.logo)}
                            alt={institute.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Building className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{institute.name}</div>
                          <div className="text-sm text-gray-500">{institute.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{institute.address || '-'}</div>
                    </TableCell>
                    <TableCell>
                      {formatDate(institute.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(institute.verificationStatus || institute.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewInstitute(institute)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditInstitute(institute)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(institute.status === 'pending' || institute.verificationStatus === 'pending') && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveInstitute(institute)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            اعتماد
                          </Button>
                        )}
                        {(institute.status === 'approved' || institute.verificationStatus === 'approved') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspendInstitute(institute)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            تعليق
                          </Button>
                        )}
                        {institute.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => handleReactivateInstitute(institute)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            إعادة تفعيل
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInstitute(institute)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'view' && 'تفاصيل المعهد'}
              {actionDialog.type === 'approve' && 'اعتماد المعهد'}
              {actionDialog.type === 'suspend' && 'تعليق المعهد'}
              {actionDialog.type === 'reactivate' && 'إعادة تفعيل المعهد'}
              {actionDialog.type === 'delete' && 'حذف المعهد'}
              {actionDialog.type === 'edit' && 'تعديل بيانات المعهد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInstitute && actionDialog.type === 'view' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {selectedInstitute.logo ? (
                    <img
                      src={getFileUrl(selectedInstitute.logo)}
                      alt={selectedInstitute.name}
                      className="w-20 h-20 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center border">
                      <Building className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedInstitute.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedInstitute.verificationStatus || selectedInstitute.status)}
                      <span className="text-sm text-gray-500">منذ {formatDate(selectedInstitute.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">البريد الإلكتروني</h4>
                    <p>{selectedInstitute.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">رقم الهاتف</h4>
                    <p dir="ltr" className="text-right">{selectedInstitute.phone || 'غير متوفر'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">الموقع الإلكتروني</h4>
                    {selectedInstitute.website ? (
                      <a href={selectedInstitute.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                        {selectedInstitute.website}
                      </a>
                    ) : (
                      <p>غير متوفر</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">العنوان</h4>
                    <p>{selectedInstitute.address || 'غير متوفر'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">نبذة عن المعهد</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg min-h-[80px]">
                    {selectedInstitute.description || 'لا يوجد وصف للمعهد.'}
                  </p>
                </div>

                {selectedInstitute.licenseDocumentUrl && (
                  <div>
                    <h4 className="font-semibold mb-2">وثائق الترخيص</h4>
                    <a
                      href={getFileUrl(selectedInstitute.licenseDocumentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-primary"
                    >
                      <img src="/icons/file.svg" alt="file" className="w-5 h-5" />
                      <span>عرض وثيقة الترخيص</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {selectedInstitute && actionDialog.type !== 'edit' && actionDialog.type !== 'view' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل المعهد:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>الاسم:</strong> {selectedInstitute.name}</p>
                  <p><strong>البريد:</strong> {selectedInstitute.email}</p>
                  <p><strong>الهاتف:</strong> {selectedInstitute.phone}</p>
                </div>
              </div>
            )}

            {actionDialog.type === 'suspend' && (
              <div>
                <Label htmlFor="suspend-reason">سبب التعليق</Label>
                <Textarea
                  id="suspend-reason"
                  placeholder="اكتب سبب تعليق المعهد..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
            )}

            {actionDialog.type === 'delete' && (
              <div className="text-red-600 text-sm">
                هل أنت متأكد من حذف هذا المعهد؟ لا يمكن التراجع عن هذا الإجراء.
              </div>
            )}

            {actionDialog.type === 'edit' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">اسم المعهد</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                  <Input
                    id="edit-email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-logo">رابط الشعار</Label>
                  <Input
                    id="edit-logo"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                    placeholder="https://example.com/logo.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">كلمة المرور الجديدة</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="اتركها فارغة إذا لم ترد التغيير"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">العنوان</Label>
                  <Input
                    id="edit-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-website">الموقع الإلكتروني</Label>
                  <Input
                    id="edit-website"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">الحالة</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                {actionDialog.type === 'view' ? 'إغلاق' : 'إلغاء'}
              </Button>
              {actionDialog.type !== 'view' && (
                <Button
                  onClick={executeAction}
                  variant={actionDialog.type === 'delete' ? "destructive" : "default"}
                >
                  {actionDialog.type === 'approve' && 'اعتماد المعهد'}
                  {actionDialog.type === 'suspend' && 'تعليق المعهد'}
                  {actionDialog.type === 'reactivate' && 'إعادة التفعيل'}
                  {actionDialog.type === 'delete' && 'حذف'}
                  {actionDialog.type === 'edit' && 'حفظ التغييرات'}
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}