import { DEMO_FORM_CONFIG } from "@/lib/form-engine";
import { FormRendererOrganism } from "@/components/form-engine/organism/FormRendererOrganism";

export default function FormEngineDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-purple-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">FanOS Form Engine</span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
            v1.0.0 · demo
          </span>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-start justify-center px-4 pb-12 pt-6">
          <div className="w-full max-w-lg">

            {/* Top label */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Join the waitlist
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                JSON-driven · conditional logic · multi-step
              </p>
            </div>

            {/* Form card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
              <FormRendererOrganism config={DEMO_FORM_CONFIG} />
            </div>

            {/* Debug toggle - shows raw JSON config */}
            <details className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
              <summary className="px-4 py-3 text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                🔍 View raw JSON config
              </summary>
              <pre className="text-xs bg-slate-900 text-emerald-400 p-4 overflow-auto max-h-80">
                {JSON.stringify(DEMO_FORM_CONFIG, null, 2)}
              </pre>
            </details>
          </div>
        </main>
      </div>
    </div>
  );
}
