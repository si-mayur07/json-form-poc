// ─── Field Types ───────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "password"
  | "textarea"
  | "single-select"
  | "multi-select"
  | "checkbox"
  | "radio"
  | "date-picker"
  | "file-upload"
  | "image-upload"
  | "otp-pin"
  | "rating"
  | "slider"
  | "location-picker"
  | "signature-pad"
  | "submit";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  type: "required" | "regex" | "minLength" | "maxLength" | "min" | "max" | "email" | "phone" | "custom";
  value?: string | number | boolean;
  message: string;
}

export interface ThemeTokens {
  primaryColor?: string;
  secondaryColor?: string;
  errorColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  scaleType?: "cover" | "contain" | "fill" | "none";
}

export interface FieldConfig {
  id: string;
  name?: string; // backend submit key — defaults to id
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  required?: boolean;
  theme?: ThemeTokens;
  validationRules?: ValidationRule[];
  options?: SelectOption[];
  rows?: number;
  length?: number;
  min?: number;
  max?: number;
  step?: number;
  format?: string;
  accept?: string;
  maxSize?: number;
  _rulesRef?: string[];
  _placeholder?: boolean;
}

export interface StepConfig {
  id: string;
  title: string;
  order: number;
  theme?: ThemeTokens;
  fields: FieldConfig[];
  steps?: StepConfig[];
  lookupTables?: Record<string, Record<string, SelectOption[]>>;
}

// ─── Rules ─────────────────────────────────────────────────────────────────────

export type RuleAction = "SHOW" | "HIDE" | "ENABLE" | "DISABLE" | "POPULATE_OPTIONS" | "SET_VALIDATION";

export interface BaseRule {
  id: string;
  action: RuleAction;
  targetFieldId: string;
  condition?: Record<string, unknown>;
}

export interface ShowHideRule extends BaseRule {
  action: "SHOW" | "HIDE";
}

export interface EnableDisableRule extends BaseRule {
  action: "ENABLE" | "DISABLE";
}

export interface PopulateOptionsRule extends BaseRule {
  action: "POPULATE_OPTIONS";
  source: "lookupTable" | "api";
  // lookupTable source
  lookupTableKey?: string;
  lookupKeyField?: string;
  // api source
  apiUrl?: string;
  debounceMs?: number;
  valuePath?: string;
  labelPath?: string;
  /**
   * Field IDs to reset (clear their value) when `lookupKeyField` changes.
   * Use this to cascade resets down a dependency chain
   * (e.g. resetting city when country changes, beyond just the immediate target field).
   */
  resetOnChange?: string[];
}

export interface SetValidationRule extends BaseRule {
  action: "SET_VALIDATION";
  operation: "add" | "remove";
  validation?: ValidationRule;
  validationType?: string;
}

export type RuleSchema = ShowHideRule | EnableDisableRule | PopulateOptionsRule | SetValidationRule;

// ─── Submission ─────────────────────────────────────────────────────────────────

export interface SubmissionConfig {
  submitEndpoint: string;
  partialSubmitEndpoint?: string;
  excludeHiddenFromPayload: boolean;
  includeDisabledInPayload: boolean;
  attachFederationId: boolean;
  attachSubmissionId: boolean;
}

// ─── Prefetch ────────────────────────────────────────────────────────────────────

export interface PrefetchConfig {
  /**
   * API endpoint that returns an object of { fieldId: value } pairs.
   * Called once on mount to pre-populate the form (e.g. edit/resume flows).
   */
  endpoint: string;
  /**
   * Optional key remapping: { responseKey: fieldId }.
   * Use when the API response keys don't match field IDs.
   * e.g. { "first_name": "fullName" } maps response.first_name → form field "fullName"
   */
  fieldMap?: Record<string, string>;
}

// ─── Top-level Form Config ──────────────────────────────────────────────────────

export interface FormConfig {
  $schema?: string;
  version: string;
  formId: string;
  federationId: string;
  theme?: ThemeTokens;
  prefetch?: PrefetchConfig;
  submission: SubmissionConfig;
  steps: StepConfig[];
  rules: RuleSchema[];
}

// ─── Runtime State ──────────────────────────────────────────────────────────────

export interface FieldRuleState {
  isHidden: boolean;
  isDisabled: boolean;
  dynamicOptions?: SelectOption[];
  isLoadingOptions?: boolean;
  optionsError?: string;
  addedValidations?: ValidationRule[];
}
