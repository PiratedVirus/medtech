import prisma from "@/lib/prisma";

type CascadeDeleteResult = {
  removedReportUrl: string;
  updatedLabResult: string[];
  status: string;
};

function extractTrendReportDate(trendAnalysis: unknown): Date | null {
  if (!trendAnalysis || typeof trendAnalysis !== "object") {
    return null;
  }

  const rawReportDate = (trendAnalysis as { reportDate?: string | Date | null }).reportDate;
  if (!rawReportDate) {
    return null;
  }

  const parsed = new Date(rawReportDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function deleteLabBookingReportCascade(
  labBookingId: number,
  labResultIndex: number
): Promise<CascadeDeleteResult> {
  if (!Number.isInteger(labBookingId) || labBookingId <= 0) {
    throw new Error("Invalid lab booking id");
  }
  if (!Number.isInteger(labResultIndex) || labResultIndex < 0) {
    throw new Error("Invalid lab result index");
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.labBooking.findUnique({
      where: { id: labBookingId },
      select: {
        id: true,
        status: true,
        labResult: true,
      },
    });

    if (!booking) {
      throw new Error("Lab booking not found");
    }

    const currentLabResults = booking.labResult || [];
    if (labResultIndex >= currentLabResults.length) {
      throw new Error(
        `Lab result index ${labResultIndex} out of range. Available: 0-${Math.max(currentLabResults.length - 1, 0)}`
      );
    }

    const removedReportUrl = currentLabResults[labResultIndex];
    const updatedLabResult = currentLabResults.filter((_, index) => index !== labResultIndex);

    const analyses = await tx.labReportAnalysis.findMany({
      where: { labBookingId },
      select: {
        id: true,
        labResultIndex: true,
        trendAnalysis: true,
        allValues: true,
      },
      orderBy: { labResultIndex: "asc" },
    });

    const removedAnalysis = analyses.find((analysis) => analysis.labResultIndex === labResultIndex);

    if (removedAnalysis) {
      await tx.reportTrendData.deleteMany({
        where: {
          sourceReportId: removedAnalysis.id,
        },
      });

      // Cleanup for older trend rows that may have been created without sourceReportId.
      const legacyReportDate = extractTrendReportDate(removedAnalysis.trendAnalysis);
      const allValues = Array.isArray(removedAnalysis.allValues) ? removedAnalysis.allValues : [];
      const parameters = allValues
        .map((value) => (value && typeof value === "object" ? (value as { parameter?: string }).parameter : null))
        .filter((parameter): parameter is string => Boolean(parameter));

      if (legacyReportDate && parameters.length > 0) {
        await tx.reportTrendData.deleteMany({
          where: {
            labBookingId,
            sourceReportId: null,
            reportDate: legacyReportDate,
            parameter: { in: parameters },
          },
        });
      }

      await tx.labReportAnalysis.delete({
        where: { id: removedAnalysis.id },
      });
    }

    const analysesToShift = analyses
      .filter((analysis) => analysis.labResultIndex > labResultIndex)
      .sort((a, b) => a.labResultIndex - b.labResultIndex);

    // Use temporary offset to avoid unique-key collisions while reindexing.
    const TEMP_OFFSET = 100000;
    for (const analysis of analysesToShift) {
      await tx.labReportAnalysis.update({
        where: { id: analysis.id },
        data: { labResultIndex: analysis.labResultIndex + TEMP_OFFSET },
      });
    }

    for (const analysis of analysesToShift) {
      await tx.labReportAnalysis.update({
        where: { id: analysis.id },
        data: { labResultIndex: analysis.labResultIndex - 1 },
      });
    }

    const shouldResetStatusToPending = booking.status === "COMPLETED";
    const updatedBooking = await tx.labBooking.update({
      where: { id: labBookingId },
      data: {
        labResult: { set: updatedLabResult },
        ...(shouldResetStatusToPending ? { status: "PENDING" } : {}),
      },
      select: {
        status: true,
      },
    });

    return {
      removedReportUrl,
      updatedLabResult,
      status: updatedBooking.status,
    };
  });
}
