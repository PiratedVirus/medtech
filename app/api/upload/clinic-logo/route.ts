import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clinicId = formData.get("clinicId") as string | null;
    const logoType = (formData.get("logoType") as string | null) || "logo";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "clinic-logos");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const clinicSegment = clinicId && clinicId.trim() !== '' ? clinicId.trim() : 'temp';
    const typeSegment = logoType === 'footerLogo' ? 'footer' : 'logo';
    const filename = `clinic-${clinicSegment}-${typeSegment}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/clinic-logos/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename
    });
  } catch (error) {
    console.error("Error uploading clinic logo:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
