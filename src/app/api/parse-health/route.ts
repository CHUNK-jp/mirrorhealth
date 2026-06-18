import { NextRequest, NextResponse } from "next/server";
import { parseAppleHealthXML } from "@/lib/healthParser";

export const maxDuration = 60; // seconds

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();

    if (!text.includes("<HealthData")) {
      return NextResponse.json(
        { error: "Invalid Apple Health export file. Please export from the Health app and upload export.xml" },
        { status: 400 }
      );
    }

    const summary = await parseAppleHealthXML(text);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse health data: " + (error as Error).message },
      { status: 500 }
    );
  }
}
