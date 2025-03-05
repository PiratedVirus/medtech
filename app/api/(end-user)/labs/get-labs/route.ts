import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fetch all doctors along with their profile & availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');

    // if (!packageId) {
    //   return NextResponse.json(
    //     { success: false, error: "Package ID is required" },
    //     { status: 400 }
    //   );
    // }
    let where = {}
    if(packageId) {
      where = { id: parseInt(packageId, 10) };
    }

    const packages = await prisma.labPackage.findMany({
      where
    });

    return NextResponse.json({ success: true, packages });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors with error " + error },
      { status: 500 }
    );
  }
}