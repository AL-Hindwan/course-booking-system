"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building, BookOpen, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ShieldCheck, ArrowUpRight, Activity, Eye } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { adminService, DashboardStats } from "@/lib/admin-service"
import { formatDate } from "@/lib/utils"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (err: any) {
      setError("فشل تحميل الإحصائيات")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (item: any) => {
    try {
      setActionLoading(true)
      if (item.type === 'trainer') {
        await adminService.approveTrainer(item.id)
      } else if (item.type === 'institute') {
        await adminService.approveInstitute(item.id)
      }
      // Reload stats to update list
      loadStats()
    } catch (err) {
      console.error(err)
      // Could add toast notification here
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectClick = (item: any) => {
    setSelectedRequest(item)
    setRejectionReason("")
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!selectedRequest) return

    try {
      setActionLoading(true)
      if (selectedRequest.type === 'trainer') {
        await adminService.rejectTrainer(selectedRequest.id, rejectionReason)
      } else if (selectedRequest.type === 'institute') {
        await adminService.rejectInstitute(selectedRequest.id, rejectionReason)
      }
      setRejectModalOpen(false)
      loadStats()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  if (!stats) {
    return <div className="p-8 text-center text-red-500">حدث خطأ أثناء تحميل البيانات</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
          <div className="space-y-3 text-center md:text-right max-w-2xl">
            <div>
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Badge variant="outline" className="text-blue-200 border-blue-200/20 bg-blue-500/10">Admin Portal</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                لوحة تحكم المدير
              </h1>
              <p className="text-gray-300 text-sm md:text-base opacity-90">
                نظرة شاملة على أداء المنصة. لديك <span className="font-bold text-white">{stats.stats.pendingApprovals} طلبات معلقة</span> تتطلب انتباهك.
              </p>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="hidden lg:flex gap-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[100px]">
              <div className="text-2xl font-bold mb-0.5">{stats.stats.totalUsers.toLocaleString('en-US')}</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase">مستخدم</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[100px]">
              <div className="text-2xl font-bold mb-0.5">{stats.stats.totalInstitutes}</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase">معهد</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[140px]">
              <div className="text-2xl font-bold mb-0.5">{stats.stats.totalRevenue.toLocaleString('en-US')}</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase">ريال يمني</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* Main Content */}
        <div className="space-y-6">

          {/* Pending Approvals */}
          <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-gray-100 rounded-xl">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100 py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                طلبات تنتظر الموافقة
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                {stats.stats.pendingApprovals} جديد
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-orange-50">
                {stats.pendingItems.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">لا توجد طلبات معلقة</div>
                ) : (
                  stats.pendingItems.map((item, index) => (
                    <div key={index} className="p-4 hover:bg-orange-50/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{item.title}</span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-gray-500">
                              {item.type === 'institute' ? 'معهد' : item.type === 'trainer' ? 'مدرب' : 'دورة'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{item.description}</p>
                          <p className="text-[10px] text-gray-400">{formatDate(new Date(item.date))}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={item.type === 'trainer' ? `/admin/trainers?view=${item.userId}` : item.type === 'institute' ? `/admin/institutes?view=${item.id}` : '#'}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              عرض
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={() => handleApprove(item)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            اعتماد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => handleRejectClick(item)}
                            disabled={actionLoading}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    </div>
                  )))}
              </div>
              <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                <Link href="/admin/verifications">
                  <Button variant="link" size="sm" className="text-orange-700 h-auto p-0">
                    عرض جميع الطلبات المعلقة
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-gray-100 rounded-xl">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <Activity className="h-4 w-4 text-blue-600" />
                سجل النشاطات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {stats.recentActivity.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">لا يوجد نشاط حديث</div>
                ) : (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.action.includes('فاشل') ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{activity.details}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(new Date(activity.time))}</p>
                      </div>
                    </div>
                  )))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}

      </div>

      {/* Rejection Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              تأكيد الرفض
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في رفض طلب "{selectedRequest?.title}"؟
              <br />
              يرجى توضيح سبب الرفض ليتم إرساله إلى مقدم الطلب.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="reason">سبب الرفض <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              placeholder="يرجى كتابة سبب الرفض هنا..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim() || actionLoading}
            >
              {actionLoading ? "جاري الرفض..." : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}