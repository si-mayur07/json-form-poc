"use client";

import { useController, useFormContext } from "react-hook-form";
import {
  TextInput,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  MultiSelect,
  OTPInput,
  Rating,
  Slider,
} from "../atoms";
import type { FieldConfig, FieldRuleState, SelectOption } from "@/lib/form-engine/types";
import { cn } from "@/lib/utils";

interface Props {
  field: FieldConfig;
  ruleState?: FieldRuleState;
}

export function FormFieldMolecule({ field, ruleState }: Props) {
  const isHidden = ruleState?.isHidden ?? false;
  const isDisabled = ruleState?.isDisabled ?? false;

  const {
    formState: { errors },
  } = useFormContext();

  const { field: rhf } = useController({
    name: field.id,
    defaultValue: field.defaultValue,
  });

  if (isHidden) return null;
  if (field.type === "submit") return null;

  const hasError = !!errors[field.id];
  const errorMsg = errors[field.id]?.message as string | undefined;

  // Dynamic options from rules engine, fallback to static options
  const options: SelectOption[] = ruleState?.dynamicOptions ?? field.options ?? [];

  const renderInput = () => {
    switch (field.type) {
      case "text":
        return (
          <TextInput
            id={field.id}
            type="text"
            placeholder={field.placeholder}
            disabled={isDisabled}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "email":
        return (
          <TextInput
            id={field.id}
            type="email"
            placeholder={field.placeholder}
            disabled={isDisabled}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "phone":
        return (
          <TextInput
            id={field.id}
            type="tel"
            placeholder={field.placeholder}
            disabled={isDisabled}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "password":
        return (
          <TextInput
            id={field.id}
            type="password"
            placeholder={field.placeholder}
            disabled={isDisabled}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            rows={field.rows ?? 3}
            disabled={isDisabled}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "single-select":
        return (
          <Select
            id={field.id}
            options={options}
            placeholder={field.placeholder ?? "Select…"}
            disabled={isDisabled || options.length === 0}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "multi-select":
        return (
          <MultiSelect
            options={options}
            value={rhf.value ?? []}
            onChange={rhf.onChange}
            disabled={isDisabled}
            hasError={hasError}
          />
        );

      case "checkbox":
        return (
          <Checkbox
            id={field.id}
            label={field.label}
            disabled={isDisabled}
            hasError={hasError}
            checked={rhf.value ?? false}
            onChange={rhf.onChange}
            onBlur={rhf.onBlur}
          />
        );

      case "radio":
        return (
          <RadioGroup
            name={field.id}
            value={rhf.value ?? ""}
            onChange={(v) => rhf.onChange(v)}
            options={options}
            disabled={isDisabled}
            hasError={hasError}
          />
        );

      case "date-picker":
        return (
          <TextInput
            id={field.id}
            type="date"
            disabled={isDisabled}
            hasError={hasError}
            {...rhf}
            value={rhf.value ?? ""}
          />
        );

      case "otp-pin":
        return (
          <OTPInput
            length={field.length ?? 6}
            value={rhf.value ?? ""}
            onChange={rhf.onChange}
            disabled={isDisabled}
            hasError={hasError}
          />
        );

      case "rating":
        return (
          <Rating
            max={field.max ?? 5}
            value={rhf.value ?? 0}
            onChange={rhf.onChange}
            disabled={isDisabled}
            hasError={hasError}
          />
        );

      case "slider":
        return (
          <Slider
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={rhf.value ?? 0}
            onChange={rhf.onChange}
            disabled={isDisabled}
          />
        );

      case "file-upload":
      case "image-upload":
        return (
          <div
            className={cn(
              "flex items-center justify-center w-full rounded-xl border-2 border-dashed p-6 text-sm text-slate-400 transition-colors",
              hasError ? "border-red-300" : "border-slate-200 hover:border-indigo-300",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <label className={cn("cursor-pointer text-center", isDisabled && "cursor-not-allowed")}>
              <span className="block text-2xl mb-1">
                {field.type === "image-upload" ? "🖼" : "📎"}
              </span>
              <span className="text-indigo-500 font-medium">Click to upload</span>
              {field.accept && (
                <span className="block text-xs text-slate-400 mt-1">{field.accept}</span>
              )}
              <input
                type="file"
                accept={field.accept}
                disabled={isDisabled}
                onChange={(e) => rhf.onChange(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>
        );

      case "location-picker":
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 italic">
            📍 Location picker — coming soon
          </div>
        );

      case "signature-pad":
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 italic">
            ✍️ Signature pad — coming soon
          </div>
        );

      default:
        return null;
    }
  };

  // Checkbox renders its own label
  const isCheckbox = field.type === "checkbox";

  return (
    <div className="flex flex-col gap-1.5">
      {!isCheckbox && (
        <label
          htmlFor={field.id}
          className="text-sm font-medium text-slate-700 flex items-center gap-1"
        >
          {field.label}
          {field.required && (
            <span className="text-red-400 text-xs">*</span>
          )}
        </label>
      )}

      {renderInput()}

      {/* Error message */}
      {hasError && errorMsg && (
        <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          {errorMsg}
        </p>
      )}

      {/* Help text */}
      {field.helpText && !hasError && (
        <p className="text-xs text-slate-400">{field.helpText}</p>
      )}
    </div>
  );
}
