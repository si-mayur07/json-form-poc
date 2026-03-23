import type { FormConfig } from "./types";

export const DEMO_FORM_CONFIG: FormConfig = {
  version: "1.0.0",
  formId: "user-onboarding-form",
  federationId: "federation-001",

  theme: {
    primaryColor: "#6366f1",
    errorColor: "#ef4444",
    borderRadius: "10px",
  },

  submission: {
    submitEndpoint: "/api/submit",
    partialSubmitEndpoint: "/api/submit/partial",
    excludeHiddenFromPayload: true,
    includeDisabledInPayload: true,
    attachFederationId: true,
    attachSubmissionId: true,
  },

  steps: [
    {
      id: "step-1-user-details",
      title: "Personal Info",
      order: 1,
      theme: {},
      fields: [
        {
          id: "fullName",
          name: "full_name",
          type: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
          validationRules: [
            { type: "required", message: "Name is required" },
            { type: "minLength", value: 2, message: "Min 2 characters" },
          ],
        },
        {
          id: "email",
          name: "email_address",
          type: "email",
          label: "Email Address",
          placeholder: "you@example.com",
          required: true,
        },
        {
          id: "phone",
          name: "phone_number",
          type: "phone",
          label: "Phone Number",
          placeholder: "+1 234 567 8900",
          _rulesRef: ["rule-disable-phone"],
          required: true,
          validationRules: [
            { type: "required", message: "Phone number is required" },
            { type: "regex", value: "^\\+?[1-9]\\d{1,14}$", message: "Invalid phone number" },
            { type: "minLength", value: 10, message: "Phone number must be at least 10 digits" },
          ],

        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          placeholder: "••••••••",
          required: true,
          helpText: "Min 8 chars, 1 number, 1 special character",
          validationRules: [
            { type: "required", message: "Password is required" },
            {
              type: "regex",
              value: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
              message: "Min 8 chars, 1 number, 1 special character",
            },
          ],
        },
        {
          id: "bio",
          name: "bio",
          type: "textarea",
          label: "Short Bio",
          placeholder: "Tell us a little about yourself…",
          rows: 3,
          // required:true,
        },
        {
          id: "isEmployed",
          name: "is_employed",
          type: "checkbox",
          label: "I am currently employed",
          defaultValue: false,
        },
        {
          id: "companyName",
          name: "company_name",
          type: "text",
          label: "Company Name",
          placeholder: "Where do you work?",
          _rulesRef: ["rule-show-company-when-employed", "rule-set-validation-required"],
        },
        {
          id: "preferredContact",
          name: "preferred_contact",
          type: "radio",
          label: "Preferred Contact Method",
          options: [
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone" },
            { value: "both", label: "Both" },
          ],
          defaultValue: "email",
        },
        {
          id: "dob",
          name: "date_of_birth",
          type: "date-picker",
          label: "Date of Birth",
          required: true,
          format: "YYYY-MM-DD",
        },
      ],
    },

    {
      id: "step-2-location",
      title: "Location",
      order: 2,
      fields: [
        {
          id: "country",
          name: "country",
          type: "single-select",
          label: "Country",
          placeholder: "Select country…",
          required: true,
          _rulesRef: ["rule-populate-countries-from-api"],
        },
        {
          id: "state",
          name: "state",
          type: "single-select",
          label: "State / Province",
          placeholder: "Select state…",
          _rulesRef: ["rule-populate-states-from-api"],
        },
        {
          id: "city",
          name: "city",
          type: "single-select",
          label: "City",
          placeholder: "Select city…",
          _rulesRef: ["rule-populate-cities-from-api"],
        },
      ],
    },

    {
      id: "step-3-preferences",
      title: "Preferences",
      order: 3,
      fields: [
        {
          id: "interests",
          name: "interests",
          type: "multi-select",
          label: "Your Interests",
          options: [
            { value: "tech", label: "Technology" },
            { value: "sports", label: "Sports" },
            { value: "music", label: "Music" },
            { value: "travel", label: "Travel" },
            { value: "food", label: "Food & Cooking" },
          ],
        },
        {
          id: "rating",
          name: "experience_rating",
          type: "rating",
          label: "How excited are you?",
          max: 5,
        },
        {
          id: "volume",
          name: "notification_volume",
          type: "slider",
          label: "Notification Preference",
          min: 0,
          max: 100,
          step: 10,
          defaultValue: 50,
        },
        {
          id: "otpVerify",
          name: "otp_code",
          type: "otp-pin",
          label: "Verify OTP",
          length: 6,
          required: true,
        },
        {
          id: "submitBtn",
          type: "submit",
          label: "Submit Application",
        },
      ],
      steps: [
        {
          id: "step-3-ad-sub",
          title: "Ad Preferences",
          order: 1,
          fields: [
            {
              id: "adFrequency",
              name: "ad_frequency",
              type: "single-select",
              label: "Ad Frequency",
              options: [
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "never", label: "Never" },
              ],
            },
          ],
        },
      ],
    },
  ],

  rules: [
    {
      id: "rule-show-company-when-employed",
      action: "SHOW",
      targetFieldId: "companyName",
      condition: { "==": [{ var: "isEmployed" }, true] },
    },
    {
      id: "rule-hide-company-when-not-employed",
      action: "HIDE",
      targetFieldId: "companyName",
      condition: { "==": [{ var: "isEmployed" }, false] },
    },
    // {
    //   id: "rule-disable-phone",
    //   action: "DISABLE",
    //   targetFieldId: "phone",
    //   condition: { "==": [{ var: "preferredContact" }, "email"] },
    // },
    {
      id: "rule-populate-countries-from-api",
      action: "POPULATE_OPTIONS",
      targetFieldId: "country",
      source: "api",
      apiUrl: "/api/location/countries",
      // No lookupKeyField — fetches once on mount, independent of any other field
    },
    {
      id: "rule-populate-states-from-api",
      action: "POPULATE_OPTIONS",
      targetFieldId: "state",
      source: "api",
      apiUrl: "/api/location/states?country={country}",
      lookupKeyField: "country",
      // When country changes, also reset the city field to prevent stale selections
      resetOnChange: ["city"],
    },
    {
      id: "rule-populate-cities-from-api",
      action: "POPULATE_OPTIONS",
      targetFieldId: "city",
      source: "api",
      apiUrl: "/api/location/cities?state={state}",
      lookupKeyField: "state",
    },
    {
      id: "rule-set-validation-required",
      action: "SET_VALIDATION",
      targetFieldId: "companyName",
      operation: "add",
      condition: { "==": [{ var: "isEmployed" }, true] },
      validation: { type: "required", message: "Company name is required when employed" },
    },
    {
      id: "rule-remove-validation",
      action: "SET_VALIDATION",
      targetFieldId: "companyName",
      operation: "remove",
      condition: { "==": [{ var: "isEmployed" }, false] },
      validationType: "required",
    },
  ],
};
