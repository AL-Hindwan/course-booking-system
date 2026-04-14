"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type MouseEvent } from "react"
import { Users, Clock, ArrowRight, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { studentService } from "@/lib/student-service"

const FAVORITES_KEY = "courseFavorites"

export interface CourseCardProps {
    id: string
    title: string
    description: string
    price: number
    studentsCount: number
    duration: string
    level?: string
    image: string
    instructor: {
        name: string
        avatar: string
    }
    instructors?: { name: string; avatar?: string }[] // multi-trainer support
    category: string
    basePath?: string
    isFavorite?: boolean
}

export function CourseCard({
    id,
    title,
    description,
    price,
    studentsCount,
    duration,
    level,
    image,
    instructor,
    instructors,
    category,
    basePath = "/courses",
    isFavorite: initialIsFavorite = false
}: CourseCardProps) {
    const { user } = useAuth() ?? {}
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
    const [isToggling, setIsToggling] = useState(false)

    useEffect(() => {
        setIsFavorite(initialIsFavorite)
    }, [initialIsFavorite])

    const toggleFavorite = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()

        if (!user?.id) {
            toast.error("يرجى تسجيل الدخول لإضافة الدورة إلى قائمة الرغبات")
            return
        }

        if (isToggling) return
        setIsToggling(true)

        try {
            const result = await studentService.toggleWishlist(id)
            setIsFavorite(result.added)
            if (result.added) {
                toast.success("تم إضافة الدورة إلى قائمة الرغبات")
            } else {
                toast.success("تم إزالة الدورة من قائمة الرغبات")
            }
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء تحديث قائمة الرغبات")
        } finally {
            setIsToggling(false)
        }
    }

    return (
        <Card
            dir="rtl"
            className="group w-full max-w-[300px] overflow-hidden border-0 bg-white text-right shadow-lg transition-all duration-300 hover:shadow-xl h-full flex flex-col rounded-2xl"
        >
            {/* Image Container */}
            <div className="relative w-full aspect-square sm:w-[300px] sm:h-[300px] overflow-hidden rounded-2xl">
                <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized={true}
                    style={{ display: "block" }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Category Badge */}
                <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm shadow-sm dark:bg-slate-950/90 dark:text-primary-foreground">
                        {category}
                    </Badge>
                </div>

                {/* Wishlist Button */}
                <button
                    type="button"
                    aria-label="إضافة إلى المفضلة"
                    aria-pressed={isFavorite}
                    onClick={toggleFavorite}
                    className={`absolute top-4 left-4 z-20 flex h-10 w-10 shrink-0 aspect-square p-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/90 shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 text-red-500`}
                >
                    <Heart className={`w-5 h-5 transition-transform duration-200 ${isFavorite ? "fill-current text-red-500 scale-110" : ""}`} />
                </button>
            </div>

            {/* Content */}
            <CardContent className="p-5 flex-grow flex flex-col gap-3 text-right">
                <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-1">
                    <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        <span>{duration}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                        <Users className="w-3 h-3" />
                        <span>{studentsCount}</span>
                    </div>
                </div>

                <Link href={`${basePath}/${id}`} className="group-hover:text-primary transition-colors">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-1">
                        {title}
                    </h3>
                </Link>

                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[42px] mb-2">
                    {description}
                </p>

                {/* Instructor(s) */}
                <div className="flex items-center justify-start gap-2 mt-auto pt-3 border-t border-border/50">
                    {instructors && instructors.length > 1 ? (
                        // Multi-trainer: show stacked avatars + names
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-1">
                                {instructors.slice(0, 3).map((t, i) => (
                                    <div key={i} className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-white -ml-2 first:ml-0 shadow-sm" style={{ zIndex: 10 - i }}>
                                        <div className="w-full h-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600">
                                            {t.name.charAt(0)}
                                        </div>
                                    </div>
                                ))}
                                {instructors.length > 3 && (
                                    <span className="text-xs text-muted-foreground mr-1">+{instructors.length - 3}</span>
                                )}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground truncate">
                                {instructors.map(t => t.name).join('، ')}
                            </span>
                        </div>
                    ) : (
                        // Single trainer fallback
                        <>
                            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border">
                                <Image src={instructor.avatar} alt={instructor.name} fill className="object-cover" unoptimized={true} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{instructor.name}</span>
                        </>
                    )}
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-4 pt-0 flex w-full items-center justify-between text-right">
                <Button size="sm" className="rounded-xl px-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                    <Link href={`${basePath}/${id}`}>
                        عرض التفاصيل
                        <ArrowRight className="w-4 h-4 mr-1" />
                    </Link>
                </Button>

                <div className="flex flex-col">
                    <span className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat('en-US').format(price)} <span className="text-xs font-normal text-muted-foreground">ر.ي</span>
                    </span>
                </div>
            </CardFooter>
        </Card>
    )
}
