"use client";
import { FiFile, FiImage, FiDownload, FiFileText } from "react-icons/fi";

/**
 * MessageAttachment — affiche une image ou un fichier joint à un message.
 *
 *   <MessageAttachment
 *     imageUrl={msg.imageUrl}
 *     fileUrl={msg.fileUrl}
 *     fileName={msg.fileName}
 *     fileType={msg.fileType}
 *   />
 */
export default function MessageAttachment({ imageUrl, fileUrl, fileName, fileType }) {
  // ── Cas image ──
  if (imageUrl) {
    return (
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-xs rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400/40 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Image jointe"
          className="w-full h-auto max-h-80 object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  // ── Cas fichier générique ──
  if (fileUrl) {
    const ext = (fileName?.split(".").pop() || "").toLowerCase();
    const Icon = pickIcon(fileType, ext);
    const label = fileName || "Fichier";

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName || true}
        className="flex items-center gap-3 max-w-xs px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-indigo-400/40 hover:bg-white/[0.06] transition-colors group"
      >
        <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-indigo-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{label}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {ext || fileType || "Fichier"}
          </p>
        </div>
        <FiDownload
          size={14}
          className="text-slate-500 group-hover:text-indigo-300 transition-colors shrink-0"
        />
      </a>
    );
  }

  return null;
}

function pickIcon(mime, ext) {
  if (!mime && !ext) return FiFile;
  if (mime?.startsWith("image/")) return FiImage;
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return FiFileText;
  return FiFile;
}
