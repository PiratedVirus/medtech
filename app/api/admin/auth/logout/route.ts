import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Clear the admin token cookie
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    console.log("Admin token deleted");
    console.log("All cookies:", cookieStore.getAll());
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 