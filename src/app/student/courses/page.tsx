"use client"

import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BookOpen, Heart, Loader2, Search, Users, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trainerService, ExploreCourse } from "@/lib/trainer-service"
import { studentService } from "@/lib/student-service"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const sortOptions = ["الأحدث", "الأقدم", "الأعلى سعراً", "الأقل سعراً"]
const priceOptions = [
  "كل الأسعار",
  "أقل من 25,000 ر.ي",
  "25,000 - 50,000 ر.ي",
  "50,000 - 100,000 ر.ي",
  "أعلى من 100,000 ر.ي",
]

function resolveImage(src: string | null): string {
  if (!src) return "/images/course-web.png"
  if (src.startsWith("http")) return src
  const cleanSrc = src.replace(/\\/g, "/")
  const separator = cleanSrc.startsWith("/") ? "" : "/"
  return `${API_BASE}${separator}${cleanSrc}`
}

interface StudentCoursesPageProps {
  basePath?: string
}

export default function StudentCoursesPage(props: StudentCoursesPageProps) {
  const basePath = props.basePath ?? "/student/explore/course"
  const { user } = useAuth() ?? {}
  const [courses, setCourses] = useState<ExploreCourse[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: "all", name: "الكل" }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("الكل")
  const [selectedSort, setSelectedSort] = useState("الأحدث")
  const [selectedPrice, setSelectedPrice] = useState("كل الأسعار")
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    trainerService
      .getExploreCourses()
      .then((data) => {
        setCourses(data.courses)
        setCategories(data.categories)
      })
      .catch(() => setError("فشل تحميل الدورات. يرجى المحاولة مرة أخرى."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      studentService.getWishlist()
        .then((data) => {
          setFavoriteIds(data.map((item: any) => item.id))
        })
        .catch(() => { })
    } else {
      setFavoriteIds([])
    }
  }, [user?.id])

  const formatPrice = (value: number) =>
    `${new Intl.NumberFormat("en-US").format(value)} ر.ي`

  const toggleFavorite = async (id: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!user?.id) {
      toast.error("يرجى تسجيل الدخول لإضافة الدورة إلى قائمة الرغبات")
      return
    }

    try {
      const result = await studentService.toggleWishlist(id)
      setFavoriteIds((prev) =>
        result.added ? [...prev, id] : prev.filter((item) => item !== id)
      )
      if (result.added) {
        toast.success("تم إضافة الدورة إلى قائمة الرغبات")
      } else {
        toast.success("تم إزالة الدورة من قائمة الرغبات")
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث قائمة الرغبات")
    }
  }

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesSearch =
        query.length === 0 ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)

      const matchesCategory =
        selectedCategory === "الكل" || course.category === selectedCategory

      const matchesPrice =
        selectedPrice === "كل الأسعار" ||
        (selectedPrice === "أقل من 25,000 ر.ي" && course.price < 25000) ||
        (selectedPrice === "25,000 - 50,000 ر.ي" && course.price >= 25000 && course.price <= 50000) ||
        (selectedPrice === "50,000 - 100,000 ر.ي" && course.price >= 50000 && course.price <= 100000) ||
        (selectedPrice === "أعلى من 100,000 ر.ي" && course.price > 100000)

      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [courses, searchQuery, selectedCategory, selectedPrice])

  const visibleCourses = useMemo(() => {
    const sorted = [...filteredCourses]
    if (selectedSort === "الأحدث") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (selectedSort === "الأقدم") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (selectedSort === "الأعلى سعراً") {
      sorted.sort((a, b) => b.price - a.price)
    } else if (selectedSort === "الأقل سعراً") {
      sorted.sort((a, b) => a.price - b.price)
    }
    return sorted
  }, [filteredCourses, selectedSort])

  return (
    <section dir="rtl" className="w-full text-right">
      <div className="w-full max-w-[1200px] mr-0 ml-auto text-right">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-right leading-tight mb-1">
          استكشف الدورات التدريبية
        </h1>
      </div>

      <div className="w-full max-w-[1200px] mr-0 ml-auto mt-2 space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-start gap-3 text-right border-b border-slate-100 dark:border-border pb-2">
          <div className="relative flex-1 min-w-[260px] max-w-[520px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث عن دورة أو مهارة..."
              className="h-11 rounded-full bg-white dark:bg-muted pr-4 pl-10 text-sm text-right"
            />
          </div>

          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="الأحدث" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="كل الفئات" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPrice} onValueChange={setSelectedPrice}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="كل الأسعار" />
            </SelectTrigger>
            <SelectContent>
              {priceOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!loading && (
            <span className="text-sm text-slate-500 whitespace-nowrap text-right ml-auto flex-shrink-0">
              تم العثور على{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{visibleCourses.length}</span>{" "}
              دورة
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="h-7 w-7 animate-spin" />
            <span className="text-lg">جاري تحميل الدورات...</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
            <AlertCircle className="h-10 w-10" />
            <p>{error}</p>
            <Button variant="outline" onClick={fetchData}>إعادة المحاولة</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <BookOpen className="h-12 w-12" />
            <p className="text-lg">{searchQuery || selectedCategory !== "الكل" ? "لا توجد نتائج تطابق بحثك" : "لا توجد دورات نشطة حالياً"}</p>
          </div>
        )}

        {/* Course grid */}
        {!loading && !error && visibleCourses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-items-end">
            {visibleCourses.map((course) => (
              <div
                key={course.id}
                dir="rtl"
                className="w-full rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] text-right flex items-start gap-5 hover:shadow-md transition-shadow"
              >
                <div className="relative h-[200px] w-[200px] shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={resolveImage(course.image)}
                    alt={course.title}
                    fill
                    sizes="200px"
                    className="h-full w-full object-cover"
                    unoptimized={true}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/course-web.png" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(course.id, e)}
                    aria-label="إضافة إلى المفضلة"
                    className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm ring-1 ring-slate-200/60 transition-transform duration-150 ${favoriteIds.includes(course.id) ? "text-red-600 scale-105" : "hover:text-red-600"
                      }`}
                  >
                    <Heart className={`h-4 w-4 transition-opacity ${favoriteIds.includes(course.id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <div className="flex flex-1 min-w-0 flex-col text-right h-[200px]">
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-muted px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {course.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {course.shortDescription || course.description}
                    </p>
                  </div>

                  {/* Trainer(s) */}
                  {(course as any).staffTrainers?.length > 1 ? (
                    <div className="mt-2 space-y-1">
                      <span className="text-xs text-slate-400">المدربون:</span>
                      <div className="flex flex-wrap gap-1">
                        {(course as any).staffTrainers.map((t: any, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                          >
                            <span className="h-4 w-4 rounded-full bg-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-800 shrink-0">
                              {t.name.charAt(0)}
                            </span>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative h-6 w-6 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center">
                        {course.trainer.avatar ? (
                          <Image
                            src={resolveImage(course.trainer.avatar)}
                            alt={course.trainer.name}
                            fill
                            sizes="24px"
                            className="object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">{course.trainer.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{course.trainer.name}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.studentsCount} طالب
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.sessionsCount} درس
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className="mt-auto flex w-full flex-wrap items-center justify-start gap-2 pt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                      {course.price === 0 ? "مجاني" : formatPrice(course.price)}
                    </span>
                    <Button
                      asChild
                      className="h-9 rounded-full bg-blue-600 px-5 text-sm text-white hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Link href={`${basePath}/${course.id}`}>
                        <span>عرض التفاصيل</span>
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
