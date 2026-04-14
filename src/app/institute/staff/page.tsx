"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Mail, UserCheck, Users, Loader2, Phone, ToggleLeft, Trash2, MoreVertical, Pencil } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { instituteService } from "@/lib/institute-service"

interface StaffMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  bio: string | null
  specialties: string[]
  status: "ACTIVE" | "INACTIVE"
  joinedAt: string
  notes: string | null
}

interface StaffForm {
  name: string
  email: string
  phone: string
  bio: string
  notes: string
}

const emptyForm: StaffForm = { name: "", email: "", phone: "", bio: "", notes: "" }

export default function InstituteStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<StaffForm>(emptyForm)

  // Edit dialog
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StaffForm>(emptyForm)

  // Delete / action
  const [confirmDelete, setConfirmDelete] = useState<StaffMember | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadStaff = () => {
    setLoading(true)
    setError(null)
    instituteService.getStaff()
      .then((data) => setStaff(data as StaffMember[]))
      .catch(() => setError("فشل تحميل بيانات الطاقم"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStaff() }, [])

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.name) return
    setAddLoading(true)
    setAddError(null)
    try {
      await instituteService.addStaff({
        name: addForm.name,
        email: addForm.email || undefined,
        phone: addForm.phone || undefined,
        bio: addForm.bio || undefined,
        notes: addForm.notes || undefined,
      })
      setIsAddOpen(false)
      setAddForm(emptyForm)
      loadStaff()
    } catch (e: any) {
      setAddError(e?.response?.data?.message || "فشل إضافة المدرب")
    } finally {
      setAddLoading(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (member: StaffMember) => {
    setEditTarget(member)
    setEditForm({
      name: member.name,
      email: member.email ?? "",
      phone: member.phone ?? "",
      bio: member.bio ?? "",
      notes: member.notes ?? "",
    })
    setEditError(null)
  }

  const handleUpdate = async () => {
    if (!editTarget || !editForm.name) return
    setEditLoading(true)
    setEditError(null)
    try {
      const updated: StaffMember = await instituteService.updateStaff(editTarget.id, {
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        bio: editForm.bio || null,
        notes: editForm.notes || null,
      })
      setStaff(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...updated } : s))
      setEditTarget(null)
    } catch (e: any) {
      setEditError(e?.response?.data?.message || "فشل تحديث بيانات المدرب")
    } finally {
      setEditLoading(false)
    }
  }

  // ── Status toggle ─────────────────────────────────────────────────────────
  const handleToggleStatus = async (member: StaffMember) => {
    setActionLoading(member.id)
    const newStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await instituteService.updateStaffStatus(member.id, newStatus)
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, status: newStatus } : s))
    } catch {
      loadStaff()
    } finally {
      setActionLoading(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (member: StaffMember) => {
    setActionLoading(member.id)
    try {
      await instituteService.removeStaff(member.id)
      setStaff(prev => prev.filter(s => s.id !== member.id))
    } catch {
      loadStaff()
    } finally {
      setConfirmDelete(null)
      setActionLoading(null)
    }
  }

  const activeCount = staff.filter(s => s.status === "ACTIVE").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">كشف المدربين</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">إضافة وإدارة مدربي المعهد</p>
        </div>
        <Button onClick={() => { setAddError(null); setIsAddOpen(true) }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مدرب
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدربين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : staff.length}</div>
            <p className="text-xs text-muted-foreground">مدرب مسجّل</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">النشطون</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : activeCount}</div>
            <p className="text-xs text-muted-foreground">مدرب نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">غير النشطون</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : staff.length - activeCount}</div>
            <p className="text-xs text-muted-foreground">مدرب غير نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>قائمة المدربين</CardTitle>
            {!loading && (
              <Badge variant="secondary" className="font-mono">{staff.length} مدرب</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin ml-2" />
              <span>جاري تحميل المدربين...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadStaff}>إعادة المحاولة</Button>
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <Users className="h-10 w-10" />
              <p>لم يتم إضافة أي مدربين بعد</p>
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 ml-1" /> إضافة أول مدرب
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المدرب</TableHead>
                  <TableHead>معلومات الاتصال</TableHead>
                  <TableHead>نبذة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id} className={member.status === "INACTIVE" ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{member.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                        {member.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />{member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />{member.phone}
                          </div>
                        )}
                        {!member.email && !member.phone && (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                      {member.bio ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        member.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }>
                        {member.status === "ACTIVE" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === member.id}>
                            {actionLoading === member.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(member)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                            <ToggleLeft className="h-4 w-4 ml-2" />
                            {member.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setConfirmDelete(member)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف من الكشف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Add Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مدرب</DialogTitle>
            <DialogDescription>أدخل بيانات المدرب لإضافته إلى كشف مدربي المعهد</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="add-name">الاسم الكامل *</Label>
              <Input id="add-name" placeholder="اسم المدرب" value={addForm.name}
                onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="add-email">البريد الإلكتروني (اختياري)</Label>
              <Input id="add-email" type="email" placeholder="trainer@example.com" value={addForm.email}
                onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="add-phone">رقم الهاتف (اختياري)</Label>
              <Input id="add-phone" type="tel" placeholder="مثال: 777123456" value={addForm.phone}
                onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="add-bio">نبذة تعريفية (اختياري)</Label>
              <Textarea id="add-bio" placeholder="خبراته وتخصصاته..." value={addForm.bio} rows={2}
                onChange={(e) => setAddForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="add-notes">ملاحظات (اختياري)</Label>
              <Textarea id="add-notes" placeholder="أي ملاحظات إضافية..." value={addForm.notes} rows={2}
                onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {addError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">{addError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={addLoading}>إلغاء</Button>
              <Button onClick={handleAdd} disabled={addLoading || !addForm.name}>
                {addLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-1" />جاري الإضافة...</> : "إضافة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المدرب</DialogTitle>
            <DialogDescription>عدّل بيانات {editTarget?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="edit-name">الاسم الكامل *</Label>
              <Input id="edit-name" placeholder="اسم المدرب" value={editForm.name}
                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-email">البريد الإلكتروني (اختياري)</Label>
              <Input id="edit-email" type="email" placeholder="trainer@example.com" value={editForm.email}
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-phone">رقم الهاتف (اختياري)</Label>
              <Input id="edit-phone" type="tel" placeholder="مثال: 777123456" value={editForm.phone}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-bio">نبذة تعريفية (اختياري)</Label>
              <Textarea id="edit-bio" placeholder="خبراته وتخصصاته..." value={editForm.bio} rows={2}
                onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-notes">ملاحظات (اختياري)</Label>
              <Textarea id="edit-notes" placeholder="أي ملاحظات إضافية..." value={editForm.notes} rows={2}
                onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {editError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">{editError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editLoading}>إلغاء</Button>
              <Button onClick={handleUpdate} disabled={editLoading || !editForm.name}>
                {editLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-1" />جاري الحفظ...</> : "حفظ التعديلات"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف مدرب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف <strong>{confirmDelete?.name}</strong> من كشف مدربي المعهد؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>إلغاء</Button>
            <Button variant="destructive" disabled={!!actionLoading}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "نعم، حذف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
