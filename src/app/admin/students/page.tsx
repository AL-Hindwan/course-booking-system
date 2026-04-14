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
import { Eye, UserX, Users, BookOpen, Trash2, Edit } from "lucide-react"
import { User } from "@/types"
import { formatDate, getFileUrl } from "@/lib/utils"
import { AdminPageHeader } from "@/components/admin/page-header"
import { adminService } from "@/lib/admin-service"

export default function AdminStudents() {
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'view' | 'suspend' | 'delete' | 'edit' | null }>({
    open: false,
    type: null
  })
  const [deleteReason, setDeleteReason] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "student",
    status: "active",
    avatar: "",
    password: ""
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAllStudents()
      // Note: If adminService.getAllStudents doesn't support params, 
      // we might need to update it or add ?t=... here if it uses apiClient directly.
      setStudents(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل تحميل بيانات الطلاب")
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    (statusFilter === "all" || student.status === statusFilter) &&
    (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleViewStudent = (student: User) => {
    setSelectedStudent(student)
    setActionDialog({ open: true, type: 'view' })
  }

  const handleSuspendStudent = (student: User) => {
    setSelectedStudent(student)
    setSuspendReason("")
    setActionDialog({ open: true, type: 'suspend' })
  }

  const handleDeleteStudent = (student: User) => {
    setSelectedStudent(student)
    setDeleteReason("")
    setActionDialog({ open: true, type: 'delete' })
  }

  const handleEditStudent = (student: User) => {
    setSelectedStudent(student)
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      role: student.role as string,
      status: student.status || "active",
      avatar: student.avatar || "",
      password: ""
    })
    setActionDialog({ open: true, type: 'edit' })
  }

  const executeAction = async () => {
    if (!selectedStudent) return

    try {
      setError("")
      setSuccess("")

      if (actionDialog.type === 'delete') {
        if (deleteReason.length < 5) return;
        await adminService.deleteStudent(selectedStudent.id);
        setSuccess("تم حذف الطالب بنجاح");
      } else if (actionDialog.type === 'edit') {
        await adminService.updateStudent(selectedStudent.id, editForm);
        setSuccess("تم تحديث بيانات الطالب بنجاح");
      } else if (actionDialog.type === 'suspend') {
        if (!suspendReason) return;
        await adminService.suspendStudent(selectedStudent.id, suspendReason);
        setSuccess("تم تعليق حساب الطالب");
      }

      setActionDialog({ open: false, type: null })
      setSelectedStudent(null)
      loadStudents() // Reload data
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "فشل تنفيذ الإجراء")
    }
  }

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  // Mock data for enrollments since we don't have it in the user object yet
  const totalEnrollments = 0

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="إدارة الطلاب"
          description="مراجعة وإدارة الطلاب المسجلين في المنصة"
        />
        <div className="flex justify-center p-12">
          <p>جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة الطلاب"
        description="مراجعة وإدارة الطلاب المسجلين في المنصة"
      />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">{error}</CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-green-800">{success}</CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">طالب مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلاب النشطين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">تسجيل في دورات</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="البحث في الطلاب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    لا يوجد طلاب مطابقين للبحث
                  </TableCell>
                </TableRow>
              ) : filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {student.avatar ? (
                        <img
                          src={getFileUrl(student.avatar)}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(student.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                      {student.status === 'active' ? 'نشط' :
                        student.status === 'suspended' ? 'معلق' : student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewStudent(student)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(student.status === 'active') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspendStudent(student)}
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          تعليق
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student)}
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
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'view'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الطالب</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedStudent.avatar ? (
                    <img src={getFileUrl(selectedStudent.avatar)} alt={selectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.phone || "لا يوجد رقم هاتف"}
                  </p>
                  <p className="text-sm text-gray-500">
                    انضم في {formatDate(selectedStudent.createdAt)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                      {selectedStudent.status === 'active' ? 'نشط' : selectedStudent.status === 'suspended' ? 'معلق' : 'قيد المراجعة'}
                    </Badge>
                    <Badge variant="outline">{selectedStudent.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setActionDialog({ open: false, type: null })} className="flex-1">
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'suspend'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعليق الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedStudent && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p>هل أنت متأكد من تعليق حساب الطالب <strong>{selectedStudent.name}</strong>؟</p>
                <p className="text-sm text-gray-600 mt-2">سيتم منع الوصول إلى جميع الدورات والمحتوى.</p>
              </div>
            )}
            <div>
              <Label htmlFor="suspend-reason">سبب التعليق</Label>
              <Textarea
                id="suspend-reason"
                placeholder="سبب التعليق"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                إلغاء
              </Button>
              <Button onClick={executeAction} className="bg-red-600 hover:bg-red-700">
                تعليق الحساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'delete'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>حذف الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedStudent && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-red-600 font-medium">هل أنت متأكد من حذف حساب الطالب <strong>{selectedStudent.name}</strong>؟</p>
                  <p className="text-sm text-gray-600 mt-1">لا يمكن التراجع عن هذا الإجراء.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delete-reason" className="text-sm">سبب الحذف <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="delete-reason"
                    placeholder="يرجى كتابة سبب الحذف..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="bg-white"
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
              <Button
                onClick={executeAction}
                variant="destructive"
                disabled={deleteReason.length < 5}
              >
                حذف
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'edit'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">الاسم</Label>
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
              <Label htmlFor="edit-status">الحالة</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                إلغاء
              </Button>
              <Button onClick={executeAction}>
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}