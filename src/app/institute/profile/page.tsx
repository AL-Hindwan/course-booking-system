"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Mail, Phone, Building, Eye, EyeOff, MapPin, Globe, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { instituteService } from "@/lib/institute-service"
import { getFileUrl } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export default function InstituteProfilePage() {
    const { updateUser } = useAuth()
    const [user, setUser] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        role: "institute_admin",
        avatar: "",
        instituteName: "",
        instituteLogo: "",
        instituteAddress: "",
        instituteWebsite: "",
        instituteDescription: "",
        verificationStatus: ""
    })
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [activeTab, setActiveTab] = useState("personal")
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const logoFileInputRef = useRef<HTMLInputElement>(null)

    // Bank Account States
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [isBankAccountsLoading, setIsBankAccountsLoading] = useState(true)
    const [isBankModalOpen, setIsBankModalOpen] = useState(false)
    const [isSavingBank, setIsSavingBank] = useState(false)
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
    const [bankForm, setBankForm] = useState({
        bankName: "",
        accountName: "",
        accountNumber: "",
        iban: "",
        isActive: true
    })

    const fetchBankAccounts = async () => {
        try {
            setIsBankAccountsLoading(true)
            const accounts = await instituteService.getBankAccounts()
            setBankAccounts(accounts || [])
        } catch (error) {
            console.error("Failed to fetch bank accounts", error)
            toast.error("فشل في تحميل الحسابات البنكية")
        } finally {
            setIsBankAccountsLoading(false)
        }
    }

    const openBankModal = (account?: any) => {
        if (account) {
            setEditingAccountId(account.id)
            setBankForm({
                bankName: account.bankName,
                accountName: account.accountName,
                accountNumber: account.accountNumber,
                iban: account.iban || "",
                isActive: account.isActive
            })
        } else {
            setEditingAccountId(null)
            setBankForm({
                bankName: "",
                accountName: "",
                accountNumber: "",
                iban: "",
                isActive: true
            })
        }
        setIsBankModalOpen(true)
    }

    const handleSaveBankAccount = async () => {
        if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber) {
            toast.error("يرجى تعبئة جميع الحقول الإلزامية")
            return
        }

        try {
            setIsSavingBank(true)
            if (editingAccountId) {
                await instituteService.updateBankAccount(editingAccountId, bankForm)
                toast.success("تم تحديث الحساب البنكي بنجاح")
            } else {
                await instituteService.addBankAccount(bankForm)
                toast.success("تم إضافة الحساب البنكي بنجاح")
            }
            setIsBankModalOpen(false)
            fetchBankAccounts()
        } catch (error: any) {
            console.error("Error saving bank account:", error)
            toast.error(error.message || "حدث خطأ أثناء حفظ الحساب الدنكي")
        } finally {
            setIsSavingBank(false)
        }
    }

    const handleDeleteBankAccount = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الحساب البنكي؟")) return

        try {
            await instituteService.deleteBankAccount(id)
            toast.success("تم حذف الحساب البنكي بنجاح")
            fetchBankAccounts()
        } catch (error: any) {
            console.error("Error deleting bank account:", error)
            toast.error(error.message || "حدث خطأ أثناء حذف الحساب الدنكي")
        }
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await instituteService.getProfile()
                if (data) {
                    setUser({
                        ...user,
                        ...data,
                        phone: data.phone || "",
                        instituteAddress: data.instituteAddress || "",
                        instituteWebsite: data.instituteWebsite || "",
                        instituteDescription: data.instituteDescription || ""
                    })
                }
            } catch (error) {
                console.error("Failed to fetch profile", error)
                toast.error("فشل في تحميل بيانات الملف الشخصي")
            } finally {
                setIsLoading(false)
            }
        }
        fetchProfile()
        fetchBankAccounts()
    }, [])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setAvatarFile(file)
            setUser({ ...user, avatar: URL.createObjectURL(file) })
            setIsEditing(true) // auto-enable editing mode so they can save
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setLogoFile(file)
            setUser({ ...user, instituteLogo: URL.createObjectURL(file) })
            setIsEditing(true) // auto-enable editing mode so they can save
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const formData = new FormData()
            formData.append("name", user.name)
            formData.append("phone", user.phone)
            formData.append("email", user.email)
            formData.append("instituteName", user.instituteName)
            formData.append("instituteAddress", user.instituteAddress)
            formData.append("instituteWebsite", user.instituteWebsite)
            formData.append("instituteDescription", user.instituteDescription)
            if (avatarFile) {
                formData.append("avatar", avatarFile)
            }
            if (logoFile) {
                formData.append("logo", logoFile)
            }

            const data = await instituteService.updateProfile(formData)

            if (data?.avatar) {
                setUser({ ...user, avatar: data.avatar })
                updateUser({ name: user.name, avatar: data.avatar })
            } else {
                updateUser({ name: user.name })
            }

            toast.success("تم تحديث البيانات بنجاح")
            setIsEditing(false)
            setAvatarFile(null)
            setLogoFile(null)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء حفظ البيانات")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    const renderPersonalInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle>المعلومات الشخصية</CardTitle>
                <CardDescription>إدارة معلومات حسابك الشخصية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        {user.avatar ? (
                            <AvatarImage src={getFileUrl(user.avatar)} alt={user.name} className="object-cover" />
                        ) : (
                            <AvatarFallback className="text-lg">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            تغيير الصورة
                        </Button>
                        <p className="text-sm text-gray-500 mt-1">
                            JPG, PNG أو GIF. الحد الأقصى 2MB
                        </p>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل</Label>
                        <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                disabled={!isEditing}
                                className="pr-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                disabled={!isEditing}
                                className="pr-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <div className="relative">
                            <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="phone"
                                value={user.phone}
                                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                disabled={!isEditing}
                                className="pr-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>نوع الحساب</Label>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                                مدير معهد
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                إلغاء
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>تعديل المعلومات</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    const renderInstituteInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle>بيانات المعهد</CardTitle>
                <CardDescription>إدارة المعلومات العامة للمعهد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Institute Logo */}
                <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24 border-2 border-slate-100">
                        {user.instituteLogo ? (
                            <AvatarImage src={getFileUrl(user.instituteLogo)} alt={user.instituteName} className="object-cover" />
                        ) : (
                            <AvatarFallback className="text-xl bg-slate-50 text-slate-400">
                                {user.instituteName?.charAt(0) || <Building className="h-8 w-8 text-slate-300" />}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={logoFileInputRef}
                            onChange={handleLogoChange}
                        />
                        <Button variant="outline" size="sm" onClick={() => logoFileInputRef.current?.click()}>
                            تغيير شعار المعهد
                        </Button>
                        <p className="text-sm text-gray-500 mt-1">
                            JPG, PNG أو GIF. الحد الأقصى 2MB
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="instituteName">اسم المعهد</Label>
                        <div className="relative">
                            <Building className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="instituteName"
                                value={user.instituteName}
                                onChange={(e) => setUser({ ...user, instituteName: e.target.value })}
                                disabled={!isEditing}
                                className="pr-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instituteWebsite">الموقع الإلكتروني</Label>
                        <div className="relative">
                            <Globe className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="instituteWebsite"
                                value={user.instituteWebsite}
                                onChange={(e) => setUser({ ...user, instituteWebsite: e.target.value })}
                                disabled={!isEditing}
                                className="pr-10"
                            />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label htmlFor="instituteAddress">العنوان</Label>
                        <div className="relative">
                            <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="instituteAddress"
                                value={user.instituteAddress}
                                onChange={(e) => setUser({ ...user, instituteAddress: e.target.value })}
                                disabled={!isEditing}
                                className="pr-10"
                            />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label htmlFor="instituteDescription">وصف المعهد</Label>
                        <Textarea
                            id="instituteDescription"
                            value={user.instituteDescription}
                            onChange={(e) => setUser({ ...user, instituteDescription: e.target.value })}
                            disabled={!isEditing}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Action Buttons (Replicated for convenience) */}
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                إلغاء
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>تعديل المعلومات</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    const renderPasswordChange = () => (
        <Card>
            <CardHeader>
                <CardTitle>تغيير كلمة المرور</CardTitle>
                <CardDescription>تأكد من استخدام كلمة مرور قوية وآمنة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                    <div className="relative">
                        <Input
                            id="current-password"
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
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
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input
                        id="new-password"
                        type="password"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                    />
                </div>

                <Button>تغيير كلمة المرور</Button>
            </CardContent>
        </Card>
    )

    const renderBankAccounts = () => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>الحسابات البنكية</CardTitle>
                    <CardDescription>إدارة الحسابات البنكية الخاصة بالمعهد لاستقبال المدفوعات.</CardDescription>
                </div>
                <Button onClick={() => openBankModal()}>إضافة حساب جديد</Button>
            </CardHeader>
            <CardContent>
                {isBankAccountsLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        لا توجد حسابات بنكية مضافة بعد.
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">اسم البنك</TableHead>
                                    <TableHead className="text-right">اسم الحساب</TableHead>
                                    <TableHead className="text-right">رقم الحساب</TableHead>
                                    <TableHead className="text-right">الآيبان (IBAN)</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-left w-[120px]">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bankAccounts.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">{account.bankName}</TableCell>
                                        <TableCell>{account.accountName}</TableCell>
                                        <TableCell dir="ltr" className="text-right">{account.accountNumber}</TableCell>
                                        <TableCell dir="ltr" className="text-right">{account.iban || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={account.isActive ? "default" : "secondary"}>
                                                {account.isActive ? "نشط" : "غير نشط"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openBankModal(account)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteBankAccount(account.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">الملف الشخصي</h1>
                <p className="text-gray-600 mt-2">إدارة معلومات حسابك وبيانات المعهد</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
                    <TabsTrigger value="institute">بيانات المعهد</TabsTrigger>
                    <TabsTrigger value="banks">الحسابات البنكية</TabsTrigger>
                    <TabsTrigger value="security">كلمة المرور</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-6">
                    {renderPersonalInfo()}
                </TabsContent>

                <TabsContent value="institute" className="mt-6">
                    {renderInstituteInfo()}
                </TabsContent>

                <TabsContent value="banks" className="mt-6">
                    {renderBankAccounts()}
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    {renderPasswordChange()}
                </TabsContent>
            </Tabs>

            <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
                <DialogContent dir="rtl" className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingAccountId ? "تعديل حساب بنكي" : "إضافة حساب بنكي"}</DialogTitle>
                        <DialogDescription>
                            أدخل تفاصيل الحساب البنكي لاستقبال التحويلات.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bankName">اسم البنك *</Label>
                            <Input
                                id="bankName"
                                value={bankForm.bankName}
                                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                placeholder="مثال: بنك الرياض، البنك الأهلي"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="accountName">اسم صاحب الحساب *</Label>
                            <Input
                                id="accountName"
                                value={bankForm.accountName}
                                onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                                placeholder="الاسم كما يظهر في البنك"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="accountNumber">رقم الحساب *</Label>
                            <Input
                                id="accountNumber"
                                value={bankForm.accountNumber}
                                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                dir="ltr"
                                className="text-right"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="iban">الآيبان (IBAN)</Label>
                            <Input
                                id="iban"
                                value={bankForm.iban}
                                onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                                dir="ltr"
                                className="text-right"
                                placeholder="SA..."
                            />
                        </div>
                        {editingAccountId && (
                            <div className="flex items-center gap-2 mt-2">
                                <Label htmlFor="isActive" className="cursor-pointer">حساب نشط؟</Label>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={bankForm.isActive}
                                    onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBankModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSaveBankAccount} disabled={isSavingBank}>
                            {isSavingBank ? "جاري الحفظ..." : "حفظ الحساب"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

