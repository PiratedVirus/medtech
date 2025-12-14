import { NextRequest, NextResponse } from "next/server";
import { searchPathologyTests } from "@/lib/algolia";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const results = await searchPathologyTests(query, limit);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("Algolia pathology tests search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search pathology tests",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
