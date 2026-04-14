"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12">
                 <Image src="/images/logo.png" alt="منصة د" fill className="object-contain" />
              </div>
              <span className="font-extrabold text-2xl text-white">منصة د</span>
            </div>
            <p className="mb-6 leading-relaxed">
              منصتك الأولى للتعليم الإلكتروني وتطوير المهارات. نجمع بين أفضل الخبراء وأحدث التقنيات لنقدم تجربة تعليمية فريدة.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">روابط سريعة</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors block">من نحن</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-primary transition-colors block">الدورات التدريبية</Link>
              </li>
              <li>
                <Link href="/institutes" className="hover:text-primary transition-colors block">المعاهد الشريكة</Link>
              </li>
              <li>
                <Link href="/instructors" className="hover:text-primary transition-colors block">المدربون</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors block">المدونة</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">الدعم والمساعدة</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors block">اتصل بنا</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors block">الأسئلة الشائعة</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors block">شروط الاستخدام</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors block">سياسة الخصوصية</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">تواصل معنا</h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>المكلا، اليمن</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="cursor-pointer hover:text-white" dir="ltr">+966 50 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="cursor-pointer hover:text-white">info@coursebooking.com</span>
              </li>
            </ul>
            
            <h4 className="text-white font-bold mb-4">اشترك في النشرة البريدية</h4>
            <div className="flex gap-2">
              <Input 
                placeholder="البريد الإلكتروني" 
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-primary"
              />
              <Button size="icon" className="shrink-0 bg-primary hover:bg-primary/90 text-white">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} منصة د. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
