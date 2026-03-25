"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationVariant = "success" | "error" | "info" | "warning";
export type NotificationMode = "toast" | "inline";
export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface NotificationProps {
  /** Whether the notification is visible */
  show: boolean;
  /** Main message text */
  message: string;
  /** Optional title — defaults to the variant label */
  title?: string;
  /** Visual style — success | error | info | warning */
  variant?: NotificationVariant;
  /**
   * toast  → fixed portal, auto-dismisses
   * inline → renders in-place (e.g. above a button row)
   */
  mode?: NotificationMode;
  /**
   * Corner position for toast mode only.
   * Defaults to "top-right".
   */
  position?: ToastPosition;
  /**
   * Auto-dismiss delay in ms.
   * Defaults: toast = 4000ms, inline = 0 (no auto-dismiss).
   * Pass 0 to keep the toast open until manually dismissed.
   */
  duration?: number;
  /** Called after the close animation finishes */
  onDismiss?: () => void;
}

// ─── Variant config ────────────────────────────────────────────────────────────

interface VariantConfig {
  defaultTitle: string;
  /** Outer card border + background for inline */
  inlineContainer: string;
  /** Icon bubble background */
  iconBg: string;
  /** Icon stroke/fill color */
  iconColor: string;
  /** Title color */
  titleColor: string;
  /** Message color */
  messageColor: string;
  /** Icon SVG paths */
  iconPaths: React.ReactNode;
}

const variantConfig: Record<NotificationVariant, VariantConfig> = {
  success: {
    defaultTitle: "Success",
    inlineContainer: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-800",
    messageColor: "text-emerald-700",
    iconPaths: (
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  error: {
    defaultTitle: "Error",
    inlineContainer: "bg-red-50 border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    messageColor: "text-red-700",
    iconPaths: (
      <>
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  info: {
    defaultTitle: "Info",
    inlineContainer: "bg-indigo-50 border-indigo-200",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    titleColor: "text-indigo-800",
    messageColor: "text-indigo-700",
    iconPaths: (
      <>
        <path d="M12 16v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 8h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  warning: {
    defaultTitle: "Warning",
    inlineContainer: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-800",
    messageColor: "text-amber-700",
    iconPaths: (
      <>
        <path
          d="M12 9v4"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 17h.01"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
      </>
    ),
  },
};

// ─── Toast position classes ────────────────────────────────────────────────────

const positionClasses: Record<ToastPosition, string> = {
  "top-right":    "top-5 right-5",
  "top-left":     "top-5 left-5",
  "bottom-right": "bottom-5 right-5",
  "bottom-left":  "bottom-5 left-5",
};

const toastEnterClasses: Record<ToastPosition, string> = {
  "top-right":    "opacity-100 translate-y-0 scale-100",
  "top-left":     "opacity-100 translate-y-0 scale-100",
  "bottom-right": "opacity-100 translate-y-0 scale-100",
  "bottom-left":  "opacity-100 translate-y-0 scale-100",
};

const toastExitClasses: Record<ToastPosition, string> = {
  "top-right":    "opacity-0 -translate-y-3 scale-95 pointer-events-none",
  "top-left":     "opacity-0 -translate-y-3 scale-95 pointer-events-none",
  "bottom-right": "opacity-0 translate-y-3 scale-95 pointer-events-none",
  "bottom-left":  "opacity-0 translate-y-3 scale-95 pointer-events-none",
};

// ─── Close (X) icon ────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Core visual ──────────────────────────────────────────────────────────────

interface NotificationBodyProps {
  message: string;
  title?: string;
  variant: NotificationVariant;
  mode: NotificationMode;
  position: ToastPosition;
  visible: boolean;
  onClose: () => void;
}

function NotificationBody({ message, title, variant, mode, position, visible, onClose }: NotificationBodyProps) {
  const cfg = variantConfig[variant];
  const isToast = mode === "toast";
  const displayTitle = title ?? cfg.defaultTitle;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3.5",
        // Toast: white card with shadow + slide animation
        isToast && [
          "w-[380px] bg-white border-slate-200 shadow-xl shadow-slate-200/70",
          "transition-all duration-300 ease-out",
          visible ? toastEnterClasses[position] : toastExitClasses[position],
        ],
        // Inline: colored tinted card
        !isToast && ["w-full", cfg.inlineContainer],
      )}
    >
      {/* Icon bubble */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-xl w-10 h-10 mt-0.5",
          cfg.iconBg,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("w-5 h-5", cfg.iconColor)}
          aria-hidden="true"
        >
          {cfg.iconPaths}
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-5", cfg.titleColor)}>
          {displayTitle}
        </p>
        <p className={cn("text-sm leading-5 mt-0.5", cfg.messageColor)}>
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className={cn(
          "flex-shrink-0 rounded-lg p-1 mt-0.5 transition-colors",
          isToast
            ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            : cn(cfg.iconColor, "hover:bg-black/10"),
        )}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ─── Notification Molecule ─────────────────────────────────────────────────────

export function NotificationMolecule({
  show,
  message,
  title,
  variant = "info",
  mode = "toast",
  position = "top-right",
  duration,
  onDismiss,
}: NotificationProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default durations: toast = 4 s, inline = no auto-dismiss
  const effectiveDuration = duration !== undefined ? duration : mode === "toast" ? 4000 : 0;

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  useEffect(() => {
    if (show) {
      setVisible(true);
      if (effectiveDuration > 0) {
        timerRef.current = setTimeout(dismiss, effectiveDuration);
      }
    } else {
      setVisible(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, effectiveDuration]);

  if (!show && !visible) return null;

  const body = (
    <NotificationBody
      message={message}
      title={title}
      variant={variant}
      mode={mode}
      position={position}
      visible={visible}
      onClose={dismiss}
    />
  );

  if (mode === "toast") {
    if (typeof document === "undefined") return null;
    return createPortal(
      <div className={cn("fixed z-[9999] pointer-events-none", positionClasses[position])}>
        <div className="pointer-events-auto">{body}</div>
      </div>,
      document.body
    );
  }

  return <div className="w-full">{body}</div>;
}
