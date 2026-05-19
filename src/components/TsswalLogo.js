"use client";

import React from "react";
import { motion } from "framer-motion";

export default function TsswalLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* خلفية مربعة ناعمة */}
      <rect x="4" y="4" width="92" height="92" rx="26" fill="currentColor" fillOpacity="0.12" />

      {/* خطوط شكل حرف T */}
      {/* الشريط الأفقي العلوي */}
      <line x1="22" y1="28" x2="78" y2="28" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      {/* الساق العمودية */}
      <line x1="50" y1="28" x2="50" y2="76" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />

      {/* النقطة العلوية اليسرى */}
      <circle cx="22" cy="28" r="9" fill="currentColor" />

      {/* النقطة العلوية اليمنى */}
      <circle cx="78" cy="28" r="9" fill="currentColor" />

      {/* النقطة السفلية */}
      <circle cx="50" cy="76" r="9" fill="currentColor" />

      {/* نقطة المركز — متحركة */}
      <motion.circle
        cx="50"
        cy="52"
        r="6"
        fill="currentColor"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
