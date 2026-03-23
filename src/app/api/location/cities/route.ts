import { NextRequest, NextResponse } from "next/server";
import type { SelectOption } from "@/lib/form-engine/types";

const CITIES_BY_STATE: Record<string, SelectOption[]> = {
  // India
  MH:     [{ value: "mumbai", label: "Mumbai" }, { value: "pune", label: "Pune" }, { value: "nagpur", label: "Nagpur" }, { value: "nashik", label: "Nashik" }],
  DL:     [{ value: "new-delhi", label: "New Delhi" }, { value: "noida", label: "Noida" }, { value: "gurgaon", label: "Gurgaon" }],
  KA:     [{ value: "bangalore", label: "Bangalore" }, { value: "mysore", label: "Mysore" }, { value: "hubli", label: "Hubli" }],
  TN:     [{ value: "chennai", label: "Chennai" }, { value: "coimbatore", label: "Coimbatore" }, { value: "madurai", label: "Madurai" }],
  TS:     [{ value: "hyderabad", label: "Hyderabad" }, { value: "warangal", label: "Warangal" }, { value: "nizamabad", label: "Nizamabad" }],
  GJ:     [{ value: "ahmedabad", label: "Ahmedabad" }, { value: "surat", label: "Surat" }, { value: "vadodara", label: "Vadodara" }],

  // United States
  CA:     [{ value: "sf", label: "San Francisco" }, { value: "la", label: "Los Angeles" }, { value: "sd", label: "San Diego" }, { value: "sj", label: "San Jose" }],
  NY:     [{ value: "nyc", label: "New York City" }, { value: "buffalo", label: "Buffalo" }, { value: "rochester", label: "Rochester" }],
  TX:     [{ value: "houston", label: "Houston" }, { value: "dallas", label: "Dallas" }, { value: "austin", label: "Austin" }, { value: "sanantonio", label: "San Antonio" }],
  FL:     [{ value: "miami", label: "Miami" }, { value: "orlando", label: "Orlando" }, { value: "tampa", label: "Tampa" }],
  WA:     [{ value: "seattle", label: "Seattle" }, { value: "spokane", label: "Spokane" }, { value: "tacoma", label: "Tacoma" }],
  IL:     [{ value: "chicago", label: "Chicago" }, { value: "aurora", label: "Aurora" }, { value: "rockford", label: "Rockford" }],

  // United Kingdom
  ENG:    [{ value: "london", label: "London" }, { value: "manchester", label: "Manchester" }, { value: "birmingham", label: "Birmingham" }, { value: "leeds", label: "Leeds" }],
  SCT:    [{ value: "edinburgh", label: "Edinburgh" }, { value: "glasgow", label: "Glasgow" }, { value: "aberdeen", label: "Aberdeen" }],
  WLS:    [{ value: "cardiff", label: "Cardiff" }, { value: "swansea", label: "Swansea" }, { value: "newport", label: "Newport" }],
  NIR:    [{ value: "belfast", label: "Belfast" }, { value: "derry", label: "Derry" }],

  // Australia (prefixed to avoid collision with US state codes)
  "AU-NSW": [{ value: "sydney", label: "Sydney" }, { value: "newcastle", label: "Newcastle" }, { value: "wollongong", label: "Wollongong" }],
  "AU-VIC": [{ value: "melbourne", label: "Melbourne" }, { value: "geelong", label: "Geelong" }, { value: "ballarat", label: "Ballarat" }],
  "AU-QLD": [{ value: "brisbane", label: "Brisbane" }, { value: "goldcoast", label: "Gold Coast" }, { value: "cairns", label: "Cairns" }],
  "AU-WA":  [{ value: "perth", label: "Perth" }, { value: "fremantle", label: "Fremantle" }],
  "AU-SA":  [{ value: "adelaide", label: "Adelaide" }, { value: "gawler", label: "Gawler" }],
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = request.nextUrl.searchParams.get("state");

  if (!state) {
    return NextResponse.json({ error: "Missing required query param: state" }, { status: 400 });
  }

  const cities = CITIES_BY_STATE[state] ?? [];

  if (process.env.NODE_ENV !== "production") {
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json(cities);
}
