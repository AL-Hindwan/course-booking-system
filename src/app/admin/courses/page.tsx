"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, XCircle, BookOpen, Users, Trash2, Edit, Loader2, Calendar, DollarSign } from "lucide-react"
import { Course } from "@/types"
import { AdminPageHeader } from "@/components/admin/page-header"
import { adminService } from "@/lib/admin-service"
import { format } from "date-fns"
import { getFileUrl } from "@/lib/utils"

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewDialog, setViewDialog] = useState(false)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'delete' | 'edit' | null }>({
    open: false,
    type: null
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    price: 0,
    description: "",
    shortDescription: "",
    category: "",
    startDate: "",
    endDate: "",
    maxStudents: 0,
    status: "active",
    trainerId: "",
    image: ""
  })

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await adminService.getAllCourses()
      setCourses(data as Course[])
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل في جلب الدورات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const filteredCourses = courses.filter(course => {
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.trainer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  const handleSuspendCourse = async (courseId: string) => {
    try {
      await adminService.suspendCourse(courseId)
      await fetchCourses()
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل في تعليق الدورة")
    }
  }

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course)
    setActionDialog({ open: true, type: 'delete' })
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setEditForm({
      title: course.title,
      price: course.price,
      description: course.description,
      shortDescription: course.shortDescription || "",
      category: course.category,
      startDate: format(new Date(course.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(course.endDate), "yyyy-MM-dd"),
      maxStudents: course.maxStudents,
      status: course.status,
      trainerId: course.trainerId,
      image: course.image || ""
    })
    setActionDialog({ open: true, type: 'edit' })
  }

  const executeAction = async () => {
    if (!selectedCourse) return

    setActionLoading(true)
    try {
      if (actionDialog.type === 'delete') {
        await adminService.deleteCourse(selectedCourse.id)
      } else if (actionDialog.type === 'edit') {
        await adminService.updateCourse(selectedCourse.id, editForm)
      }
      await fetchCourses()
      setActionDialog({ open: false, type: null })
      setSelectedCourse(null)
    } catch (err: any) {
      setError(err?.response?.data?.message || "فشل في تنفيذ العملية")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">مسودة</Badge>
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">مكتمل</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>
      case 'rejected':
        return <Badge className="bg-orange-100 text-orange-800">مرفوض</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const uniqueCategories = Array.from(new Set(courses.map(course => course.category).filter(Boolean)))

  const totalCourses = courses.length
  const activeCourses = courses.filter(c => c.status === 'active').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الدورات...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة الدورات"
        description="مراجعة وإدارة جميع الدورات في المنصة"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">دورة مسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات النشطة</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCourses}</div>
            <p className="text-xs text-muted-foreground">دورة متاحة للتسجيل</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="البحث في الدورات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الدورات</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد دورات مطابقة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الدورة</TableHead>
                  <TableHead>المدرب</TableHead>
                  <TableHead>المعهد</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الطلاب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {course.image ? (
                          <img
                            src={getFileUrl(course.image)}
                            alt={course.title}
                            className="w-10 h-10 rounded object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border">
                            <BookOpen className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-gray-500">{new Intl.NumberFormat('en-US').format(course.price)} ريال يمني</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{course.trainer?.name || '-'}</TableCell>
                    <TableCell>{course.institute?.name || '-'}</TableCell>
                    <TableCell>
                      {course.category ? (
                        <Badge variant="outline">{course.category}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrolledStudents || 0}/{course.maxStudents}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedCourse(course); setViewDialog(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditCourse(course)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(course.status === 'active' || course.status === 'draft') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspendCourse(course.id)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            تعليق
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCourse(course)}
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

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={(open) => { if (!open) { setViewDialog(false); setSelectedCourse(null) } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الدورة</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              {selectedCourse.image && (
                <div className="w-full h-48 rounded-lg overflow-hidden border">
                  <img
                    src={getFileUrl(selectedCourse.image)}
                    alt={selectedCourse.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{selectedCourse.title}</h3>
                {getStatusBadge(selectedCourse.status)}
              </div>

              {selectedCourse.shortDescription && (
                <p className="text-sm text-muted-foreground">{selectedCourse.shortDescription}</p>
              )}

              {selectedCourse.description && (
                <div>
                  <Label className="text-sm font-medium">الوصف</Label>
                  <p className="text-sm mt-1 bg-gray-50 p-3 rounded-lg">{selectedCourse.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">السعر</p>
                    <p className="font-medium">{new Intl.NumberFormat('en-US').format(selectedCourse.price)} ريال يمني</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">الطلاب</p>
                    <p className="font-medium">{selectedCourse.enrolledStudents || 0} / {selectedCourse.maxStudents}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ البدء</p>
                    <p className="font-medium">{format(new Date(selectedCourse.startDate), 'yyyy-MM-dd')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
                    <p className="font-medium">{format(new Date(selectedCourse.endDate), 'yyyy-MM-dd')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">المدرب</p>
                  <p className="font-medium">{selectedCourse.trainer?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المعهد</p>
                  <p className="font-medium">{selectedCourse.institute?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الفئة</p>
                  <p className="font-medium">{selectedCourse.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المدة</p>
                  <p className="font-medium">{selectedCourse.duration} ساعة</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'delete'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>حذف الدورة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCourse && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-red-600">هل أنت متأكد من حذف الدورة <strong>{selectedCourse.title}</strong>؟</p>
                <p className="text-sm text-gray-600 mt-2">لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                إلغاء
              </Button>
              <Button onClick={executeAction} variant="destructive" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
                حذف
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'edit'} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الدورة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-title">عنوان الدورة</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-image">رابط الصورة</Label>
                <Input
                  id="edit-image"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  placeholder="images/courses/example.jpg"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">السعر</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">الفئة</Label>
                <Input
                  id="edit-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-shortDescription">وصف قصير</Label>
                <Input
                  id="edit-shortDescription"
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-description">الوصف الكامل</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-startDate">تاريخ البدء</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">تاريخ الانتهاء</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxStudents">الحد الأقصى للطلاب</Label>
                <Input
                  id="edit-maxStudents"
                  type="number"
                  value={editForm.maxStudents}
                  onChange={(e) => setEditForm({ ...editForm, maxStudents: Number(e.target.value) })}
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
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: null })}
              >
                إلغاء
              </Button>
              <Button onClick={executeAction} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}