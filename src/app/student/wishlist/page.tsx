"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart, BookOpen, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { studentService } from "@/lib/student-service"
import { getFileUrl } from "@/lib/utils"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchWishlist = async () => {
        try {
            setLoading(true)
            const data = await studentService.getWishlist()
            setWishlist(data)
        } catch (error: any) {
            console.error("Error fetching wishlist:", error)
            toast.error("حدث خطأ أثناء جلب قائمة الرغبات")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWishlist()
    }, [])

    const confirmDelete = async () => {
        if (courseToDelete) {
            try {
                setIsDeleting(true)
                await studentService.removeFromWishlist(courseToDelete)
                setWishlist(prev => prev.filter(course => course.id !== courseToDelete))
                toast.success("تم إزالة الدورة من قائمة الرغبات")
                setCourseToDelete(null)
                setIsDialogOpen(false)
            } catch (error: any) {
                console.error("Error removing from wishlist:", error)
                toast.error("حدث خطأ أثناء إزالة الدورة")
            } finally {
                setIsDeleting(false)
            }
        }
    }

    const handleDeleteClick = (id: string) => {
        setCourseToDelete(id)
        setIsDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="aspect-video w-full" />
                            <CardContent className="p-6 space-y-4">
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-6 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة الرغبات</h1>
                <p className="text-gray-600">
                    الدورات التي قمت بحفظها للرجوع إليها لاحقاً
                </p>
            </div>

            {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((course) => (
                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col border-slate-100">
                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                <Image
                                    src={getFileUrl(course.image) || "/images/course-abstract.svg"}
                                    alt={course.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    unoptimized={true}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <Badge className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white backdrop-blur-sm border-none shadow-sm">
                                    {course.category}
                                </Badge>

                                <button
                                    onClick={() => handleDeleteClick(course.id)}
                                    className="absolute top-3 left-3 p-2 rounded-full bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all z-10 shadow-sm border border-slate-100"
                                    title="إزالة من المفضلة"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <CardContent className="p-6 flex-1 flex flex-col pt-4">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-700 hover:bg-blue-50 border-none">
                                        {course.type}
                                    </Badge>
                                </div>

                                <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {course.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                                    <div className="p-1 bg-slate-50 rounded">
                                        <BookOpen className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate">{course.trainer?.name}</span>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                    <div className="text-lg font-bold text-blue-600">
                                        {new Intl.NumberFormat('en-US').format(course.price)} <span className="text-xs font-normal text-slate-400">ريال</span>
                                    </div>
                                    <Button size="sm" asChild className="rounded-full px-5 bg-blue-600 hover:bg-blue-700 h-9">
                                        <Link href={`/student/courses/${course.id}`}>
                                            عرض التفاصيل
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <CardContent className="text-center py-20">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Heart className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            قائمة الرغبات فارغة
                        </h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                            لم تقم بإضافة أي دورات بعد. استكشف الدورات المتاحة وأضف ما يعجبك هنا.
                        </p>
                        <Button asChild className="rounded-full px-8 bg-blue-600 hover:bg-blue-700">
                            <Link href="/student/dashboard">
                                تصفح الدورات
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader className="text-right">
                        <DialogTitle>إزالة من قائمة الرغبات</DialogTitle>
                        <DialogDescription className="pt-2">
                            هل أنت متأكد من رغبتك في إزالة هذه الدورة من قائمة الرغبات؟ لن يتم حذف الدورة من المنصة، فقط من قائمتك الخاصة.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row-reverse gap-3 sm:justify-start">
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 sm:flex-none rounded-xl"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جاري الحذف...
                                </>
                            ) : "نعم، إزالة"}
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" className="flex-1 sm:flex-none rounded-xl">إلغاء</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
