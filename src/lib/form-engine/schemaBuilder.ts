import { z } from "zod";
import type { FieldConfig, StepConfig, FieldRuleState } from "./types";

function buildFieldSchema(field: FieldConfig): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "email":
      schema = z.string().email("Invalid email address");
      break;
    case "phone":
      schema = z.string();
      break;
    case "otp-pin":
      schema = z.string().length(field.length ?? 6, `Must be exactly ${field.length ?? 6} digits`);
      break;
    case "slider":
    case "rating": {
      let num = z.number();
      if (field.min !== undefined) num = num.min(field.min);
      if (field.max !== undefined) num = num.max(field.max);
      schema = num;
      break;
    }
    case "checkbox":
      schema = z.boolean();
      break;
    case "multi-select":
      schema = z.array(z.string());
      break;
    case "date-picker":
      schema = z.string();
      break;
    case "file-upload":
    case "image-upload":
      schema = z.any();
      break;
    case "submit":
    case "location-picker":
    case "signature-pad":
      schema = z.any().optional();
      break;
    default:
      schema = z.string();
  }

  // Apply static validationRules from JSON config
  if (field.validationRules) {
    for (const rule of field.validationRules) {
      if (rule.type === "minLength" && typeof rule.value === "number" && schema instanceof z.ZodString) {
        schema = schema.min(rule.value, rule.message);
      }
      if (rule.type === "maxLength" && typeof rule.value === "number" && schema instanceof z.ZodString) {
        schema = schema.max(rule.value, rule.message);
      }
      if (rule.type === "regex" && typeof rule.value === "string" && schema instanceof z.ZodString) {
        schema = schema.regex(new RegExp(rule.value), rule.message);
      }
    }
  }

  // Mark optional if not required
  if (!field.required) {
    if (schema instanceof z.ZodString) {
      schema = schema.optional().or(z.literal(""));
    } else if (!(schema instanceof z.ZodBoolean)) {
      schema = schema.optional();
    }
  } else {
    if (schema instanceof z.ZodString) {
      schema = schema.min(1, `${field.label} is required`);
    }
  }

  return schema;
}

export function buildZodSchema(steps: StepConfig[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  function processStep(step: StepConfig) {
    for (const field of step.fields ?? []) {
      if (field.type === "submit") continue;
      shape[field.id] = buildFieldSchema(field);
    }
    for (const child of step.steps ?? []) {
      processStep(child);
    }
  }

  for (const step of steps) processStep(step);
  return z.object(shape);
}

/** Extends base schema with dynamic SET_VALIDATION rules */
export function buildZodSchemaWithRules(
  steps: StepConfig[],
  ruleStates: Record<string, FieldRuleState>
) {
  const base = buildZodSchema(steps);

  return base.superRefine((data, ctx) => {
    for (const [fieldId, ruleState] of Object.entries(ruleStates)) {
      if (ruleState.isHidden) continue;

      for (const v of ruleState.addedValidations ?? []) {
        const val = (data as Record<string, unknown>)[fieldId];
        if (v.type === "required" && (!val || val === "")) {
          ctx.addIssue({
            path: [fieldId],
            code: z.ZodIssueCode.custom,
            message: v.message,
          });
        }
      }
    }
  });
}

export function buildDefaultValues(steps: StepConfig[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  function processStep(step: StepConfig) {
    for (const field of step.fields ?? []) {
      if (field.type === "submit") continue;
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      } else {
        switch (field.type) {
          case "checkbox":    defaults[field.id] = false; break;
          case "multi-select": defaults[field.id] = []; break;
          case "slider":      defaults[field.id] = field.min ?? 0; break;
          case "rating":      defaults[field.id] = 0; break;
          case "file-upload":
          case "image-upload": defaults[field.id] = null; break;
          default:            defaults[field.id] = "";
        }
      }
    }
    for (const child of step.steps ?? []) processStep(child);
  }

  for (const step of steps) processStep(step);
  return defaults;
}
