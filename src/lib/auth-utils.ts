import { cookies } from "next/headers"

export const getUserIdFromCookies = () => {
  const cookieValue = cookies().get("course_platform_user")?.value
  if (!cookieValue) return null

  try {
    const parsed = JSON.parse(cookieValue)
    return typeof parsed?.id === "string" ? parsed.id : null
  } catch {
    return null
  }
}
