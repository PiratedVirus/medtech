import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "complaints", "medicines", "frequency", "medicineTime", "duration", "advice", "tests"
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Type parameter is required" },
        { status: 400 }
      );
    }

    let results: any[] = [];

    switch (type) {
      case "complaints":
        results = await prisma.complaint.findMany({
          where: {
            text: {
              contains: query,
              mode: "insensitive",
            },
            deletedAt: null,
          },
          select: {
            id: true,
            text: true,
            category: true,
            severity: true,
          },
          take: limit,
          orderBy: {
            text: "asc",
          },
        });
        break;

      case "medicines":
        results = await prisma.medicine.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            category: true,
            frequency: true,
            medicineTime: true,
            duration: true,
          },
          take: limit,
          orderBy: {
            name: "asc",
          },
        });
        break;

      case "frequency":
      case "medicineTime":
      case "duration":
      case "advice":
      case "tests":
        results = await prisma.commonValue.findMany({
          where: {
            type,
            value: {
              contains: query,
              mode: "insensitive",
            },
            deletedAt: null,
          },
          select: {
            id: true,
            value: true,
            category: true,
            usageCount: true,
          },
          take: limit,
          orderBy: [
            { usageCount: "desc" },
            { value: "asc" },
          ],
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Type-ahead search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, value, category } = body;

    if (!type || !value) {
      return NextResponse.json(
        { success: false, error: "Type and value are required" },
        { status: 400 }
      );
    }

    let result: any;

    switch (type) {
      case "complaints":
        result = await prisma.complaint.create({
          data: {
            text: value,
            category,
          },
        });
        break;

      case "medicines":
        result = await prisma.medicine.create({
          data: {
            name: value,
            category,
            price: 0, // Default price, can be updated later
          },
        });
        break;

      case "frequency":
      case "medicineTime":
      case "duration":
      case "advice":
      case "tests":
        result = await prisma.commonValue.create({
          data: {
            type,
            value,
            category,
          },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      // Duplicate entry - return existing record
      const { type, value } = await request.json();
      
      let existingRecord: any;
      
      switch (type) {
        case "complaints":
          existingRecord = await prisma.complaint.findUnique({
            where: { text: value },
          });
          break;
        case "medicines":
          existingRecord = await prisma.medicine.findUnique({
            where: { name: value },
          });
          break;
        default:
          existingRecord = await prisma.commonValue.findUnique({
            where: { type_value: { type, value } },
          });
      }

      return NextResponse.json({
        success: true,
        data: existingRecord,
        message: "Record already exists",
      });
    }

    console.error("Create type-ahead item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create item" },
      { status: 500 }
    );
  }
} 