"use client";

import { motion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Retraso en segundos antes de la entrada (stagger entre secciones/cards). */
  delay?: number;
  className?: string;
}

/**
 * Wrapper de entrada al hacer scroll (design D2: micro-interacción
 * `whileInView` para headings/secciones). `MotionConfig reducedMotion="user"`
 * respeta prefers-reduced-motion (spec premium-design).
 */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}