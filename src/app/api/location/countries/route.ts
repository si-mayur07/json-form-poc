import { NextResponse } from "next/server";
import type { SelectOption } from "@/lib/form-engine/types";

const COUNTRIES: SelectOption[] = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "production") {
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json(COUNTRIES);
}
