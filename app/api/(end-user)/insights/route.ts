import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import * as jose from 'jose';
import { getCachedInsights } from "@/lib/data-cache";
import { CacheEvents } from "@/lib/cache-events";

// JWT payload interface
interface JWTPayload {
  plusAddedPhoneNumber: string;
  userExists: boolean;
  userRole: string;
}

// Function to verify JWT token and get user
async function verifyUserToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Function to get user from request
async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  
  const decoded = await verifyUserToken(token);
  if (!decoded) return null;
  
  // Get user from database using phone number from JWT
  const user = await prisma.user.findFirst({
    where: { 
      phoneNumber: decoded.plusAddedPhoneNumber,
      deletedAt: null
    },
    select: { id: true, name: true, role: true, phoneNumber: true }
  });
  
  return user;
}

function getMonthString(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** The fixed order you want in the final JSON */
const METRIC_ORDER = [
  "Blood Pressure",
  "Blood Glucose",
  "Body Fat",
  "Muscle Mass",
  "BMI",
  "Visceral Fat",
];

// GET: fetch & group data by month, store item.id, and sort (with Redis caching)
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate the user
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log('[insights API] Authentication failed - no user found');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[insights API] Authenticated user:', { id: user.id, role: user.role, name: user.name });

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: "Missing userId in query params" },
        { status: 400 }
      );
    }

    const requestedUserId = parseInt(userIdParam, 10);

    console.log('[insights API] Requested userId:', requestedUserId);

    // ✅ CACHE: Try to get insights from cache first
    try {
      const cachedInsights = await getCachedInsights(requestedUserId);
      if (cachedInsights) {
        console.log('[insights API] Returning cached insights for user:', requestedUserId);
        return NextResponse.json({
          success: true,
          data: cachedInsights,
          cached: true
        });
      }
    } catch (cacheError) {
      console.log('[insights API] Cache miss or error, fetching from database:', cacheError);
    }

    // Step 2: Check permissions
    const isPatient = user.id === requestedUserId;
    const isDoctor = user.role === 'DOCTOR' || user.role === 'DIETICIAN';
    const isAdmin = user.role === 'ADMIN';
    
    console.log('[insights API] Permission check:', { isPatient, isDoctor, isAdmin, userRole: user.role });
    
    if (!isPatient && !isDoctor && !isAdmin) {
      console.log('[insights API] Permission denied - user does not have access');
      return NextResponse.json(
        { success: false, error: "You do not have permission to access this patient's health insights" },
        { status: 403 }
      );
    }

    // Step 3: For doctors and admins, verify the patient exists and they have access
    if (isDoctor || isAdmin) {
      const patient = await prisma.user.findFirst({
        where: { 
          id: requestedUserId,
          deletedAt: null
        },
        select: { id: true, name: true, role: true }
      });

      if (!patient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }

      // For doctors, check if they have access to this patient (same clinic)
      if (isDoctor) {
        const doctorUser = await prisma.user.findFirst({
          where: { id: user.id },
          select: { clinicId: true }
        });

        const patientUser = await prisma.user.findFirst({
          where: { id: requestedUserId },
          select: { clinicId: true }
        });

        if (!doctorUser || !patientUser || doctorUser.clinicId !== patientUser.clinicId) {
          return NextResponse.json(
            { success: false, error: "You do not have permission to access this patient's data" },
            { status: 403 }
          );
        }
      }
    }

    // Step 4: Fetch data with proper authorization
    const result = await fetchInsightsData(requestedUserId);

    return NextResponse.json({
      success: true,
      metrics: result,
    });
  } catch (error: any) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

// Extract the main logic into a separate function for caching
async function fetchInsightsData(userId: number) {
  try {
    // Metrics to exclude from health insights
    const excludedMetrics = [
      "Blood Sugar (Post Prandial)",
      "Diastolic Blood Pressure", 
      "Systolic Blood Pressure",
      "Weight",
      "Blood Sugar (Fasting)"
    ];

    // 1) Fetch all HealthMetric rows for this user, excluding unwanted metrics
    const metrics = await prisma.healthMetric.findMany({
      where: { 
        userId,
        metricName: {
          notIn: excludedMetrics
        }
      },
      orderBy: { recordedAt: "asc" },
    });

    // 2) Group by metricName
    const groupedByMetric: Record<string, typeof metrics> = {};
    metrics.forEach((item) => {
      if (!groupedByMetric[item.metricName]) {
        groupedByMetric[item.metricName] = [];
      }
      groupedByMetric[item.metricName].push(item);
    });

    // 3) For each metricName, return individual readings instead of monthly averages
    const result = Object.entries(groupedByMetric).map(([metricName, arr]) => {
      // Sort by recordedAt to get chronological order
      const sortedArr = arr.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      
      // Group by month but keep individual readings
      const monthlyMap: Record<string, { reading: number; id: number; recordedAt: Date }[]> = {};

      sortedArr.forEach((item) => {
        const monthKey = getMonthString(item.recordedAt);
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = [];
        }
        monthlyMap[monthKey].push({ 
          reading: item.reading, 
          id: item.id, 
          recordedAt: item.recordedAt 
        });
      });

      const data = Object.entries(monthlyMap).map(([month, items]) => {
        // Get the latest reading for this month (most recent)
        const latestItem = items[items.length - 1];
        return {
          month,
          average: latestItem.reading, // Use latest reading instead of average
          latestId: latestItem.id,
        };
      });

      return {
        metricName,
        data,
      };
    });

    // 4) Sort by your custom order
    result.sort((a, b) => {
      const indexA = METRIC_ORDER.indexOf(a.metricName);
      const indexB = METRIC_ORDER.indexOf(b.metricName);

      if (indexA === -1 && indexB === -1) {
        // neither in METRIC_ORDER => alphabetical
        return a.metricName.localeCompare(b.metricName);
      } else if (indexA === -1) {
        return 1;
      } else if (indexB === -1) {
        return -1;
      } else {
        return indexA - indexB;
      }
    });

    return result;
  } catch (error: any) {
    console.error("Error fetching health metrics:", error);
    throw error;
  }
}

// POST: create a new HealthMetric
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate the user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, metricName, reading, recordedAt } = body;

    if (!userId || !metricName || reading == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const requestedUserId = parseInt(userId, 10);

    // Step 2: Check permissions - only patients can add their own metrics
    const isPatient = user.id === requestedUserId;
    
    if (!isPatient) {
      return NextResponse.json(
        { success: false, error: "You can only add health metrics for your own account" },
        { status: 403 }
      );
    }

    const newMetric = await prisma.healthMetric.create({
      data: {
        userId: requestedUserId,
        metricName,
        reading: parseFloat(reading),
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    // ✅ EVENT-DRIVEN: Emit insights update event
    try {
      await CacheEvents.insightsUpdated(requestedUserId);
      console.log(`[INSIGHTS] Event-driven cache invalidation completed for user ${requestedUserId}`);
    } catch (cacheError) {
      console.error('[INSIGHTS] Error in event-driven cache invalidation:', cacheError);
    }

    return NextResponse.json({ success: true, newMetric });
  } catch (error) {
    console.error("Error creating new metric:", error);
    return NextResponse.json(
      { success: false, error: "Server error creating metric" },
      { status: 500 }
    );
  }
}

// PATCH: edit an existing HealthMetric
export async function PATCH(request: NextRequest) {
  try {
    // Step 1: Authenticate the user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, reading, recordedAt } = body;

    if (!id || reading == null) {
      return NextResponse.json(
        { success: false, error: "Missing id or reading" },
        { status: 400 }
      );
    }

    // Step 2: Check if the metric belongs to the user
    const existingMetric = await prisma.healthMetric.findFirst({
      where: { 
        id: parseInt(id, 10),
        deletedAt: null
      },
      select: { userId: true }
    });

    if (!existingMetric) {
      return NextResponse.json(
        { success: false, error: "Health metric not found" },
        { status: 404 }
      );
    }

    // Step 3: Check permissions - only patients can edit their own metrics
    const isPatient = user.id === existingMetric.userId;
    
    if (!isPatient) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own health metrics" },
        { status: 403 }
      );
    }

    const updatedMetric = await prisma.healthMetric.update({
      where: { id: parseInt(id, 10) },
      data: {
        reading: parseFloat(reading),
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, updatedMetric });
  } catch (error) {
    console.error("Error updating metric:", error);
    return NextResponse.json(
      { success: false, error: "Server error updating metric" },
      { status: 500 }
    );
  }
}