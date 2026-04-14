"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Star, PlayCircle, Sparkles, ArrowUpRight, Globe, Award, Users2, Zap, ArrowLeft, CheckCircle2, 
  Search, BookOpen, Layers, Code, Palette, Banknote, Laptop, ShieldCheck 
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types"
import { Footer } from "@/components/layout/footer"
import { PublicService, PlatformStats, CategoryData, FeaturedCourse } from "@/lib/public-service"
import { getFileUrl } from "@/lib/utils"

// --- Real Data with Unsplash Images ---

const categoryStyleMap: Record<string, { icon: any, color: string }> = {
  'programming': { icon: Code, color: "text-blue-600 bg-blue-50" },
  'design': { icon: Palette, color: "text-pink-600 bg-pink-50" },
  'business': { icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
  'marketing': { icon: Globe, color: "text-orange-600 bg-orange-50" },
  'data-science': { icon: Layers, color: "text-purple-600 bg-purple-50" },
  'languages': { icon: BookOpen, color: "text-cyan-600 bg-cyan-50" },
  'technology': { icon: Laptop, color: "text-indigo-600 bg-indigo-50" },
  'cybersecurity': { icon: ShieldCheck, color: "text-red-600 bg-red-50" },
  'default': { icon: Sparkles, color: "text-slate-600 bg-slate-50" }
}

const testimonials = [
    {
        id: 1,
        name: "عمر خالد",
        role: "مطور برمجيات",
        content: "تجربة تعليمية رائعة! المحتوى متقن والمدربون على مستوى عالٍ من الخبرة. حصلت على وظيفتي الأولى بفضل هذه المنصة.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80"
    },
    {
        id: 2,
        name: "منى السيد",
        role: "مصممة جرافيك",
        content: "أفضل استثمار فعلته لنفسي. الدورات عملية جداً والشهادات معتمدة ساعدتني في ترقيتي في العمل.",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80"
    }
]

export default function HomePage() {
  const { user } = useAuth()
  const currentView: UserRole = user?.role || 'STUDENT' as UserRole
  const [activeTab, setActiveTab] = useState("bestselling")
  const [statsData, setStatsData] = useState<PlatformStats | null>(null)
  const [categoriesData, setCategoriesData] = useState<CategoryData[]>([])
  const [coursesData, setCoursesData] = useState<FeaturedCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [stats, cats, courses] = await Promise.all([
          PublicService.getStats(),
          PublicService.getCategories(),
          PublicService.getFeaturedCourses()
        ])
        setStatsData(stats)
        setCategoriesData(cats)
        setCoursesData(courses)
      } catch (err) {
        console.error("Failed to load homepage data", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  const statsList = [
      { label: "طالب نشط", value: statsData ? `+${statsData.students}` : '...' },
      { label: "دورة تدريبية", value: statsData ? `+${statsData.courses}` : '...' },
      { label: "مدرب خبير", value: statsData ? `+${statsData.trainers}` : '...' },
      { label: "معهد معتمد", value: statsData ? `+${statsData.institutes}` : '...' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir="rtl">
        
      {/* 1. Hero Section - With Real Hero Image */}
      <section className="relative pt-8 pb-20 lg:pt-16 lg:pb-28 overflow-hidden bg-white">
          <div className="container relative z-10 px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                {/* Content Left (Right in RTL) */}
                <div className="text-center lg:text-right order-2 lg:order-1 animate-in slide-in-from-bottom-5 fade-in duration-700">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.2]">
                        <span className="block text-slate-900">استثمر في مستقبلك.</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-l from-blue-600 to-indigo-600">
                             تعلم من أفضل الخبراء.
                        </span>
                    </h1>

                    <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        آلاف الدورات في البرمجة، التصميم، وإدارة الأعمال. احصل على شهادات معتمدة تطور مسارك المهني.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Button size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-1" asChild>
                            <Link href="/courses">
                                ابدأ التعلم الآن
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all" asChild>
                            <Link href="/auth/register?role=trainer">
                                انضم كشريك (مدرب/معهد)
                            </Link>
                        </Button>
                    </div>

                    {/* Trust Strip */}
                    <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-slate-400 text-sm font-semibold grayscale opacity-70">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-blue-600" /> شهادات معتمدة</div>
                        <div className="flex items-center gap-2"><Users2 className="w-5 h-5 text-blue-600" /> +5000 طالب</div>
                        <div className="flex items-center gap-2"><Star className="w-5 h-5 text-blue-600" /> تقييم عالي</div>
                    </div>
                </div>

                {/* Hero Visual Right - REAL IMAGE */}
                <div className="relative order-1 lg:order-2 animate-in slide-in-from-left-5 fade-in duration-1000">
                     <div className="relative z-10">
                        {/* Decorative Background Blob */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-blue-600/5 to-purple-600/5 rounded-[3rem] transform rotate-3 scale-105"></div>
                        
                        {/* Main Image Container */}
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-4 border-white aspect-square md:aspect-[4/3] lg:aspect-square">
                             {/* High Quality Student Image */}
                             <Image 
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" 
                                alt="Student learning"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                                priority
                             />
                             
                             {/* Floating Card */}
                             <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 animate-bounce-slow">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                          <CheckCircle2 className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-900 text-lg">أكملت الدورة بنجاح!</p>
                                          <p className="text-slate-500 text-sm">حصلت على شهادة معتمدة في UX Design</p>
                                      </div>
                                  </div>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
          </div>
      </section>

      {/* Floating Stats Bar */}
      <section className="container px-4 mx-auto -mt-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-10 flex flex-wrap justify-around items-center gap-8 text-center">
                {statsList.map((stat, i) => (
                    <div key={i} className="flex-1 min-w-[150px]">
                            <h3 className="text-4xl font-extrabold text-blue-600 mb-2">{stat.value}</h3>
                            <p className="text-slate-500 font-bold">{stat.label}</p>
                    </div>
                ))}
          </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-slate-50">
           <div className="container px-4 mx-auto">
               <div className="text-center mb-16">
                   <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">استكشف أهم التصنيفات</h2>
                   <p className="text-slate-500">تصفح الدورات حسب المجال الذي تهتم به</p>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {isLoading ? (
                       <div className="col-span-full text-center text-slate-500 py-8">جاري التحميل...</div>
                   ) : categoriesData.map((cat) => {
                       const style = categoryStyleMap[cat.slug] || categoryStyleMap['default'];
                       const Icon = style.icon;
                       return (
                       <Link href={`/courses?category=${cat.id}`} key={cat.id} className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center gap-5">
                           <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${style.color} group-hover:scale-110 transition-transform duration-300`}>
                               <Icon className="w-9 h-9" />
                           </div>
                           <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                           <p className="text-sm text-slate-500">{cat._count?.courses || 0} دورات</p>
                       </Link>
                   )})}
               </div>
           </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
               {/* Headings... */}
               <div className="flex justify-between items-end mb-12">
                   <div>
                       <h2 className="text-3xl font-bold text-slate-900 mb-2">دورات مميزة اخترناها لك</h2>
                       <p className="text-slate-500">الأكثر طلباً وتقييماً من قبل الطلاب</p>
                   </div>
                   <Button variant="link" className="text-blue-600">عرض الكل</Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {isLoading ? (
                        <div className="col-span-full text-center text-slate-500 py-8">جاري التحميل...</div>
                    ) : coursesData.map((course) => {
                        // Strict database image rendering with a simple local fallback
                        const fallBackImage = '/images/course-abstract.svg';
                        const courseImage = course.image ? getFileUrl(course.image) || fallBackImage : fallBackImage;
                        const instructorName = course.trainer?.name || course.staffTrainer?.name || course.institute?.name || 'غير محدد';
                        
                        let instructorAvatar = '/images/avatar-1.png'; // local fallback
                        if (course.trainer?.avatar) {
                           instructorAvatar = getFileUrl(course.trainer.avatar) || instructorAvatar;
                        } else if (course.institute?.logo) {
                           instructorAvatar = getFileUrl(course.institute.logo) || instructorAvatar;
                        }

                        return (
                        <Link href={`/courses/${course.id}`} key={course.id} className="block group bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-2 transition-all duration-300">
                             <div className="relative h-56 w-full">
                                 <Image 
                                    src={courseImage} 
                                    alt={course.title} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                    unoptimized={courseImage.includes('localhost:5000')}
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                             </div>
                             
                             <div className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                     <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{course.category?.name || 'غير مصنف'}</span>
                                 </div>
                                 
                                 <h3 className="font-bold text-xl text-slate-900 mb-3 leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">{course.title}</h3>
                                 
                                 <div className="flex items-center gap-3 mb-6">
                                     <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100">
                                          <Image 
                                              src={instructorAvatar} 
                                              alt={instructorName} 
                                              fill 
                                              sizes="40px"
                                              className="object-cover" 
                                              unoptimized={instructorAvatar.includes('localhost:5000')}
                                          />
                                     </div>
                                     <div className="flex-1">
                                         <p className="text-sm font-bold text-slate-700">{instructorName}</p>
                                     </div>
                                 </div>
                                 
                                 <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                     <div>
                                          <span className="text-2xl font-bold text-slate-900">{course.price}</span>
                                          <span className="text-sm font-medium text-slate-400 mr-1">ر.ي</span>
                                     </div>
                                     <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/20">
                                         <ArrowLeft className="w-5 h-5" />
                                     </div>
                                 </div>
                             </div>
                        </Link>
                    )})}
               </div>
          </div>
      </section>

      {/* Dual Banner */}
      <section className="py-20 bg-slate-50">
          <div className="container px-4 mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                   {/* Student */}
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-100 flex flex-col justify-center items-start text-right relative overflow-hidden group">
                        <div className="relative z-10 max-w-lg">
                            <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-6">للطلاب</span>
                            <h3 className="text-4xl font-bold text-slate-900 mb-4">طوّر مهاراتك اليوم</h3>
                            <p className="text-lg text-slate-500 mb-8 leading-relaxed">اكتشف مسارات تعليمية جديدة واحصل على شهادات معتمدة تساعدك في سوق العمل.</p>
                            <Button size="lg" className="rounded-full px-10 bg-slate-900 text-white hover:bg-blue-600 transition-colors shadow-lg">تصفح الدورات</Button>
                        </div>
                        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 mix-blend-multiply opacity-50"></div>
                   </div>

                   {/* Instructor */}
                   <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 rounded-[3rem] text-white flex flex-col justify-center items-start text-right relative overflow-hidden group">
                        <div className="relative z-10 max-w-lg">
                            <span className="inline-block px-4 py-1 rounded-full bg-white/20 text-white font-bold text-sm mb-6 backdrop-blur-md">للمدربين</span>
                            <h3 className="text-4xl font-bold mb-4">انضم إلى فريق المدربين</h3>
                            <p className="text-lg text-blue-100 mb-8 leading-relaxed">شارك خبراتك مع آلاف الطلاب وحقق دخلاً إضافياً. نحن نوفر لك كل الأدوات التي تحتاجها للنجاح.</p>
                            <Button size="lg" className="rounded-full px-10 bg-white text-blue-700 hover:bg-blue-50 transition-colors shadow-lg">ابدأ التدريب</Button>
                        </div>
                        {/* Decorative Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                   </div>
              </div>
          </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
           <div className="container px-4 mx-auto">
               <h2 className="text-3xl font-bold text-center mb-16">ماذا يقول طلابنا؟</h2>
               <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                   {testimonials.map((t) => (
                       <div key={t.id} className="bg-slate-50 border border-slate-100 p-10 rounded-[2.5rem] relative">
                            <div className="flex items-center gap-4 mb-6">
                                <Image src={t.avatar} width={64} height={64} alt={t.name} className="rounded-full object-cover border-4 border-white shadow-md" />
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{t.name}</h4>
                                    <p className="text-blue-600 font-medium text-sm">{t.role}</p>
                                </div>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed italic">"{t.content}"</p>
                       </div>
                   ))}
               </div>
           </div>
      </section>

      <Footer />
    </div>
  )
}
