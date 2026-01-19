"use client"

import { ReactNode, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    delay?: number
    direction?: "up" | "down" | "left" | "right" | "none"
    distance?: number
}

// No animation for maximum speed - just render children directly
export function FadeIn({
    children,
    className = "",
    ...props
}: FadeInProps) {
    return (
        <div className={className} {...props}>
            {children}
        </div>
    )
}

export function StaggerContainer({
    children,
    className = "",
    ...props
}: {
    children: ReactNode
} & HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={className} {...props}>
            {children}
        </div>
    )
}
