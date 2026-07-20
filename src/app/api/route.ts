import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Laundry POS API",
    version: "1.0.0",
    endpoints: ["/api/branches", "/api/services", "/api/transactions", "/api/expenses", "/api/daily-closing", "/api/recap", "/api/dashboard", "/api/reports"]
  });
}
