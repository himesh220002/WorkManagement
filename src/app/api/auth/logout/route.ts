import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete("auth_token");
  // Clear demo persona + dev cookies so a logged-out (or expired) session
  // cannot be resurrected via the demo fallback in getCurrentSession.
  response.cookies.delete("demo_persona_role");
  response.cookies.delete("tf_master_dev_key");
  response.cookies.delete("tf_dev_tenant_code");
  return response;
}
