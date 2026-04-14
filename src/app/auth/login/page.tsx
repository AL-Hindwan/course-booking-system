"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle } from "lucide-react"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Check if user just registered
  const registered = searchParams.get('registered')
  useEffect(() => {
    if (registered === 'true') {
      setSuccessMessage("تم إنشاء حسابك بنجاح! يرجى تسجيل الدخول")
    }
  }, [registered])

  // Auto-fill for demo purposes if role param exists
  const role = searchParams.get('role')
  useState(() => {
    if (role === 'student') setFormData(prev => ({ ...prev, email: 'student@demo.com', password: '123456' }))
    if (role === 'trainer') setFormData(prev => ({ ...prev, email: 'trainer@demo.com', password: '123456' }))
    if (role === 'institute') setFormData(prev => ({ ...prev, email: 'institute@demo.com', password: '123456' }))
    if (role === 'admin') setFormData(prev => ({ ...prev, email: 'admin@demo.com', password: '123456' }))
  })

  // Role-based redirection after successful login
  useEffect(() => {
    if (user && !authLoading) {
      // Redirect based on user role from backend
      switch (user.role) {
        case 'STUDENT':
          router.push('/student/dashboard')
          break
        case 'TRAINER':
          router.push('/trainer/dashboard')
          break
        case 'INSTITUTE_ADMIN':
          router.push('/institute/dashboard')
          break
        case 'PLATFORM_ADMIN':
          router.push('/admin/dashboard')
          break
        default:
          router.push('/')
      }
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login form submitted', { email: formData.email })
    setIsLoading(true)
    setError("")

    try {
      console.log('Calling login function...')
      await login(formData.email, formData.password)
      console.log('Login successful')
      // Redirect will be handled by useEffect when user state updates
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err?.message || "حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل بيانات حسابك للمتابعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMessage && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                "دخول"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  حسابات تجريبية
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'student@demo.com', password: '123456' })}>
                طالب
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'trainer@demo.com', password: '123456' })}>
                مدرب
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'institute@demo.com', password: '123456' })}>
                معهد
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFormData({ email: 'admin@demo.com', password: '123456' })}>
                مسؤول
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">جاري التحميل...</div>}>
      <LoginContent />
    </Suspense>
  )
}