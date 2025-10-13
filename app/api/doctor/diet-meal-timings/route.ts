import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get meal timing templates for a dietician
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dieticianId = Number(searchParams.get('dieticianId'));
    
    if (!dieticianId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing dieticianId parameter" 
      }, { status: 400 });
    }

    const templates = await prisma.dietMealTimingTemplate.findMany({
      where: { 
        dieticianId, 
        deletedAt: null 
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      templates 
    });
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e?.message || "Server error" 
    }, { status: 500 });
  }
}

// Create or update meal timing template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dieticianId, name, mealTimings, isDefault, templateId } = body;
    
    if (!dieticianId || !name || !mealTimings) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // If updating existing template
    if (templateId) {
      const updated = await prisma.dietMealTimingTemplate.update({
        where: { id: Number(templateId) },
        data: {
          name,
          mealTimings,
          isDefault: isDefault || false,
          updatedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, template: updated });
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.dietMealTimingTemplate.updateMany({
        where: { 
          dieticianId: Number(dieticianId), 
          isDefault: true,
          deletedAt: null
        },
        data: { isDefault: false }
      });
    }

    // Create new template
    const created = await prisma.dietMealTimingTemplate.create({
      data: {
        dieticianId: Number(dieticianId),
        name,
        mealTimings,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json({ success: true, template: created });
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e?.message || "Server error" 
    }, { status: 500 });
  }
}

// Delete meal timing template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = Number(searchParams.get('templateId'));
    
    if (!templateId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing templateId parameter" 
      }, { status: 400 });
    }

    await prisma.dietMealTimingTemplate.update({
      where: { id: templateId },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e?.message || "Server error" 
    }, { status: 500 });
  }
}
