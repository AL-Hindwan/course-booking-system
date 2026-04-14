"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import InstituteRoomBookings from "@/app/institute/room-bookings/page"
import { instituteService } from "@/lib/institute-service"
import { getFileUrl } from "@/lib/utils"

interface Hall {
  id: string
  name: string
  capacity: number
  location: string | null
  locationUrl: string | null
  type: string
  hourlyRate: number | string // from backend pricePerHour Decimal
  description: string | null
  image: string | null
  features: string[] // from backend facilities[]
  availability: { day: string; startTime: string; endTime: string }[]
}

export default function InstituteHallsPage() {
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)

  const [editingHall, setEditingHall] = useState<Hall | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<"halls" | "bookings">("halls")
  const [isImageDragging, setIsImageDragging] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const hallImageInputRef = useRef<HTMLInputElement | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadHalls = async () => {
    setLoading(true)
    try {
      const data = await instituteService.getHalls()
      // Map backend fields to frontend interface
      const mappedHalls = data.map((room: any) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        locationUrl: room.locationUrl,
        type: room.type,
        hourlyRate: room.pricePerHour,
        description: room.description,
        image: room.image,
        features: room.facilities || [],
        availability: room.availability || []
      }))
      setHalls(mappedHalls)
    } catch {
      toast.error("فشل تحميل بيانات القاعات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHalls() }, [])

  const createEmptyHall = (): Hall => ({
    id: "",
    name: "",
    type: "قاعة محاضرات",
    location: "",
    locationUrl: "",
    capacity: 0,
    hourlyRate: 0,
    image: "",
    features: [],
    availability: [],
    description: ""
  })

  const isValidMapsUrl = (value: string | null) => {
    if (!value) return true
    try {
      const url = new URL(value)
      if (url.protocol !== "https:") return false
      const host = url.hostname.toLowerCase()
      if (host === "maps.google.com" || host === "maps.app.goo.gl") return true
      if ((host === "google.com" || host === "www.google.com") && url.pathname.startsWith("/maps")) {
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleOpenEdit = (hallId: string) => {
    const hall = halls.find((item) => item.id === hallId)
    if (!hall) return
    setIsCreating(false)
    setEditingHall({ ...hall })
    setSelectedImageFile(null)
    setIsEditOpen(true)
  }

  const handleOpenCreate = () => {
    setIsCreating(true)
    setEditingHall(createEmptyHall())
    setSelectedImageFile(null)
    setIsEditOpen(true)
  }

  useEffect(() => {
    let url = editingHall?.image ?? ""
    setImagePreviewUrl(getFileUrl(url))
  }, [editingHall?.image])

  const handleSaveEdit = async () => {
    if (!editingHall) return
    if (editingHall.locationUrl && !isValidMapsUrl(editingHall.locationUrl)) {
      toast.error("رابط الموقع غير صالح. استخدم رابط Google Maps يبدأ بـ https://")
      return
    }

    setActionLoading(true)
    try {
      const payload = new FormData()
      payload.append("name", editingHall.name)
      payload.append("capacity", String(editingHall.capacity))
      if (editingHall.location) payload.append("location", editingHall.location)
      if (editingHall.locationUrl) payload.append("locationUrl", editingHall.locationUrl)
      payload.append("type", editingHall.type)
      if (editingHall.description) payload.append("description", editingHall.description)
      payload.append("pricePerHour", String(editingHall.hourlyRate))
      payload.append("facilities", JSON.stringify(editingHall.features))
      payload.append("availability", JSON.stringify(editingHall.availability))

      if (selectedImageFile) {
        payload.append("image", selectedImageFile)
      } else if (editingHall.image === "") {
        payload.append("image", "")
      }

      if (isCreating) {
        await instituteService.addHall(payload as any)
        toast.success("تم إضافة القاعة بنجاح")
      } else {
        await instituteService.updateHall(editingHall.id, payload as any)
        toast.success("تم تحديث بيانات القاعة بنجاح")
      }
      setIsEditOpen(false)
      setIsCreating(false)
      loadHalls()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "حدث خطأ أثناء حفظ القاعة")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (hallId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القاعة؟")) return
    try {
      await instituteService.removeHall(hallId)
      toast.success("تم حذف القاعة بنجاح")
      setHalls(prev => prev.filter(h => h.id !== hallId))
      setIsEditOpen(false)
    } catch {
      toast.error("فشل حذف القاعة")
    }
  }

  const handleHallImageFile = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("الملف المحدد ليس صورة. يرجى اختيار صورة مناسبة.")
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setSelectedImageFile(file)
    setEditingHall((prev) => (prev ? { ...prev, image: previewUrl } : prev))
  }

  const editingForm = editingHall

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">إدارة القاعات</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "halls" && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة قاعة
            </Button>
          )}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center w-fit">
            <button
              onClick={() => setActiveTab("halls")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "halls"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              القاعات
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "bookings"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              طلبات الحجز
            </button>
          </div>
        </div>
      </div>

      {activeTab === "halls" && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : halls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="mb-4">لم يتم إضافة قاعات حتى الآن</p>
            <Button onClick={handleOpenCreate} variant="outline">إضافة أول قاعة</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {halls.map((hall) => (
              <div
                key={hall.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-blue-200 dark:bg-slate-900 dark:ring-slate-800"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  {hall.image ? (
                    <img
                      src={getFileUrl(hall.image)}
                      alt={hall.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      لا توجد صورة
                    </div>
                  )}
                  <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                    {hall.type}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {hall.name}
                  </h3>

                  {hall.location && (
                    <p className="mb-4 text-sm text-slate-500 line-clamp-1">
                      {hall.location}
                    </p>
                  )}

                  <div className="mb-6 grid flex-1 grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">السعة</span>
                      <span className="font-medium text-slate-700">{hall.capacity} شخص</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">السعر / ساعة</span>
                      <span className="font-medium text-slate-700">{hall.hourlyRate} ريال</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenEdit(hall.id)}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-blue-600 hover:text-blue-700 border-none shadow-none"
                    variant="outline"
                  >
                    تعديل القاعة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {activeTab === "bookings" && <InstituteRoomBookings />}

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setEditingHall(null)
            setIsCreating(false)
            setIsImageDragging(false)
            setImagePreviewUrl("")
          }
        }}
      >
        <DialogContent
          dir="rtl"
          overlayClassName="bg-black/35"
          className="w-[min(980px,92vw)] max-w-[980px] max-h-[82vh] overflow-hidden p-0 [&>button[data-dialog-close='default']]:hidden"
        >
          <div className="flex h-full max-h-[82vh] flex-col">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
              <DialogHeader className="space-y-1 text-right">
                <DialogTitle>{isCreating ? "إضافة قاعة جديدة" : "تعديل بيانات القاعة"}</DialogTitle>
                <DialogDescription>
                  {isCreating ? "أدخل البيانات الأساسية للقاعة الجديدة" : "حدث البيانات الأساسية للقاعة المختارة"}
                </DialogDescription>
              </DialogHeader>
              <DialogClose className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30">
                <X className="h-4 w-4" />
                <span className="sr-only">إغلاق</span>
              </DialogClose>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {editingForm && (
                <div className="grid gap-6 lg:grid-cols-[320px_1fr] [direction:ltr]">
                  <div className="space-y-3 lg:items-start">
                    <Label className="text-sm font-semibold">صورة القاعة</Label>
                    <div
                      className={`relative aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-dashed bg-slate-50/60 transition-shadow ${isImageDragging ? "ring-2 ring-blue-500 ring-offset-2 border-blue-300" : "border-slate-200"
                        }`}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setIsImageDragging(true)
                      }}
                      onDragLeave={() => setIsImageDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault()
                        setIsImageDragging(false)
                        handleHallImageFile(event.dataTransfer.files?.[0])
                      }}
                      onClick={() => hallImageInputRef.current?.click()}
                    >
                      <input
                        ref={hallImageInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          handleHallImageFile(event.target.files?.[0])
                          event.currentTarget.value = ""
                        }}
                      />

                      {imagePreviewUrl ? (
                        <>
                          <img
                            src={imagePreviewUrl}
                            alt={editingForm.name || "صورة القاعة"}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                          <div className="absolute inset-x-3 bottom-3 flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 bg-white/95 hover:bg-white"
                              onClick={(event) => {
                                event.stopPropagation()
                                hallImageInputRef.current?.click()
                              }}
                            >
                              تغيير
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 bg-white/95 text-slate-700 hover:bg-white"
                              onClick={(event) => {
                                event.stopPropagation()
                                setEditingHall((prev) => (prev ? { ...prev, image: "" } : prev))
                                setImagePreviewUrl("")
                              }}
                            >
                              حذف
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <p className="text-sm font-semibold text-slate-700">اسحب الصورة هنا</p>
                          <span className="text-xs text-slate-400">أو</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-white/90"
                            onClick={(event) => {
                              event.stopPropagation()
                              hallImageInputRef.current?.click()
                            }}
                          >
                            اختيار من الجهاز
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-right" dir="rtl">
                    <div className="grid gap-2">
                      <Label htmlFor="hall-name">اسم القاعة</Label>
                      <Input
                        id="hall-name"
                        dir="rtl"
                        className="h-11 text-right"
                        value={editingForm.name}
                        onChange={(event) =>
                          setEditingHall((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="hall-capacity">السعة</Label>
                        <Input
                          id="hall-capacity"
                          type="number"
                          dir="rtl"
                          className="h-11 text-right"
                          value={editingForm.capacity || ""}
                          onChange={(event) =>
                            setEditingHall((prev) =>
                              prev ? { ...prev, capacity: Number(event.target.value) } : prev
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hall-rate">السعر بالساعة</Label>
                        <Input
                          id="hall-rate"
                          type="number"
                          dir="rtl"
                          className="h-11 text-right"
                          value={editingForm.hourlyRate || ""}
                          onChange={(event) =>
                            setEditingHall((prev) =>
                              prev ? { ...prev, hourlyRate: Number(event.target.value) } : prev
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Label className="text-sm font-semibold">الموقع</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="hall-location-text">نص الموقع</Label>
                          <Input
                            id="hall-location-text"
                            dir="rtl"
                            className="h-11 text-right"
                            placeholder="مثال: صنعاء - التحرير - شارع الزبيري"
                            value={editingForm.location || ""}
                            onChange={(event) =>
                              setEditingHall((prev) =>
                                prev ? { ...prev, location: event.target.value } : prev
                              )
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="hall-location-url">رابط الموقع (Google Maps)</Label>
                          <Input
                            id="hall-location-url"
                            type="url"
                            dir="ltr"
                            className="h-11 text-right"
                            placeholder="https://maps.app.goo.gl/..."
                            value={editingForm.locationUrl || ""}
                            onChange={(event) =>
                              setEditingHall((prev) =>
                                prev ? { ...prev, locationUrl: event.target.value } : prev
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="hall-type">نوع القاعة</Label>
                      <Select
                        value={editingForm.type}
                        onValueChange={(value) =>
                          setEditingHall((prev) =>
                            prev ? { ...prev, type: value } : prev
                          )
                        }
                      >
                        <SelectTrigger id="hall-type" className="h-11 text-right">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="قاعة محاضرات">قاعة محاضرات</SelectItem>
                          <SelectItem value="قاعة اجتماعات">قاعة اجتماعات</SelectItem>
                          <SelectItem value="معمل">معمل</SelectItem>
                          <SelectItem value="ورشة عمل">ورشة عمل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="hall-description">وصف القاعة</Label>
                      <Textarea
                        id="hall-description"
                        dir="rtl"
                        className="min-h-[96px] text-right"
                        rows={4}
                        value={editingForm.description || ""}
                        onChange={(event) =>
                          setEditingHall((prev) =>
                            prev ? { ...prev, description: event.target.value } : prev
                          )
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>المميزات</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {["wifi", "projector", "screen", "computers"].map((feature) => (
                          <label key={feature} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={editingForm.features.includes(feature)}
                              onCheckedChange={(checked) => {
                                setEditingHall((prev) => {
                                  if (!prev) return prev
                                  const next = checked
                                    ? [...prev.features, feature]
                                    : prev.features.filter((item) => item !== feature)
                                  return { ...prev, features: next }
                                })
                              }}
                            />
                            <span>
                              {feature === "wifi"
                                ? "WiFi"
                                : feature === "projector"
                                  ? "بروجكتر"
                                  : feature === "screen"
                                    ? "شاشة"
                                    : "أجهزة"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">أوقات العمل المتاحة للرواق</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingHall(prev => prev ? { ...prev, availability: [...prev.availability, { day: "SUNDAY", startTime: "08:00", endTime: "16:00" }] } : prev)}
                        >
                          <Plus className="h-4 w-4 ml-1" /> إضافة فترة
                        </Button>
                      </div>
                      {(!editingForm.availability || editingForm.availability.length === 0) ? (
                        <p className="text-sm text-gray-500">لم يتم تحديد أوقات. سيتم اعتبار القاعة متاحة دائماً ما لم يتم تحديد ساعات عمل.</p>
                      ) : (
                        <div className="space-y-3">
                          {editingForm.availability.map((period, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Select
                                value={period.day}
                                onValueChange={(val) => {
                                  setEditingHall(prev => {
                                    if (!prev) return prev;
                                    const newAv = [...prev.availability];
                                    newAv[index].day = val;
                                    return { ...prev, availability: newAv };
                                  });
                                }}
                              >
                                <SelectTrigger className="w-[130px] h-10 text-right" dir="rtl">
                                  <SelectValue placeholder="اليوم" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {[
                                    { value: "SUNDAY", label: "الأحد" },
                                    { value: "MONDAY", label: "الإثنين" },
                                    { value: "TUESDAY", label: "الثلاثاء" },
                                    { value: "WEDNESDAY", label: "الأربعاء" },
                                    { value: "THURSDAY", label: "الخميس" },
                                    { value: "FRIDAY", label: "الجمعة" },
                                    { value: "SATURDAY", label: "السبت" },
                                  ].map(d => (
                                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="time"
                                className="w-24 h-10 text-center"
                                value={period.startTime}
                                onChange={(e) => {
                                  setEditingHall(prev => {
                                    if (!prev) return prev;
                                    const newAv = [...prev.availability];
                                    newAv[index].startTime = e.target.value;
                                    return { ...prev, availability: newAv };
                                  });
                                }}
                              />
                              <span className="text-gray-500">-</span>
                              <Input
                                type="time"
                                className="w-24 h-10 text-center"
                                value={period.endTime}
                                onChange={(e) => {
                                  setEditingHall(prev => {
                                    if (!prev) return prev;
                                    const newAv = [...prev.availability];
                                    newAv[index].endTime = e.target.value;
                                    return { ...prev, availability: newAv };
                                  });
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 shrink-0"
                                onClick={() => {
                                  setEditingHall(prev => {
                                    if (!prev) return prev;
                                    const newAv = [...prev.availability];
                                    newAv.splice(index, 1);
                                    return { ...prev, availability: newAv };
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex justify-between items-center w-full">
                {!isCreating && (
                  <Button variant="destructive" onClick={() => handleDelete(editingForm!.id)}>
                    حذف القاعة
                  </Button>
                )}
                <div className="flex gap-2 mr-auto">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={actionLoading || !editingForm?.name}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
