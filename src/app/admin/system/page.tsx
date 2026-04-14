"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Mail, CreditCard, Shield, Database, Save } from "lucide-react"
import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/page-header"

// Mock data
const mockUser = {
  id: "admin1",
  name: "أحمد المدير",
  email: "admin@platform.com",
  role: "platform_admin" as const,
  avatar: "/avatars/admin.jpg",
  createdAt: new Date()
}

export default function AdminSystem() {
  const [paymentSettings, setPaymentSettings] = useState({
    provider: "stripe",
    apiKey: "",
    webhookSecret: "",
    testMode: true,
    currency: "YER"
  })

  const [emailSettings, setEmailSettings] = useState({
    provider: "sendgrid",
    apiKey: "",
    fromEmail: "noreply@platform.com",
    fromName: "منصة الدورات",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: ""
  })

  const [smsSettings, setSmsSettings] = useState({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    phoneNumber: "",
    enabled: false
  })

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "منصة حجز الدورات",
    siteDescription: "منصة شاملة لحجز وإدارة الدورات التدريبية",
    contactEmail: "support@platform.com",
    supportPhone: "+966501234567",
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileSize: "10",
    allowedFileTypes: ".pdf,.doc,.docx,.jpg,.png"
  })

  const [refundSettings, setRefundSettings] = useState({
    refundPolicy: "يمكن طلب استرداد الأموال خلال 7 أيام من تاريخ الشراء",
    refundPercentage: "100",
    refundPeriodDays: "7",
    autoRefundEnabled: false
  })

  const handleSaveSettings = (section: string) => {
    // In a real app, this would save to backend
    console.log(`Saving ${section} settings`)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إعدادات النظام"
        description="إدارة إعدادات المنصة والتكاملات"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="payment">الدفع</TabsTrigger>
          <TabsTrigger value="email">البريد</TabsTrigger>
          <TabsTrigger value="sms">الرسائل النصية</TabsTrigger>
          <TabsTrigger value="policies">السياسات</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">اسم الموقع</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">البريد الإلكتروني للتواصل</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">رقم الدعم</Label>
                  <Input
                    id="supportPhone"
                    value={generalSettings.supportPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">الحد الأقصى لحجم الملف (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={generalSettings.maxFileSize}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, maxFileSize: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">وصف الموقع</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">أنواع الملفات المسموحة</Label>
                <Input
                  id="allowedFileTypes"
                  value={generalSettings.allowedFileTypes}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, allowedFileTypes: e.target.value })}
                  placeholder=".pdf,.doc,.jpg,.png"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                />
                <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="registrationEnabled"
                  checked={generalSettings.registrationEnabled}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, registrationEnabled: checked })}
                />
                <Label htmlFor="registrationEnabled">تفعيل التسجيل الجديد</Label>
              </div>

              <Button onClick={() => handleSaveSettings('general')}>
                <Save className="h-4 w-4 mr-2" />
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                إعدادات الدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="paymentProvider">مزود الدفع</Label>
                  <Select value={paymentSettings.provider} onValueChange={(value) => setPaymentSettings({ ...paymentSettings, provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="local">بوابة محلية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select value={paymentSettings.currency} onValueChange={(value) => setPaymentSettings({ ...paymentSettings, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                      <SelectItem value="YER">ريال يمني (YER)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">مفتاح API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={paymentSettings.apiKey}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, apiKey: e.target.value })}
                  placeholder="أدخل مفتاح API"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">سر Webhook</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={paymentSettings.webhookSecret}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, webhookSecret: e.target.value })}
                  placeholder="أدخل سر Webhook"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="testMode"
                  checked={paymentSettings.testMode}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, testMode: checked })}
                />
                <Label htmlFor="testMode">وضع الاختبار</Label>
              </div>

              <Button onClick={() => handleSaveSettings('payment')}>
                <Save className="h-4 w-4 mr-2" />
                حفظ إعدادات الدفع
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                إعدادات البريد الإلكتروني
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emailProvider">مزود البريد</Label>
                  <Select value={emailSettings.provider} onValueChange={(value) => setEmailSettings({ ...emailSettings, provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">البريد المرسل</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">اسم المرسل</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">منفذ SMTP</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailApiKey">مفتاح API</Label>
                <Input
                  id="emailApiKey"
                  type="password"
                  value={emailSettings.apiKey}
                  onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                  placeholder="أدخل مفتاح API"
                />
              </div>

              <Button onClick={() => handleSaveSettings('email')}>
                <Save className="h-4 w-4 mr-2" />
                حفظ إعدادات البريد
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الرسائل النصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smsProvider">مزود الرسائل النصية</Label>
                  <Select value={smsSettings.provider} onValueChange={(value) => setSmsSettings({ ...smsSettings, provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="aws">AWS SNS</SelectItem>
                      <SelectItem value="local">مزود محلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                  <Input
                    id="phoneNumber"
                    value={smsSettings.phoneNumber}
                    onChange={(e) => setSmsSettings({ ...smsSettings, phoneNumber: e.target.value })}
                    placeholder="+966501234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountSid">معرف الحساب</Label>
                <Input
                  id="accountSid"
                  value={smsSettings.accountSid}
                  onChange={(e) => setSmsSettings({ ...smsSettings, accountSid: e.target.value })}
                  placeholder="أدخل معرف الحساب"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authToken">رمز المصادقة</Label>
                <Input
                  id="authToken"
                  type="password"
                  value={smsSettings.authToken}
                  onChange={(e) => setSmsSettings({ ...smsSettings, authToken: e.target.value })}
                  placeholder="أدخل رمز المصادقة"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  checked={smsSettings.enabled}
                  onCheckedChange={(checked) => setSmsSettings({ ...smsSettings, enabled: checked })}
                />
                <Label htmlFor="smsEnabled">تفعيل الرسائل النصية</Label>
              </div>

              <Button onClick={() => handleSaveSettings('sms')}>
                <Save className="h-4 w-4 mr-2" />
                حفظ إعدادات الرسائل
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Settings */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                سياسات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="refundPolicy">سياسة الاسترداد</Label>
                <Textarea
                  id="refundPolicy"
                  value={refundSettings.refundPolicy}
                  onChange={(e) => setRefundSettings({ ...refundSettings, refundPolicy: e.target.value })}
                  rows={4}
                  placeholder="اكتب سياسة الاسترداد"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="refundPercentage">نسبة الاسترداد (%)</Label>
                  <Input
                    id="refundPercentage"
                    type="number"
                    value={refundSettings.refundPercentage}
                    onChange={(e) => setRefundSettings({ ...refundSettings, refundPercentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundPeriodDays">فترة الاسترداد (أيام)</Label>
                  <Input
                    id="refundPeriodDays"
                    type="number"
                    value={refundSettings.refundPeriodDays}
                    onChange={(e) => setRefundSettings({ ...refundSettings, refundPeriodDays: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="autoRefundEnabled"
                    checked={refundSettings.autoRefundEnabled}
                    onCheckedChange={(checked) => setRefundSettings({ ...refundSettings, autoRefundEnabled: checked })}
                  />
                  <Label htmlFor="autoRefundEnabled">الاسترداد التلقائي</Label>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('policies')}>
                <Save className="h-4 w-4 mr-2" />
                حفظ السياسات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}