"use client"

import { ReactNode, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    delay?: number
    direction?: "up" | "down" | "left" | "right" | "none"
    distance?: number
}

export function FadeIn({
    children,
    delay = 0,
    direction = "up",
    distance = 20,
    className = "",
    style,
    ...props
}: FadeInProps) {
    // For left/right animations
    if (direction === "left" || direction === "right") {
        const translateX = direction === "left" ? distance : -distance
        return (
            <div
                className={cn("animate-fade-in-up", className)}
                style={{
                    animationDelay: `${delay}s`,
                    transform: `translateX(${translateX}px)`,
                    opacity: 0,
                    animationFillMode: "both",
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        )
    }

    const distanceValue = direction === "down" ? -distance : distance

    return (
        <div
            className={cn("animate-fade-in-up", className)}
            style={{
                animationDelay: delay > 0 ? `${delay}s` : undefined,
                ["--distance" as string]: `${distanceValue}px`,
                ...style,
            }}
            {...props}
        >
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
