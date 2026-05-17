"use client";

import React from "react";
import {
  Code2 as Github,
  Briefcase as Linkedin,
  Globe,
  Link as LinkIcon,
  Globe as TwitterIcon,
  Camera as InstagramIcon,
  PlaySquare as YoutubeIcon,
  Mail,
} from "lucide-react";

const ICONS = {
  github: Github,
  linkedin: Linkedin,
  globe: Globe,
  portfolio: Globe,
  website: Globe,
  link: LinkIcon,
  twitter: TwitterIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  mail: Mail,
  email: Mail,
};

function resolveIcon(iconName) {
  if (!iconName) return LinkIcon;
  const key = String(iconName).toLowerCase();
  return ICONS[key] || LinkIcon;
}

export default function LinkField({
  label,
  iconName,
  value = "",
  onChange,
  placeholder = "https://",
}) {
  const Icon = resolveIcon(iconName);

  return (
    <label className="block group">
      {label && (
        <span className="block mb-1.5 font-serif italic text-[12px] text-ink-muted dark:text-slate-300">
          {label}
        </span>
      )}

      <div
        className="flex items-center gap-3 px-3
                   bg-cream dark:bg-white/5
                   border border-sand dark:border-white/10
                   rounded-xl
                   transition-all duration-300 ease-out
                   focus-within:border-accent
                   focus-within:ring-2 focus-within:ring-accent/20
                   focus-within:bg-cream/70
                   focus-within:shadow-soft"
        style={{ borderColor: undefined }}
      >
        <Icon
          size={16}
          className="flex-shrink-0 text-ink-faint
                     transition-colors duration-300
                     group-focus-within:text-accent"
          style={{ /* accent color is #7c83f2 via the `accent` token */ }}
        />
        <input
          type="url"
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={label || iconName || "link"}
          className="flex-1 py-3 bg-transparent text-sm
                     text-ink dark:text-white
                     placeholder:text-ink-faint
                     focus:outline-none
                     transition-all duration-300"
        />
      </div>
    </label>
  );
}
