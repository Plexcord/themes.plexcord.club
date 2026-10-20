"use client";

import { MotionConfig } from "motion/react";

// Turns off movement (keeps fades) for visitors with prefers-reduced-motion.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
