"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, AlertCircle, Loader2 } from "lucide-react"
import { CourseCard } from "@/components/course-card"
import { trainerService, ExploreCourse } from "@/lib/trainer-service"
import { studentService } from "@/lib/student-service"
import { useAuth } from "@/contexts/auth-context"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function resolveImage(src: string | null): string {
  if (!src) return "/images/course-web.png"
  if (src.startsWith("http")) return src
  const cleanSrc = src.replace(/\\/g, "/")
  const separator = cleanSrc.startsWith("/") ? "" : "/"
  return `${API_BASE}${separator}${cleanSrc}`
}

const deliveryTypesMap: Record<string, string> = {
  "أونلاين": "online",
  "حضوري": "in_person",
  "حضور وأونلاين": "hybrid"
}

const deliveryTypes = ["أونلاين", "حضوري", "حضور وأونلاين"]

interface CoursesPageProps {
  basePath?: string
}

export default function CoursesPage({ basePath = "/courses" }: CoursesPageProps) {
  const [courses, setCourses] = useState<ExploreCourse[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: "all", name: "جميع الفئات" }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("جميع الفئات")
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [sortBy, setSortBy] = useState("newest")

  const { user } = useAuth() ?? {}
  const [wishlistIds, setWishlistIds] = useState<string[]>([])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    trainerService
      .getExploreCourses()
      .then((data) => {
        setCourses(data.courses)
        setCategories(
          // Replace 'الكل' from API with 'جميع الفئات' to match existing UI
          data.categories.map(c => c.id === 'all' ? { ...c, name: "جميع الفئات" } : c)
        )
      })
      .catch((err) => {
        console.error("Failed to load courses:", err)
        setError("فشل تحميل الدورات. يرجى المحاولة مرة أخرى.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      studentService.getWishlist()
        .then((data) => {
          setWishlistIds(data.map((item: any) => item.id))
        })
        .catch(() => { })
    } else {
      setWishlistIds([])
    }
  }, [user?.id])

  const toggleDeliveryType = (typeLabel: string) => {
    const typeValue = deliveryTypesMap[typeLabel]
    if (selectedDeliveryTypes.includes(typeValue)) {
      setSelectedDeliveryTypes(selectedDeliveryTypes.filter(t => t !== typeValue))
    } else {
      setSelectedDeliveryTypes([...selectedDeliveryTypes, typeValue])
    }
  }

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return courses.filter(course => {
      const matchesSearch = query.length === 0 ||
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)

      const matchesCategory = selectedCategory === "جميع الفئات" || course.category === selectedCategory

      const matchesDelivery = selectedDeliveryTypes.length === 0 || selectedDeliveryTypes.includes(course.deliveryType)

      const matchesPrice = course.price >= priceRange[0] && course.price <= priceRange[1]

      return matchesSearch && matchesCategory && matchesDelivery && matchesPrice
    })
  }, [courses, searchQuery, selectedCategory, selectedDeliveryTypes, priceRange])

  const visibleCourses = useMemo(() => {
    const sorted = [...filteredCourses]
    if (sortBy === "price-low") {
      sorted.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      sorted.sort((a, b) => b.price - a.price)
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return sorted
  }, [filteredCourses, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-muted/30 py-12 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">استكشف الدورات التدريبية</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            تصفح مئات الدورات التدريبية في مختلف المجالات واكتسب مهارات جديدة
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4 space-y-6">
            <div className="glass-card p-6 rounded-xl sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">تصفية النتائج</h2>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 bg-white/50"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">الفئة</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <button
                        onClick={() => setSelectedCategory(category.name)}
                        className={`text-sm hover:text-primary transition-colors ${selectedCategory === category.name ? "text-primary font-bold" : "text-muted-foreground"
                          }`}
                      >
                        {category.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Type */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">نوع الحضور</h3>
                <div className="space-y-2">
                  {deliveryTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={type}
                        checked={selectedDeliveryTypes.includes(type)}
                        onCheckedChange={() => toggleDeliveryType(type)}
                      />
                      <label htmlFor={type} className="text-sm cursor-pointer select-none">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3">السعر</h3>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100000}
                  min={0}
                  step={50}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0]} ريال</span>
                  <span>{priceRange[1]} ريال</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                تم العثور على <span className="font-bold text-foreground">{visibleCourses.length}</span> دورة
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white/50">
                  <SelectValue placeholder="الترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="price-low">السعر: الأقل</SelectItem>
                  <SelectItem value="price-high">السعر: الأعلى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading && (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-lg">جاري تحميل الدورات...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
              <AlertCircle className="h-10 w-10" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchData}>إعادة المحاولة</Button>
            </div>
          )}

          {!loading && !error && visibleCourses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 text-center">
              <p className="text-lg">
                {searchQuery || selectedCategory !== "جميع الفئات"
                  ? "لا توجد نتائج تطابق بحثك"
                  : "لا توجد دورات نشطة حالياً"}
              </p>
            </div>
          )}

          {!loading && !error && visibleCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.shortDescription || course.description}
                  level="عام" // Using a generic fallback for visually completing the design card
                  price={course.price}
                  studentsCount={course.studentsCount}
                  duration={String(course.duration)}
                  image={resolveImage(course.image)}
                  category={course.category}
                  instructor={{
                    name: course.trainer.name,
                    avatar: resolveImage(course.trainer.avatar)
                  }}
                  instructors={(course as any).staffTrainers?.length > 1
                    ? (course as any).staffTrainers.map((t: any) => ({ name: t.name, avatar: null }))
                    : undefined
                  }
                  basePath={basePath}
                  isFavorite={wishlistIds.includes(course.id)}
                />
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>

  )
}

