"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  buildZodSchemaWithRules,
  buildDefaultValues,
  FormRulesEngine,
  buildSubmitPayload,
} from "@/lib/form-engine";
import { fetchJson, interpolateUrl, postJson } from "@/lib/form-engine/apiClient";
import type { SubmitFormResponse } from "@/app/api/form/submit/route";
import type { FormConfig, FieldRuleState, SelectOption, PopulateOptionsRule } from "@/lib/form-engine/types";
import { FormStepMolecule } from "../molecules/FormStepMolecule";
import { NotificationMolecule } from "../molecules/NotificationMolecule";
import { cn } from "@/lib/utils";

interface Props {
  config: FormConfig;
}

export function FormRendererOrganism({ config }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submissionId] = useState<string | undefined>();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<Record<string, unknown> | null>(null);

  // ─── Notification state ──────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // ─── Prefetch state ──────────────────────────────────────────────────────────
  const [isPrefetching, setIsPrefetching] = useState(!!config.prefetch);

  // ─── API-driven option state ─────────────────────────────────────────────────
  const [apiOptionStates, setApiOptionStates] = useState<Record<string, Partial<FieldRuleState>>>({});

  // Tracks which key value each API rule last loaded options for.
  // `undefined` means the rule has never been initialised (first render).
  const optionLoadedForRef = useRef<Record<string, string | undefined>>({});
  // Tracks which rule IDs have been initialised at least once.
  const initializedRulesRef = useRef(new Set<string>());

  // ─── Form setup ──────────────────────────────────────────────────────────────
  const defaultValues = useMemo(() => buildDefaultValues(config.steps), [config]);
  const rulesEngine = useMemo(() => new FormRulesEngine(config.rules), [config.rules]);

  const currentStep = config.steps[currentStepIndex];
  const isLastStep = currentStepIndex === config.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Hold the latest dynamic schema in a ref so the stable resolver always
  // validates against the most-recent schema without re-creating useForm.
  const schemaRef = useRef(buildZodSchemaWithRules(config.steps, {}));

  const methods = useForm({
    defaultValues,
    mode: "onTouched",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: (values, context, options) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zodResolver(schemaRef.current)(values, context, options as any),
  });

  const { watch, handleSubmit, trigger, formState: { isSubmitting } } = methods;
  const allValues = watch();

  // ─── Prefetch: populate form with server values on mount ─────────────────────
  useEffect(() => {
    if (!config.prefetch) return;
    const { endpoint, fieldMap } = config.prefetch;
    const controller = new AbortController();

    setIsPrefetching(true);
    fetchJson<Record<string, unknown>>(endpoint, { signal: controller.signal })
      .then((data) => {
        // Remap keys if a fieldMap is provided, otherwise use keys as-is
        const remapped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
          const fieldId = fieldMap?.[key] ?? key;
          remapped[fieldId] = value;
        }
        console.log("remapped", {remapped,defaultValues});
        // Merge prefetched values on top of static defaultValues
        methods.reset({ ...defaultValues, ...remapped });
      })
      .catch((err: unknown) => {
        if ((err as DOMException)?.name === "AbortError") return;
        // Prefetch failure is non-fatal — form still works with static defaults
        console.warn("[form-engine] prefetch failed:", err);
      })
      .finally(() => setIsPrefetching(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.prefetch?.endpoint]);

  // ─── Sync rules (show/hide, enable/disable, lookupTable, setValidation) ─────
  const ruleStates: Record<string, FieldRuleState> = useMemo(
    () => rulesEngine.evaluate(allValues as Record<string, unknown>, currentStep.lookupTables),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(allValues), currentStep.id]
  );

  // ─── Merge sync + async rule states ─────────────────────────────────────────
  const mergedRuleStates: Record<string, FieldRuleState> = useMemo(() => {
    const merged: Record<string, FieldRuleState> = { ...ruleStates };
    for (const [fieldId, apiState] of Object.entries(apiOptionStates)) {
      const base: FieldRuleState = merged[fieldId] ?? { isHidden: false, isDisabled: false, addedValidations: [] };
      merged[fieldId] = { ...base, ...apiState };
    }
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleStates, apiOptionStates]);

  // ─── Dynamic Zod schema (includes SET_VALIDATION rules) ─────────────────────
  const dynamicSchema = useMemo(
    () => buildZodSchemaWithRules(config.steps, mergedRuleStates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(mergedRuleStates)]
  );

  schemaRef.current = dynamicSchema;

  // ─── API-driven POPULATE_OPTIONS ─────────────────────────────────────────────
  const apiPopulateRules = useMemo(
    () =>
      config.rules.filter(
        (r): r is PopulateOptionsRule =>
          r.action === "POPULATE_OPTIONS" && (r as PopulateOptionsRule).source === "api",
      ),
    [config.rules],
  );

  useEffect(() => {
    if (apiPopulateRules.length === 0) return;

    const controllers = new Map<string, AbortController>();

    for (const rule of apiPopulateRules) {
      if (!rule.apiUrl) continue;

      // Standalone rule: no dependency field — fetch once on mount, never re-fetch.
      const isStandalone = !rule.lookupKeyField;
      const keyValue = isStandalone
        ? undefined
        : ((allValues as Record<string, unknown>)[rule.lookupKeyField!] as string | undefined);

      const isInitialized = initializedRulesRef.current.has(rule.id);
      const prevKeyValue = optionLoadedForRef.current[rule.id];

      // Skip if nothing has changed since the last fetch
      if (isInitialized && keyValue === prevKeyValue) continue;

      const isKeyChanged = !isStandalone && isInitialized && keyValue !== prevKeyValue;

      initializedRulesRef.current.add(rule.id);
      optionLoadedForRef.current[rule.id] = keyValue;

      // Reset the target field and any cascading fields when the dependency changes
      if (isKeyChanged) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        methods.setValue(rule.targetFieldId as any, "");
        rule.resetOnChange?.forEach((fieldId) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          methods.setValue(fieldId as any, "");
        });
      }

      // Dependent field cleared — clear options and skip the fetch
      if (!isStandalone && !keyValue) {
        setApiOptionStates((prev) => ({
          ...prev,
          [rule.targetFieldId]: { dynamicOptions: [], isLoadingOptions: false, optionsError: undefined },
        }));
        continue;
      }

      const controller = new AbortController();
      controllers.set(rule.id, controller);

      setApiOptionStates((prev) => ({
        ...prev,
        [rule.targetFieldId]: { ...prev[rule.targetFieldId], isLoadingOptions: true, optionsError: undefined },
      }));

      const url = interpolateUrl(rule.apiUrl, allValues as Record<string, unknown>);

      fetchJson<SelectOption[]>(url, { signal: controller.signal })
        .then((options) => {
          setApiOptionStates((prev) => ({
            ...prev,
            [rule.targetFieldId]: { dynamicOptions: options, isLoadingOptions: false },
          }));
        })
        .catch((err: unknown) => {
          if ((err as DOMException)?.name === "AbortError") return;
          setApiOptionStates((prev) => ({
            ...prev,
            [rule.targetFieldId]: { isLoadingOptions: false, optionsError: "Failed to load options." },
          }));
        });
    }

    return () => {
      controllers.forEach((c) => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allValues)]);

  // ─── Step validation helpers ─────────────────────────────────────────────────
  function getCurrentStepFieldIds(): string[] {
    const ids: string[] = [];
    const walk = (step: typeof currentStep) => {
      for (const f of step.fields ?? []) {
        if (f.type !== "submit" && !mergedRuleStates[f.id]?.isHidden) ids.push(f.id);
      }
      for (const child of step.steps ?? []) walk(child);
    };
    walk(currentStep);
    return ids;
  }

  async function handleNext() {
    const fieldIds = getCurrentStepFieldIds();
    const values = methods.getValues();
    const result = dynamicSchema.safeParse(values);

    let stepValid = true;
    if (!result.success) {
      const relevantErrors = result.error.issues.filter((issue) =>
        fieldIds.includes(String(issue.path[0])),
      );
      if (relevantErrors.length > 0) {
        stepValid = false;
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
    setInlineError(null);
    setToast(null);
    const payload = buildSubmitPayload(values, config, mergedRuleStates, {
      federationId: config.federationId,
      submissionId,
    });
    try {
      await postJson<SubmitFormResponse>("/api/form/submit", payload);
      setSubmittedPayload(payload);
      setToast({ message: "Application submitted successfully!", variant: "success" });
      setSubmitSuccess(true);
    } catch {
      setInlineError("Something went wrong. Please try again.");
      setToast({ message: "Submission failed. Please try again.", variant: "error" });
    }
  }

  const totalSteps = config.steps.length;

  // Toast must always be rendered at the top level so it survives the
  // SuccessScreen swap (early return would unmount it before it could animate in).
  return (
    <>
      {/* Toast — always mounted regardless of which screen is showing */}
      <NotificationMolecule
        show={!!toast}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "info"}
        // mode="toast"
        position="bottom-right"
        onDismiss={() => setToast(null)}
      />

      {/* ─── Prefetch loading / Success / Form ──────────────────────────────── */}
      {isPrefetching ? (
        /* Skeleton while prefetch is in-flight */
        <div className="w-full space-y-4 animate-pulse py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-24 rounded-full bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : submitSuccess && submittedPayload ? (
        <SuccessScreen
          payload={submittedPayload}
          onReset={() => {
            setSubmitSuccess(false);
            setSubmittedPayload(null);
            setCurrentStepIndex(0);
            setToast(null);
            setInlineError(null);
            methods.reset(defaultValues);
          }}
        />
      ) : (
        /* ─── Form ─────────────────────────────────────────────────────────── */
        <FormProvider {...methods}>
          <div className="w-full">
            {/* Progress header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">{currentStep.title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Step {currentStepIndex + 1} of {totalSteps}
                  </p>
                </div>
                <span className="text-sm font-semibold text-indigo-500">
                  {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
                </span>
              </div>

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
                          : "bg-slate-100",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Form fields */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="min-h-[320px]">
                <FormStepMolecule step={currentStep} ruleStates={mergedRuleStates} />
              </div>

              {/* Inline error above navigation buttons */}
              {inlineError && (
                <div className="mt-4">
                  <NotificationMolecule
                    show={!!inlineError}
                    message={inlineError}
                    variant="error"
                    mode="inline"
                    onDismiss={() => setInlineError(null)}
                  />
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
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
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
      )}
    </>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────────────
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
        <svg
          className="w-8 h-8 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
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
