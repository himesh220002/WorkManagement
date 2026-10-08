import { NextResponse } from "next/server";
import { seedEnterpriseShowcase } from "../../../../scripts/seedEnterpriseShowcase";

export async function GET() {
  try {
    const result = await seedEnterpriseShowcase();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API seed-showcase error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
