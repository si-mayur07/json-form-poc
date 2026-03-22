"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Shared base classes ────────────────────────────────────────────────────────
const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100";

const errorBase = "border-red-300 focus:border-red-400 focus:ring-red-100";

// ─── TextInput ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputBase, hasError && errorBase, className)}
      {...props}
    />
  )
);
TextInput.displayName = "TextInput";

// ─── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        inputBase,
        "min-h-[96px] resize-y leading-relaxed",
        hasError && errorBase,
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ─── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, options, placeholder, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        inputBase,
        "cursor-pointer appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]",
        hasError && errorBase,
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = "Select";

// ─── Checkbox ─────────────────────────────────────────────────────────────────
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hasError?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hasError, className, ...props }, ref) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 border-slate-300 bg-white transition-all duration-150",
            "peer-checked:bg-indigo-500 peer-checked:border-indigo-500",
            "peer-focus-visible:ring-3 peer-focus-visible:ring-indigo-100",
            "peer-disabled:bg-slate-50 peer-disabled:border-slate-200",
            "group-hover:border-indigo-400",
            hasError && "border-red-300"
          )}
        />
        <svg
          className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 10l3.5 3.5 6.5-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-sm text-slate-700 select-none">{label}</span>
    </label>
  )
);
Checkbox.displayName = "Checkbox";

// ─── RadioGroup ────────────────────────────────────────────────────────────────
interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  hasError?: boolean;
}

export function RadioGroup({ name, value, onChange, options, disabled, hasError }: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex items-center gap-3 cursor-pointer group",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="relative flex-shrink-0">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 border-slate-300 bg-white transition-all duration-150",
                "peer-checked:border-indigo-500",
                "group-hover:border-indigo-400",
                hasError && "border-red-300"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 scale-0 peer-checked:scale-100 transition-transform" />
            </div>
          </div>
          <span className="text-sm text-slate-700 select-none">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────
interface MultiSelectProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function MultiSelect({ options, value = [], onChange, disabled, hasError }: MultiSelectProps) {
  const toggle = (v: string) => {
    if (disabled) return;
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-all duration-150 cursor-pointer",
              selected
                ? "bg-indigo-500 border-indigo-500 text-white font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600",
              disabled && "cursor-not-allowed opacity-50",
              hasError && !selected && "border-red-300"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── OTP Pin Input ────────────────────────────────────────────────────────────
interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function OTPInput({ length = 6, value = "", onChange, disabled, hasError }: OTPInputProps) {
  const refs = Array.from({ length }, () =>
    React.createRef<HTMLInputElement>()
  );

  const chars = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (idx: number, char: string) => {
    const next = [...chars];
    next[idx] = char.slice(-1);
    onChange(next.join(""));
    if (char && idx < length - 1) refs[idx + 1]?.current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !chars[idx] && idx > 0) {
      refs[idx - 1]?.current?.focus();
    }
  };

  return (
    <div className="flex gap-2">
      {chars.map((char, idx) => (
        <input
          key={idx}
          ref={refs[idx]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={char}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className={cn(
            "w-11 h-13 rounded-xl border text-center text-lg font-semibold text-slate-800 transition-all duration-150 outline-none",
            "focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100",
            char ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white",
            hasError && "border-red-300 focus:ring-red-100",
            disabled && "bg-slate-50 text-slate-400 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}

// ─── Rating ───────────────────────────────────────────────────────────────────
interface RatingProps {
  max?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function Rating({ max = 5, value = 0, onChange, disabled, hasError }: RatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={cn(
              "w-9 h-9 transition-all duration-100 focus:outline-none",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
            )}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={filled ? "#f59e0b" : "none"}
                stroke={filled ? "#f59e0b" : hasError ? "#fca5a5" : "#d1d5db"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({ min = 0, max = 100, step = 1, value = 0, onChange, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #6366f1 ${pct}%, #e2e8f0 ${pct}%)`,
        }}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-sm font-semibold text-indigo-600 tabular-nums min-w-[3ch]">
        {value}
      </span>
    </div>
  );
}
