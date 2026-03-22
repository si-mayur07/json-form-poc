"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useRef } from "react";
import {
  buildZodSchemaWithRules,
  buildDefaultValues,
  FormRulesEngine,
  buildSubmitPayload,
} from "@/lib/form-engine";
import type { FormConfig, FieldRuleState } from "@/lib/form-engine/types";
import { FormStepMolecule } from "../molecules/FormStepMolecule";
import { cn } from "@/lib/utils";

interface Props {
  config: FormConfig;
}

export function FormRendererOrganism({ config }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | undefined>();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayload, setSubmittedPayload] = useState<Record<string, unknown> | null>(null);

  const defaultValues = useMemo(() => buildDefaultValues(config.steps), [config]);
  console.log("defaultValues", defaultValues);
  const rulesEngine = useMemo(() => new FormRulesEngine(config.rules), [config.rules]);
  console.log("rulesEngine", rulesEngine);

  const currentStep = config.steps[currentStepIndex];
  const isLastStep = currentStepIndex === config.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Hold the latest dynamic schema in a ref so the stable resolver
  // always validates against the most-recent schema without re-creating useForm.
  const schemaRef = useRef(buildZodSchemaWithRules(config.steps, {}));
  console.log("schemaRef", schemaRef.current);

  const methods = useForm({
    defaultValues,
    mode: "onTouched",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: (values, context, options) => {
      console.log("[FormEngine] Resolver called — values:", values);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return zodResolver(schemaRef.current)(values, context, options as any);
    },
  });

  const { watch, handleSubmit, trigger, formState: { errors, isSubmitting } } = methods;
  const allValues = watch();

  // Evaluate rules on every render (values-driven, cheap)
  const ruleStates: Record<string, FieldRuleState> = useMemo(
    () => rulesEngine.evaluate(allValues as Record<string, unknown>, currentStep.lookupTables),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(allValues), currentStep.id]
  );

  // Dynamic schema including SET_VALIDATION rules
  const dynamicSchema = useMemo(
    () => buildZodSchemaWithRules(config.steps, ruleStates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(ruleStates)]
  );

  // Keep the resolver's schema ref in sync with the latest dynamic schema
  schemaRef.current = dynamicSchema;
  console.log("[FormEngine] dynamicSchema synced — ruleStates:", ruleStates);

  // Collect current step field ids for per-step validation
  function getCurrentStepFieldIds(): string[] {
    const ids: string[] = [];
    const walk = (step: typeof currentStep) => {
      for (const f of step.fields ?? []) {
        if (f.type !== "submit" && !ruleStates[f.id]?.isHidden) ids.push(f.id);
      }
      for (const child of step.steps ?? []) walk(child);
    };
    walk(currentStep);
    return ids;
  }

  async function handleNext() {
    console.log("handleNext");
    const fieldIds = getCurrentStepFieldIds();
    console.log("fieldIds", fieldIds);
    const values = methods.getValues();
    console.log("values", values);

    // Manually validate current step fields against dynamic schema
    const result = dynamicSchema.safeParse(values);
    console.log(
      "[FormEngine] handleNext — safeParse",
      result.success ? "✅ VALID" : "❌ INVALID",
      result.success ? "" : result.error.issues
    );
    let stepValid = true;

    if (!result.success) {
      const relevantErrors = result.error.issues.filter((issue) =>
        fieldIds.includes(String(issue.path[0]))
      );
      console.log("[FormEngine] handleNext — relevant step errors:", relevantErrors);
      if (relevantErrors.length > 0) {
        stepValid = false;
        // Trigger validation to show errors on screen via the resolver
        await trigger(fieldIds as Parameters<typeof trigger>[0]);
      }
    }

    if (!stepValid) return;

    setCurrentStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setCurrentStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: Record<string, unknown>) {
    setSubmitError(null);

    const payload = buildSubmitPayload(
      values,
      config,
      ruleStates,
      { federationId: config.federationId, submissionId }
    );
    console.log("payload", payload);
    try {
      // In demo mode, just show the payload
      await new Promise((r) => setTimeout(r, 10000)); // simulate network
      setSubmittedPayload(payload);
      setSubmitSuccess(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
  }

  if (submitSuccess && submittedPayload) {
    return <SuccessScreen payload={submittedPayload} onReset={() => {
      setSubmitSuccess(false);
      setSubmittedPayload(null);
      setCurrentStepIndex(0);
      methods.reset(defaultValues);
    }} />;
  }

  const totalSteps = config.steps.length;
  const progressPct = ((currentStepIndex) / totalSteps) * 100;

  return (
    <FormProvider {...methods}>
      <div className="w-full">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {currentStep.title}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Step {currentStepIndex + 1} of {totalSteps}
              </p>
            </div>
            <span className="text-sm font-semibold text-indigo-500">
              {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          {/* <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div> */}

          {/* Step dots */}
          <div className="flex gap-2 mt-3">
            {config.steps.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  idx < currentStepIndex
                    ? "bg-indigo-500"
                    : idx === currentStepIndex
                    ? "bg-indigo-300"
                    : "bg-slate-100"
                )}
              />
            ))}
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="min-h-[320px]">
            <FormStepMolecule
              step={currentStep}
              ruleStates={ruleStates}
            />
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
            )}

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-[0.98] transition-all"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  "Submit Application ✓"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

// ─── Success Screen ─────────────────────────────────────────────────────────────
function SuccessScreen({
  payload,
  onReset,
}: {
  payload: Record<string, unknown>;
  onReset: () => void;
}) {
  const [showPayload, setShowPayload] = useState(false);

  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-1">All done!</h3>
      <p className="text-sm text-slate-500 mb-6">Your application has been submitted successfully.</p>

      <button
        type="button"
        onClick={() => setShowPayload((v) => !v)}
        className="text-xs text-indigo-500 underline underline-offset-2 mb-3"
      >
        {showPayload ? "Hide" : "Inspect"} submit payload
      </button>

      {showPayload && (
        <pre className="w-full text-left text-xs bg-slate-900 text-green-400 rounded-xl p-4 overflow-auto max-h-64 mb-6">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}

      <button
        type="button"
        onClick={onReset}
        className="py-2.5 px-6 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Start over
      </button>
    </div>
  );
}
