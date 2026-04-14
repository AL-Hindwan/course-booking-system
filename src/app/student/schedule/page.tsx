"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import { toast } from "sonner"
import { studentService } from "@/lib/student-service"

// ─── Constants ────────────────────────────────────────────────────────────────
function formatDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentSchedulePage() {
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(() => new Date())
    const [view, setView] = useState<'all' | 'upcoming'>('upcoming')
    const [selectedCourseId, setSelectedCourseId] = useState<string>("all")

    // ── Data ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        studentService.getSchedule()
            .then(data => setSessions(data))
            .catch(() => toast.error("حدث خطأ أثناء جلب الجدولة"))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 10_000)
        return () => clearInterval(t)
    }, [])

    // ── Course Options ────────────────────────────────────────────────────────
    const courseOptions = Array.from(
        new Map(sessions.map(s => [s.courseId, s.courseTitle])).entries()
    ).filter(([id]) => id !== null) as [string, string][]

    // ── Filtered sessions ─────────────────────────────────────────────────────
    const filteredSessions = sessions.filter(s => {
        const matchesCourse = selectedCourseId === "all" || s.courseId === selectedCourseId
        const isUpcoming = new Date(s.endTime).getTime() > now.getTime()
        return matchesCourse && (view === 'all' || isUpcoming)
    })

    // ── Grouping ──────────────────────────────────────────────────────────────
    const toLocalDateKey = (iso: string) => formatDateKey(new Date(iso))

    const sessionsByDate = filteredSessions.reduce((acc, s) => {
        const k = toLocalDateKey(s.startTime)
        if (!acc[k]) acc[k] = []
        acc[k].push(s)
        return acc
    }, {} as Record<string, any[]>)

    const sortedDates = Object.keys(sessionsByDate).sort()
    sortedDates.forEach(k => sessionsByDate[k].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()))

    const getEffectiveStatus = (s: any) => {
        if (s.status === 'cancelled') return 'cancelled'
        if (new Date(s.endTime).getTime() < now.getTime()) return 'completed'
        return s.status
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'scheduled': return { label: 'قادم', className: 'bg-blue-100 text-blue-700' }
            case 'completed': return { label: 'مكتمل', className: 'bg-green-100 text-green-700' }
            case 'cancelled': return { label: 'ملغي', className: 'bg-red-100 text-red-700' }
            case 'postponed': return { label: 'مؤجل', className: 'bg-amber-100 text-amber-700' }
            default: return { label: status, className: 'bg-gray-100 text-gray-700' }
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-500">جاري جلب جدولك...</p>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
            {/* ── Header Banner ── */}
            <div className="mb-8 rounded-2xl bg-gradient-to-l from-blue-700 to-indigo-600 p-6 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">جدولي</h1>
                        <p className="text-blue-100 text-sm">متابعة مواعيد دروسك القادمة</p>
                    </div>
                    {sessions.length > 0 && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm">
                            <CalendarIcon className="h-4 w-4 opacity-80" />
                            <span className="font-medium">{filteredSessions.length} جلسة</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── View Filter Pills ── */}
            <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">عرض الجلسات</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView("upcoming")}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            view === "upcoming"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                    >
                        الجلسات القادمة
                    </button>
                    <button
                        onClick={() => setView("all")}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            view === "all"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                    >
                        كل الجلسات (بما فيها المنتهية)
                    </button>
                </div>
            </div>

            {/* ── Course Filter Pills ── */}
            {courseOptions.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">فلترة حسب الدورة</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200" style={{ scrollbarWidth: 'thin' }}>
                        <button
                            onClick={() => setSelectedCourseId("all")}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                selectedCourseId === "all"
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                            }`}
                        >
                            جميع الدورات
                        </button>
                        {courseOptions.map(([id, title]) => (
                            <button
                                key={id}
                                onClick={() => setSelectedCourseId(id)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                    selectedCourseId === id
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filteredSessions.length === 0 ? (
                <Card className="bg-gray-50 border-dashed border-2">
                    <CardContent className="p-12 text-center">
                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {selectedCourseId === "all" ? "لا يوجد دروس مجدولة" : "لا توجد جلسات لهذه الدورة"}
                        </h3>
                        <p className="text-gray-500">
                            {selectedCourseId === "all" ? "لم تقم بالتسجيل في أي دروس أو ليس لديك دروس قادمة." : "جرّب اختيار دورة أخرى من القائمة أعلاه."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {sortedDates.map(dateStr => (
                        <div key={dateStr}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                {formatDate(new Date(dateStr + 'T00:00:00'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="grid gap-4">
                                {sessionsByDate[dateStr].map((session: any) => {
                                    const eff = getEffectiveStatus(session)
                                    return (
                                        <Card key={session.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex gap-4">
                                                        <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center border ${eff === 'completed' ? 'bg-green-50 border-green-100 text-green-600' : eff === 'cancelled' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                            <span className="text-sm font-bold">{formatTime(new Date(session.startTime))}</span>
                                                            <span className="text-xs opacity-60">إلى</span>
                                                            <span className="text-sm font-bold">{formatTime(new Date(session.endTime))}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="text-lg font-bold text-gray-900">{session.topic}</h4>
                                                                <Badge variant="secondary" className={getStatusConfig(eff).className}>{getStatusConfig(eff).label}</Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">{session.courseTitle}</p>
                                                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    {session.type === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                                                    <span className="truncate max-w-[200px]">{session.location}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Join Section */}
                                                    <div className="flex flex-col gap-2 min-w-[160px]">
                                                        {['scheduled', 'postponed'].includes(eff) && (
                                                            <>
                                                                {(session.type === 'online' || session.type === 'hybrid') ? (
                                                                    session.meetingLink ? (
                                                                        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                                                                            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                                                <Video className="h-4 w-4" />
                                                                                انضم للدرس
                                                                            </a>
                                                                        </Button>
                                                                    ) : (
                                                                        <div className="text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100 text-center text-xs flex items-center gap-1 justify-center">
                                                                            <AlertTriangle className="h-3 w-3" />
                                                                            <span>رابط الاجتماع لم يتوفر بعد</span>
                                                                        </div>
                                                                    )
                                                                ) : session.type === 'in_person' ? (
                                                                    <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-2 rounded-md justify-center border text-sm">
                                                                        <MapPin className="h-4 w-4" />
                                                                        <span className="truncate max-w-[120px]">{session.location}</span>
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        )}
                                                        {eff === 'completed' && (
                                                            <div className="flex items-center gap-2 text-green-600 justify-center font-medium">
                                                                <CheckCircle className="h-5 w-5" /><span className="text-sm">تم الانتهاء</span>
                                                            </div>
                                                        )}
                                                        {eff === 'cancelled' && (
                                                            <div className="flex items-center gap-2 text-red-600 justify-center font-medium">
                                                                <AlertTriangle className="h-5 w-5" /><span className="text-sm">ملغي</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
