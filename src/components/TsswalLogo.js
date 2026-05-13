"use client";

import React from "react";
import { motion } from "framer-motion";

export default function TsswalLogo({ size = 24, className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-700"
      >
        <path d="M20 35 H80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <path d="M50 35 V85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <motion.circle
          cx="50"
          cy="35"
          r="8"
          fill="#6366F1"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}