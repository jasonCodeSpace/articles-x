"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { ReactNode } from "react"

interface FadeInProps extends HTMLMotionProps<"div"> {
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
    ...props
}: FadeInProps) {
    const directions = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
        none: { x: 0, y: 0 },
    }

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directions[direction],
            }}
            whileInView={{
                opacity: 1,
                x: 0,
                y: 0,
            }}
            viewport={{ once: true }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            {...props}
        >
            {children}
        </motion.div>
    )
}

export function StaggerContainer({
    children,
    staggerChildren = 0.1,
    delayChildren = 0,
    ...props
}: {
    children: ReactNode
    staggerChildren?: number
    delayChildren?: number
} & HTMLMotionProps<"div">) {
    return (
        <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
                animate: {
                    transition: {
                        staggerChildren,
                        delayChildren,
                    },
                },
            }}
            {...props}
        >
            {children}
        </motion.div>
    )
}
