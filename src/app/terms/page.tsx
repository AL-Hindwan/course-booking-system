import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">الشروط والأحكام</CardTitle>
          <p className="text-gray-500">منصة حجز الدورات</p>
        </CardHeader>
        <CardContent className="space-y-6 text-right" dir="rtl">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">1. شروط الاستخدام</h2>
            <p className="text-gray-700 leading-relaxed">
              باستخدامك لهذه المنصة، فإنك توافق على الالتزام بكافة الشروط المذكورة هنا وحسن استخدام موارد المنصة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">2. مسؤولية الحساب</h2>
            <p className="text-gray-700 leading-relaxed">
              أنت مسؤول بشكل كامل عن سرية بيانات حسابك وعن كافة الأنشطة التي تتم من خلاله.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">3. سياسة الحجز</h2>
            <p className="text-gray-700 leading-relaxed">
              يتم تأكيد الحجز بعد دفع الرسوم المطلوبة ورفع إثبات الدفع، ويخضع الحجز لموافقة الجهة المنظمة.
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
