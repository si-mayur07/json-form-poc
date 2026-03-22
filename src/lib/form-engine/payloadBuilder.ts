import type { FormConfig, FieldRuleState, StepConfig, FieldConfig } from "./types";

function collectFields(steps: StepConfig[]): FieldConfig[] {
  const fields: FieldConfig[] = [];
  const walk = (s: StepConfig) => {
    for (const f of s.fields ?? []) fields.push(f);
    for (const child of s.steps ?? []) walk(child);
  };
  steps.forEach(walk);
  return fields;
}

export function buildSubmitPayload(
  formValues: Record<string, unknown>,
  config: FormConfig,
  ruleStates: Record<string, FieldRuleState>,
  options: { federationId: string; submissionId?: string }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const allFields = collectFields(config.steps);
  const fieldMap = Object.fromEntries(allFields.map((f) => [f.id, f]));

  for (const [fieldId, value] of Object.entries(formValues)) {
    const fieldConfig = fieldMap[fieldId];
    if (!fieldConfig) continue;
    if (fieldConfig.type === "submit") continue;

    const state = ruleStates[fieldId];

    // Exclude hidden fields if configured
    if (config.submission.excludeHiddenFromPayload && state?.isHidden) continue;

    // Use name (backend key) if provided, else fallback to id
    const submitKey = fieldConfig.name ?? fieldId;
    payload[submitKey] = value;
  }

  if (config.submission.attachFederationId) {
    payload.federationId = options.federationId;
  }
  if (config.submission.attachSubmissionId && options.submissionId) {
    payload.submissionId = options.submissionId;
  }

  return payload;
}
