import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'تاريخ غير صالح'

  const formatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  })
  const parts = formatter.formatToParts(d)
  const day = parts.find(p => p.type === 'day')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const year = parts.find(p => p.type === 'year')?.value

  return `${day} ${month} ${year}`
}

export function getFileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  const trimmedPath = path.trim()
  if (trimmedPath.startsWith("http") || trimmedPath.startsWith("blob:")) return trimmedPath

  const getBase = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:5000';
  };
  const apiBase = getBase().replace(/\/$/, "")
  const cleanPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`

  return `${apiBase}${cleanPath}`
}

export function formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(date)
  return d.toLocaleTimeString('ar-EG-u-nu-latn', {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  })
}
