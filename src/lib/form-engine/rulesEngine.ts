import type {
  RuleSchema,
  FieldRuleState,
  SelectOption,
  StepConfig,
  PopulateOptionsRule,
  SetValidationRule,
} from "./types";

// Tiny json-logic evaluator (no external dep needed for core operators)
function evalLogic(logic: Record<string, unknown>, data: Record<string, unknown>): boolean {
  if (!logic || typeof logic !== "object") return false;

  const [op, args] = Object.entries(logic)[0] as [string, unknown[]];
  const resolve = (v: unknown): unknown =>
    v && typeof v === "object" && "var" in (v as object)
      ? data[(v as { var: string }).var]
      : v;

  switch (op) {
    case "==":  return resolve(args[0]) == resolve(args[1]);
    case "===": return resolve(args[0]) === resolve(args[1]);
    case "!=":  return resolve(args[0]) != resolve(args[1]);
    case "!==": return resolve(args[0]) !== resolve(args[1]);
    case ">":   return (resolve(args[0]) as number) > (resolve(args[1]) as number);
    case ">=":  return (resolve(args[0]) as number) >= (resolve(args[1]) as number);
    case "<":   return (resolve(args[0]) as number) < (resolve(args[1]) as number);
    case "<=":  return (resolve(args[0]) as number) <= (resolve(args[1]) as number);
    case "!":   return !resolve(args[0]);
    case "!!":  return !!resolve(args[0]);
    case "and": return (args as Record<string, unknown>[]).every((a) => evalLogic(a, data));
    case "or":  return (args as Record<string, unknown>[]).some((a) => evalLogic(a, data));
    case "in":  return (resolve(args[1]) as unknown[])?.includes(resolve(args[0]));
    default:    return false;
  }
}

export class FormRulesEngine {
  constructor(private rules: RuleSchema[]) {}

  evaluate(
    formValues: Record<string, unknown>,
    lookupTables?: Record<string, Record<string, SelectOption[]>>
  ): Record<string, FieldRuleState> {
    const states: Record<string, FieldRuleState> = {};

    const ensure = (id: string): FieldRuleState => {
      if (!states[id]) {
        states[id] = { isHidden: false, isDisabled: false, addedValidations: [] };
      }
      return states[id];
    };

    for (const rule of this.rules) {
      const state = ensure(rule.targetFieldId);

      if (rule.action === "SHOW" || rule.action === "HIDE") {
        if (rule.condition) {
          const match = evalLogic(rule.condition as Record<string, unknown>, formValues);
          if (match) {
            state.isHidden = rule.action === "HIDE";
          }
        }
      }

      if (rule.action === "DISABLE" || rule.action === "ENABLE") {
        if (rule.condition) {
          const match = evalLogic(rule.condition as Record<string, unknown>, formValues);
          if (match) {
            state.isDisabled = rule.action === "DISABLE";
          }
        }
      }

      if (rule.action === "POPULATE_OPTIONS") {
        const popRule = rule as PopulateOptionsRule;
        if (popRule.source === "lookupTable" && lookupTables) {
          const table = lookupTables[popRule.lookupTableKey!];
          if (table && popRule.lookupKeyField) {
            const keyValue = formValues[popRule.lookupKeyField] as string;
            state.dynamicOptions = table[keyValue] ?? [];
          }
        }
      }

      if (rule.action === "SET_VALIDATION") {
        const valRule = rule as SetValidationRule;
        const conditionMet = valRule.condition
          ? evalLogic(valRule.condition as Record<string, unknown>, formValues)
          : true;

        if (conditionMet) {
          if (valRule.operation === "add" && valRule.validation) {
            const already = state.addedValidations?.find(
              (v) => v.type === valRule.validation!.type
            );
            if (!already) {
              state.addedValidations = [...(state.addedValidations ?? []), valRule.validation];
            }
          }
          if (valRule.operation === "remove") {
            state.addedValidations = (state.addedValidations ?? []).filter(
              (v) => v.type !== valRule.validationType
            );
          }
        }
      }
    }

    return states;
  }

  /** Collect all fieldIds from steps recursively */
  static collectFieldIds(steps: StepConfig[]): string[] {
    const ids: string[] = [];
    const walk = (s: StepConfig) => {
      for (const f of s.fields ?? []) ids.push(f.id);
      for (const child of s.steps ?? []) walk(child);
    };
    steps.forEach(walk);
    return ids;
  }
}
