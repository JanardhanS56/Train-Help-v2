"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AppTemplateProps {
  children: ReactNode;
}

export default function AppTemplate({ children }: AppTemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1], // Custom smooth ease-out curve
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
