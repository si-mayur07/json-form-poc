import { NextResponse } from "next/server";

/**
 * Demo prefill endpoint — simulates fetching a saved/partial form submission
 * from a database and returning it as { fieldId: value } pairs.
 *
 * In a real app this would look up a record by user session, submissionId,
 * query param, etc. and return the saved field values.
 */
export async function GET() {
  // Simulated saved values — field IDs must match FormConfig field IDs exactly.
  // Location values form a valid cascade chain:
  //   country "us" → statesByCountry["us"] → state "ca" (California)
  //   state   "ca" → citiesByState["ca"]   → city "sf" (San Francisco)

  // wait for 3 seconds
  // await new Promise(resolve => setTimeout(resolve, 2000));


  const savedValues: Record<string, unknown> = {
    // ── Step 1: Personal Info ────────────────────────────────────────────────
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+14155552671",
    bio: "Product designer with 5 years of experience.",
    isEmployed: true,
    companyName: "Acme Corp",
    preferredContact: "email",
    dob: "1992-06-15",

    // ── Step 2: Location (values must match lookupTable keys exactly) ────────
    country: "us",   // matches statesByCountry key → loads CA, NY, TX
    state: "ca",     // matches citiesByState key   → loads LA, SF, SD
    city: "sf",      // matches citiesByState["ca"] option value

    // ── Step 3: Preferences ──────────────────────────────────────────────────
    interests: ["tech", "travel"],
    rating: 4,
    volume: 70,
  };

  return NextResponse.json(savedValues);
}
