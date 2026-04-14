import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, ShieldCheck } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">سياسة الخصوصية</CardTitle>
          <p className="text-gray-500">نحن نحمي بياناتك بكل أمان</p>
        </CardHeader>
        <CardContent className="space-y-6 text-right" dir="rtl">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">1. جمع البيانات</h2>
            <p className="text-gray-700 leading-relaxed">
              نقوم بجمع البيانات الضرورية فقط لتقديم تجربة تعليمية ممتازة، مثل الاسم، البريد الإلكتروني، وتفاصيل الدورات.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">2. حماية البيانات</h2>
            <p className="text-gray-700 leading-relaxed">
              نستخدم أحدث تقنيات التشفير لحماية معلوماتك الشخصية من الوصول غير المصرح به.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">3. مشاركة البيانات</h2>
            <p className="text-gray-700 leading-relaxed">
              لا نقوم ببيع بياناتك لأي جهة ثالثة. يتم استخدام البيانات فقط داخل المنصة لتسهيل عملية حجز الدورات.
            </p>
          </section>

          <div className="pt-6 border-t flex justify-center">
            <Link href="/auth/register">
              <Button className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                العودة للتسجيل
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
