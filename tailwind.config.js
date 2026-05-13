/** @type {import('tailwindcss').Config} */
module.exports = {
  // تحديد المسارات التي سيتم فحصها لاستخراج فئات CSS المستخدمة
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // إعدادات الخطوط لتعزيز الطابع التحريري الفاخر (Editorial UI)
      fontFamily: {
        // Inter للنصوص الوظيفية لضمان أعلى مستويات المقروئية
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        // Playfair Display للعناوين لإضفاء اللمسة الإبداعية الإنسانية
        serif: ["Playfair Display", "Georgia", "serif"],
      },

      // لوحة الألوان المعتمدة للوضع الداكن الفاخر (Premium Dark Mode)
      colors: {
        // الأسود الحبري العميق (Ink Black) لتقليل الإجهاد البصري
        background: "#050505",
        // أسطح المكونات (Cards & Panels) مع شفافية ذكية
        surface: {
          DEFAULT: "#0A0A0B",
          hover: "#0F0F11",
          accent: "rgba(255, 255, 255, 0.03)",
        },
        // ألوان العلامة التجارية (Twassel Brand Colors)
        brand: {
          indigo: "#6366F1",
          fuchsia: "#D946EF",
          muted: "rgba(99, 102, 241, 0.1)",
        }
      },

      // نظام الظلال والتوهج لخلق عمق بصري (Visual Depth)
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-strong': '0 0 40px rgba(99, 102, 241, 0.25)',
        'premium': '0 20px 50px rgba(0, 0, 0, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
      },

      // الحركات المخصصة لإضفاء "اللمسة الإنسانية" (Human Rhythm)
      animation: {
        // حركة طفو بطيئة تجعل العناصر تبدو كأنها تتنفس
        'float-slow': 'float 8s ease-in-out infinite',
        // نبض هادئ للمؤشرات التفاعلية
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // تأثير الشيمر للتحميل الذكي
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(0.5deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },

      // إعدادات الحدود والمسافات الدقيقة (Precision Spacing)
      borderWidth: {
        'thin': '0.5px', // حدود نحيفة جداً لزيادة الرقي البصري
      },
      backdropBlur: {
        'xs': '2px',
        'premium': '20px', // تأثير الزجاج المتجمد الفاخر
      }
    },
  },
  plugins: [],
};