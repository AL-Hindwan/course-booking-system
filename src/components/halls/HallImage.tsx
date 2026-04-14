"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"
import { getFileUrl } from "@/lib/utils"

interface HallImageProps {
    src: string | null | undefined
    alt: string
    fill?: boolean
    className?: string
    sizes?: string
}

export function HallImage({ src, alt, fill = true, className, sizes }: HallImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(getFileUrl(src) || "")
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        setImgSrc(getFileUrl(src) || "")
        setHasError(false)
    }, [src])

    if (!imgSrc || hasError) {
        return (
            <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
                <ImageOff className="h-10 w-10 opacity-30" />
            </div>
        )
    }

    return (
        <Image
            src={imgSrc}
            alt={alt}
            fill={fill}
            unoptimized
            sizes={sizes}
            className={className}
            onError={() => setHasError(true)}
        />
    )
}
