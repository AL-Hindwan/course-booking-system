"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User as UserIcon, Mail, Phone, Eye, EyeOff, Loader2, Camera } from "lucide-react"
import { UserRole } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { getFileUrl } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function StudentProfilePage() {
    const { user: authUser, updateUser } = useAuth()
    const [user, setUser] = useState({
        name: "",
        email: "",
        phone: "",
        avatar: ""
    })
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [activeTab, setActiveTab] = useState("personal")
    const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (authUser) {
            setUser({
                name: authUser.name || "",
                email: authUser.email || "",
                phone: authUser.phone || "",
                avatar: authUser.avatar || ""
            })
        }
    }, [authUser])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedAvatar(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const formData = new FormData()
            formData.append("name", user.name)
            formData.append("phone", user.phone)
            formData.append("email", user.email)
            if (selectedAvatar) {
                formData.append("avatar", selectedAvatar)
            }

            const updatedUserData = await authService.updateProfile(formData)
            updateUser(updatedUserData)
            toast.success("تم تحديث الملف الشخصي بنجاح")
            setIsEditing(false)
            setSelectedAvatar(null)
            setAvatarPreview(null)
        } catch (error: any) {
            toast.error("فشل في تحديث الملف الشخصي")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const renderPersonalInfo = () => (
        <Card className="border-none shadow-md">
            <CardHeader className="text-right">
                <CardTitle className="text-2xl font-bold">المعلومات الشخصية</CardTitle>
                <CardDescription>إدارة معلومات حسابك الشخصية وتحديث بياناتك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Avatar */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <div className="relative group">
                        <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                            <AvatarImage src={avatarPreview || getFileUrl(user.avatar)} alt={user.name} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Camera className="h-8 w-8 text-white" />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 space-y-2 text-center sm:text-right">
                        <h3 className="font-bold text-lg">{user.name || "لم يتم تحديد اسم"}</h3>
                        <p className="text-sm text-gray-500">
                            {user.email}
                        </p>
                        <div className="pt-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                            {isEditing && (
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                                    تغيير الصورة
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-right block">الاسم الكامل</Label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                disabled={!isEditing}
                                className="pl-10 text-right h-11 rounded-xl"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-right block">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                disabled={!isEditing}
                                className={`pl-10 text-right h-11 rounded-xl ${!isEditing ? "bg-slate-50 cursor-not-allowed" : ""}`}
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-right block">رقم الهاتف</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="phone"
                                value={user.phone}
                                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                disabled={!isEditing}
                                className="pl-10 text-right h-11 rounded-xl"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-right block">نوع الحساب</Label>
                        <div className="pt-2 flex justify-end">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-4 py-1.5 rounded-full text-sm">
                                طالب
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 justify-end">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="rounded-xl px-8"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                حفظ التغييرات
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl px-8">
                                إلغاء
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} className="rounded-xl px-8">تعديل الملف الشخصي</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    const renderPasswordChange = () => (
        <Card className="border-none shadow-md">
            <CardHeader className="text-right">
                <CardTitle className="text-2xl font-bold">تغيير كلمة المرور</CardTitle>
                <CardDescription>تأكد من استخدام كلمة مرور قوية وغير مكررة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="current-password" title="كلمة المرور الحالية" className="text-right block">كلمة المرور الحالية</Label>
                    <div className="relative">
                        <Input
                            id="current-password"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 text-right h-11 rounded-xl"
                            dir="ltr"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new-password" title="كلمة المرور الجديدة" className="text-right block">كلمة المرور الجديدة</Label>
                    <Input
                        id="new-password"
                        type="password"
                        className="text-right h-11 rounded-xl"
                        dir="ltr"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password" title="تأكيد كلمة المرور" className="text-right block">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        className="text-right h-11 rounded-xl"
                        dir="ltr"
                    />
                </div>

                <div className="pt-2 flex justify-end">
                    <Button className="rounded-xl px-8">تحديث كلمة المرور</Button>
                </div>
            </CardContent>
        </Card>
    )

    if (!authUser) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
            <div className="mb-8 text-right">
                <h1 className="text-4xl font-extrabold bg-gradient-to-l from-slate-900 to-slate-600 bg-clip-text text-transparent">إعدادات الحساب</h1>
                <p className="text-gray-500 mt-2 font-medium">تحكم في بياناتك الشخصية وإعدادات الأمان</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-slate-100 rounded-2xl">
                    <TabsTrigger value="personal" className="rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">المعلومات الشخصية</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">كلمة المرور</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-0 outline-none">
                    {renderPersonalInfo()}
                </TabsContent>

                <TabsContent value="security" className="mt-0 outline-none">
                    {renderPasswordChange()}
                </TabsContent>
            </Tabs>
        </div>
    )
}
