import { NextRequest, NextResponse } from "next/server";
import type { SelectOption } from "@/lib/form-engine/types";

const STATES_BY_COUNTRY: Record<string, SelectOption[]> = {
  IN: [
    { value: "MH", label: "Maharashtra" },
    { value: "DL", label: "Delhi" },
    { value: "KA", label: "Karnataka" },
    { value: "TN", label: "Tamil Nadu" },
    { value: "TS", label: "Telangana" },
    { value: "GJ", label: "Gujarat" },
  ],
  US: [
    { value: "CA", label: "California" },
    { value: "NY", label: "New York" },
    { value: "TX", label: "Texas" },
    { value: "FL", label: "Florida" },
    { value: "WA", label: "Washington" },
    { value: "IL", label: "Illinois" },
  ],
  GB: [
    { value: "ENG", label: "England" },
    { value: "SCT", label: "Scotland" },
    { value: "WLS", label: "Wales" },
    { value: "NIR", label: "Northern Ireland" },
  ],
  AU: [
    { value: "AU-NSW", label: "New South Wales" },
    { value: "AU-VIC", label: "Victoria" },
    { value: "AU-QLD", label: "Queensland" },
    { value: "AU-WA", label: "Western Australia" },
    { value: "AU-SA", label: "South Australia" },
  ],
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const country = request.nextUrl.searchParams.get("country");

  if (!country) {
    return NextResponse.json({ error: "Missing required query param: country" }, { status: 400 });
  }

  const states = STATES_BY_COUNTRY[country] ?? [];

  // Simulate realistic API latency in development
  if (process.env.NODE_ENV !== "production") {
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json(states);
}
