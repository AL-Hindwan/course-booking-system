import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface AdminPageHeaderProps {
    title: string
    description: string
    action?: ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-2">{description}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
