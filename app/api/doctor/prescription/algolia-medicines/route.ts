import { NextRequest, NextResponse } from "next/server";
import { searchMedicines, addMedicineToAlgolia } from "@/lib/algolia";

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

    const results = await searchMedicines(query, limit);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("Algolia medicine search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search medicines",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, frequency, medicineTime, duration, price } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Medicine name is required" },
        { status: 400 }
      );
    }

    const objectID = await addMedicineToAlgolia({
      name,
      category,
      frequency,
      medicineTime,
      duration,
      price: price || 0,
    });

    return NextResponse.json({
      success: true,
      data: { objectID, name, category, frequency, medicineTime, duration, price },
    });
  } catch (error: any) {
    console.error("Algolia add medicine error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add medicine to search index",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
