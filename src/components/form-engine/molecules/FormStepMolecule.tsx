"use client";

import { FormFieldMolecule } from "./FormFieldMolecule";
import type { StepConfig, FieldRuleState } from "@/lib/form-engine/types";

interface Props {
  step: StepConfig;
  ruleStates: Record<string, FieldRuleState>;
  depth?: number;
}

export function FormStepMolecule({ step, ruleStates, depth = 0 }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Nested sub-form label */}
      {depth > 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {step.title}
          </p>
          <div className="flex flex-col gap-5">
            {step.fields?.map((field) =>
              field.type === "submit" ? null : (
                <FormFieldMolecule
                  key={field.id}
                  field={field}
                  ruleState={ruleStates[field.id]}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* Top-level fields */}
      {depth === 0 &&
        step.fields?.map((field) =>
          field.type === "submit" ? null : (
            <FormFieldMolecule
              key={field.id}
              field={field}
              ruleState={ruleStates[field.id]}
            />
          )
        )}

      {/* Recursive child steps (max depth 3) */}
      {depth < 2 &&
        step.steps?.map((child) => (
          <FormStepMolecule
            key={child.id}
            step={child}
            ruleStates={ruleStates}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
