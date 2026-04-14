"use client"

import { useParams } from "next/navigation"
import CourseStudentsManager from "@/components/courses/course-students-manager"
import { trainerService } from "@/lib/trainer-service"

export default function TrainerCourseStudentsPage() {
  const params = useParams()
  const courseId = params.id as string

  return (
    <CourseStudentsManager
      courseId={courseId}
      backLink={`/trainer/courses/${courseId}`}
      backText="العودة للدورة"
      fetchStudentsOverride={(id) => trainerService.getCourseStudents(id)}
      unenrollOverride={(cId, enrollmentId, reason) => trainerService.unenrollStudent(cId, enrollmentId, reason)}
    />
  )
}
