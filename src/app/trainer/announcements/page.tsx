"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Send, MessageSquare, Clock, Pencil, Trash2, Loader2 } from "lucide-react"
import { Announcement } from "@/types"
import { formatDate } from "@/lib/utils"
import { trainerService } from "@/lib/trainer-service"
import { toast } from "sonner"

export default function TrainerAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    courseId: "",
    scheduledAt: "",
    selectedStudents: [] as string[]
  })

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      const [annsRes, coursesRes, studentsRes] = await Promise.all([
        trainerService.getAnnouncements().catch(() => []),
        trainerService.getCourses().catch(() => []),
        trainerService.getAllStudents()
      ])
      setAnnouncements(annsRes || [])
      setCourses(coursesRes || [])
      setStudents(studentsRes?.students || [])
    } catch (error) {
      if (!isSilent) {
        console.error("Fetch error:", error)
        toast.error("حدث خطأ أثناء جلب البيانات")
      }
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Silent background poll every 60 seconds
    const interval = setInterval(() => fetchData(true), 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      courseId: "",
      scheduledAt: "",
      selectedStudents: []
    })
    setEditingId(null)
  }

  const getCourseStudents = (courseId: string) => {
    if (!courseId || courseId === 'all') return []
    return students.filter(s => s.enrollments?.some((e: any) => e.courseId === courseId))
  }

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("يرجى إكمال الحقول المطلوبة")
      return
    }

    try {
      setSubmitting(true)
      
      const payload: any = {
        title: formData.title,
        message: formData.message,
        courseId: formData.courseId === 'all' ? undefined : formData.courseId,
        status: formData.scheduledAt ? 'SCHEDULED' : 'SENT',
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
      }

      // If specific students are selected, we handle broadcasting
      if (editingId) {
        await trainerService.updateAnnouncement(editingId, {
          title: formData.title,
          message: formData.message,
        })
        toast.success("تم تحديث الإعلان")
      } else {
        if (formData.selectedStudents.length > 0) {
            // Multi-recipient logic
            if (formData.selectedStudents.length === 1) {
                await trainerService.sendStudentAnnouncement({ ...payload, recipientId: formData.selectedStudents[0] })
            } else {
                let successCount = 0
                for (const sId of formData.selectedStudents) {
                    try {
                        await trainerService.sendStudentAnnouncement({ ...payload, recipientId: sId })
                        successCount++
                    } catch (e) {
                        console.error(`Failed to send to ${sId}`, e)
                    }
                }
                const isScheduled = !!formData.scheduledAt;
                toast.success(isScheduled ? `تمت جدولة ${successCount} إعلانات بنجاح` : `تم إرسال ${successCount} إعلانات بنجاح`)
            }
        } else {
            // Send to whole course (or all my students if courseId is 'all')
            const isScheduled = !!formData.scheduledAt;
            toast.success(isScheduled ? "تمت جدولة الإعلان بنجاح" : "تم إرسال الإعلان بنجاح")
        }
      }

      resetForm()
      setIsCreateDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "فشل في حفظ الإعلان")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      courseId: announcement.courseId || "all",
      scheduledAt: announcement.scheduledAt ? new Date(announcement.scheduledAt).toISOString().slice(0, 16) : "",
      selectedStudents: announcement.recipientId ? [announcement.recipientId] : []
    })
    setIsCreateDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setAnnouncementToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (announcementToDelete) {
      try {
        setSubmitting(true)
        await trainerService.deleteAnnouncement(announcementToDelete)
        toast.success("تم الحذف بنجاح")
        setIsDeleteDialogOpen(false)
        setAnnouncementToDelete(null)
        fetchData()
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "فشل حذف الإعلان")
      } finally {
        setSubmitting(false)
      }
    }
  }

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || "جميع طلابي"
  }

  const toggleStudentSelection = (studentId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedStudents.includes(studentId)
      return {
        ...prev,
        selectedStudents: isSelected
          ? prev.selectedStudents.filter(id => id !== studentId)
          : [...prev.selectedStudents, studentId]
      }
    })
  }

  const toggleAllStudents = () => {
    const courseStudents = getCourseStudents(formData.courseId)
    const studentIds = courseStudents.map(s => s.id)
    
    if (formData.selectedStudents.length === studentIds.length && studentIds.length > 0) {
      setFormData(prev => ({ ...prev, selectedStudents: [] }))
    } else {
      setFormData(prev => ({ ...prev, selectedStudents: studentIds }))
    }
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإعلانات والتواصل</h1>
          <p className="text-gray-600 mt-2">إرسال إعلانات وتواصل مع طلاب دوراتك</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إعلان جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">{editingId ? "تعديل الإعلان" : "إنشاء إعلان جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-right">
              <div>
                <Label htmlFor="title" className="block mb-1">عنوان الإعلان</Label>
                <Input
                  id="title"
                  className="text-right"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان الإعلان"
                />
              </div>

              <div>
                <Label htmlFor="course" className="block mb-1">الدورة المستهدفة</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value, selectedStudents: [] })}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر الدورة" />
                  </SelectTrigger>
                  <SelectContent className="text-right max-h-[300px]">
                    <SelectItem value="all">جميع طلابي</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.courseId && formData.courseId !== 'all' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-primary">تحديد طلاب من الدورة (اختياري)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 text-primary hover:text-primary/80"
                      onClick={toggleAllStudents}
                    >
                      {formData.selectedStudents.length === getCourseStudents(formData.courseId).length && getCourseStudents(formData.courseId).length > 0 ? "إلغاء الكل" : "تحديد الكل"}
                    </Button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {getCourseStudents(formData.courseId).length > 0 ? (
                      getCourseStudents(formData.courseId).map(student => (
                        <div key={student.id} className="flex items-center space-x-2 space-x-reverse hover:bg-white p-2 rounded transition-colors border border-transparent hover:border-gray-200">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={formData.selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                          <Label htmlFor={`student-${student.id}`} className="text-sm font-normal cursor-pointer flex-1 text-right">
                            {student.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-2">لا يوجد طلاب مسجلين في هذه الدورة حالياً</p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic text-right">
                    * اتركه فارغاً للإرسال لجميع طلاب الدورة تلقائياً.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="message" className="block mb-1">نص الإعلان</Label>
                <Textarea
                  id="message"
                  className="text-right"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="اكتب نص الإعلان..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="scheduledAt" className="block mb-1">جدولة الإرسال (اختياري)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  className="text-right"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>

              <Button onClick={handleCreateAnnouncement} className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
                {editingId ? "تحديث الإعلان" : "إرسال الإعلان"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-muted-foreground">إعلانات مرسلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإعلانات المرسلة</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter(a => a.status?.toUpperCase() === 'SENT').length}
            </div>
            <p className="text-xs text-muted-foreground">تم الإرسال</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجدولة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter(a => a.status?.toUpperCase() === 'SCHEDULED').length}
            </div>
            <p className="text-xs text-muted-foreground">في انتظار الإرسال</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">قائمة الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الإعلان</TableHead>
                  <TableHead className="text-right">الدورة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">حالة الإرسال</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{announcement.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{announcement.message}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {getCourseTitle(announcement.courseId || "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(announcement.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {announcement.status?.toUpperCase() === 'SENT' ? (
                          <Badge className="bg-green-100 text-green-800 border-none">مرسل</Badge>
                        ) : announcement.status?.toUpperCase() === 'SCHEDULED' ? (
                          <Badge className="bg-blue-100 text-blue-800 border-none">مجدول</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-none">مسودة</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-start">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(announcement)}>
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(announcement.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      لا توجد إعلانات حالياً
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من رغبتك في حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 justify-start flex-row-reverse">
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}