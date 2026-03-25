import { NextRequest, NextResponse } from "next/server";

export interface SubmitFormRequest {
  federationId?: string;
  submissionId?: string;
  formId?: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface SubmitFormResponse {
  success: boolean;
  submissionId: string;
  receivedAt: string;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: SubmitFormRequest;

  try {
    body = (await request.json()) as SubmitFormRequest;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  // return NextResponse.json({ success: true, message: "Failed to submit form." }, { status: 400 });

  if (!body) {
    return NextResponse.json(
      { success: false, message: "Missing required field: data" },
      { status: 422 },
    );
  }

  // Simulate a short processing delay in non-production environments.
  if (process.env.NODE_ENV !== "production") {
    await new Promise((r) => setTimeout(r, 500));
  }

  // ── TODO: persist / forward `body` to your real backend here ──────────────
  console.log("[form/submit] Received submission:", JSON.stringify(body, null, 2));

  const response: SubmitFormResponse = {
    success: true,
    submissionId: body.submissionId ?? crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    message: "Form submitted successfully.",
  };

  return NextResponse.json(response, { status: 201 });
}
