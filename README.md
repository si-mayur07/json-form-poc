# FanOS JSON Form Engine — Renderer (Next.js)

JSON-driven dynamic form engine built with **Next.js 15**, **React Hook Form**, **Zod**, and **Tailwind CSS**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install
# or
pnpm install

# 2. Run dev server
npm run dev

# 3. Open the demo
# http://localhost:3000/demo/form-engine
```

---

## Project Structure

```
src/
├── app/
│   ├── demo/form-engine/
│   │   └── page.tsx              ← Demo route (/demo/form-engine)
│   ├── globals.css
│   └── layout.tsx
│
├── lib/form-engine/
│   ├── types.ts                  ← All TypeScript types (FormConfig, FieldConfig, etc.)
│   ├── demoConfig.ts             ← Hardcoded 3-step demo JSON config
│   ├── rulesEngine.ts            ← SHOW/HIDE/DISABLE/POPULATE_OPTIONS/SET_VALIDATION
│   ├── schemaBuilder.ts          ← buildZodSchema() + buildDefaultValues()
│   ├── payloadBuilder.ts         ← buildSubmitPayload() — id → name mapping
│   └── index.ts                  ← Barrel exports
│
└── components/form-engine/
    ├── atoms/
    │   └── index.tsx             ← TextInput, Textarea, Select, Checkbox, RadioGroup,
    │                                MultiSelect, OTPInput, Rating, Slider
    ├── molecules/
    │   ├── FormFieldMolecule.tsx ← Renders a single field via useController
    │   └── FormStepMolecule.tsx  ← Renders all fields in a step, recurses sub-steps
    └── organism/
        └── FormRendererOrganism.tsx ← Root component: RHF + Zod + rules engine + nav
```

---

## How It Works

### 1. JSON Config → Zod Schema

`buildZodSchema(steps)` walks all steps recursively and produces a `z.object()`:

```ts
// Static rules from JSON validationRules[]
// Dynamic rules from SET_VALIDATION rule actions → superRefine()
const schema = buildZodSchemaWithRules(config.steps, ruleStates);
```

### 2. JSON Config → RHF defaultValues

`buildDefaultValues(steps)` sets sensible empty defaults per field type:
- `checkbox` → `false`
- `multi-select` → `[]`
- `slider` → `min` value
- everything else → `""`

### 3. Rules Engine

`FormRulesEngine.evaluate(formValues, lookupTables)` runs on every render via `watch()`.
Returns `Record<fieldId, FieldRuleState>` with:
- `isHidden` — SHOW/HIDE rules
- `isDisabled` — ENABLE/DISABLE rules
- `dynamicOptions` — POPULATE_OPTIONS from lookupTable
- `addedValidations` — SET_VALIDATION add/remove

### 4. Field Key Mapping (id → name)

Every field has:
- `id` — internal key used for state, rules, RHF registration
- `name` — backend submit key (falls back to `id` if omitted)

`buildSubmitPayload()` maps `id → name` at submit time, excludes hidden fields.

---

## Demo Form Features

The hardcoded demo (`demoConfig.ts`) showcases:

| Feature | Where |
|---|---|
| Conditional show/hide | `isEmployed` checkbox → shows `companyName` |
| Conditional disable | `preferredContact = email` → disables `phone` |
| Dynamic options via lookup | `country` select → populates `city` options |
| Dynamic validation | `isEmployed = true` → `companyName` becomes required |
| Nested sub-form (depth 2) | Step 3 → "Ad Preferences" sub-form |
| All field types | text, email, phone, password, textarea, checkbox, radio, select, multi-select, date, OTP, rating, slider |
| Multi-step with per-step validation | 3 steps, Next button validates current step only |
| Submit payload inspection | Click "Inspect submit payload" on success screen |

---

## Adding the Engine to Your Component Library

The `src/lib/form-engine/` folder is the portable core — no Next.js dependencies.
Copy it into `wnm-web-component-library` as-is. The only external deps needed are:

```json
"react-hook-form": "^7.54.0",
"@hookform/resolvers": "^3.9.0",
"zod": "^3.23.8"
```

The components in `src/components/form-engine/` depend on Tailwind. For the component
library, replace Tailwind classes with your design token CSS or class-variance-authority variants.

---

## Adding a New Field Type

1. Add the type string to `FieldType` in `types.ts`
2. Add a case in `buildFieldSchema()` in `schemaBuilder.ts`
3. Add a case in `buildDefaultValues()` in `schemaBuilder.ts`
4. Add the atom component in `atoms/index.tsx`
5. Add a `case` in `FormFieldMolecule.tsx` `renderInput()` switch

---

## Environment

No environment variables required for the demo. For real submission endpoints, set:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api.com
```

Then update `buildSubmitPayload` call in `FormRendererOrganism.tsx` to use the real endpoint.
