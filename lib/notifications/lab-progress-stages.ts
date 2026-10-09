export type ProgressStageStatus = "pending" | "processing" | "completed" | "failed";

export interface ProgressStage {
  stage: string;
  status: ProgressStageStatus;
  message: string;
  timestamp: Date;
}

type AnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | string;

type BuildLabProgressStagesInput = {
  processingStatus: AnalysisStatus;
  processingError?: string | null;
  includeUploadStage?: boolean;
};

const LAB_STAGE_TEMPLATES = [
  {
    name: "OCR Started",
    pending: "Waiting to start OCR text extraction.",
    processing: "Reading text from the uploaded report.",
    completed: "OCR text extraction completed.",
    failed: "Failed during OCR text extraction.",
  },
  {
    name: "Understanding OCR Content",
    pending: "Waiting to generate clinical summary.",
    processing: "Generating clinical summary from extracted text.",
    completed: "Clinical summary generated.",
    failed: "Failed while generating clinical summary.",
  },
  {
    name: "Extracting Lab Parameters",
    pending: "Waiting to extract parameters and abnormal values.",
    processing: "Extracting lab parameters and abnormal values.",
    completed: "Lab parameters extracted successfully.",
    failed: "Failed while extracting lab parameters.",
  },
  {
    name: "Detecting Report Date",
    pending: "Waiting to determine report date for trends.",
    processing: "Detecting report date and preparing analysis context.",
    completed: "Report date detected (or fallback selected).",
    failed: "Failed while preparing report date context.",
  },
  {
    name: "Building Trend Timeline",
    pending: "Waiting to build trend timeline from values.",
    processing: "Building trend timeline from extracted lab values.",
    completed: "Trend timeline generated successfully.",
    failed: "Failed while generating trend timeline.",
  },
  {
    name: "Saving Analysis",
    pending: "Waiting to save analysis output.",
    processing: "Saving analysis and trend results.",
    completed: "Analysis and trends saved successfully.",
    failed: "Failed while saving analysis output.",
  },
] as const;

function extractReadableDetail(rawMessage: string | null | undefined): string | null {
  if (!rawMessage) return null;
  const trimmed = rawMessage.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/^Stage\s*\d+[a-z]?\s*:\s*/i, "")
    .replace(/^Stage\s*\d+[a-z]?\s*\([^)]+\)\s*failed:\s*/i, "")
    .replace(/^Stage\s*\d+[a-z]?\s*failed:\s*/i, "")
    .replace(/^Processing failed:\s*/i, "")
    .trim();

  return normalized || null;
}

function detectStageIndex(message: string): number {
  const value = message.toLowerCase();

  if (
    value.includes("stage 6") ||
    value.includes("saving analysis") ||
    value.includes("saving results") ||
    value.includes("saving analysis and trend")
  ) {
    return 5;
  }
  if (
    value.includes("stage 5") ||
    value.includes("trend timeline") ||
    value.includes("trend data") ||
    value.includes("creating trend")
  ) {
    return 4;
  }
  if (
    value.includes("stage 4") ||
    value.includes("detecting report date") ||
    value.includes("finalizing")
  ) {
    return 3;
  }
  if (
    value.includes("stage 3b") ||
    value.includes("extracting lab values") ||
    value.includes("lab values")
  ) {
    return 2;
  }
  if (
    value.includes("stage 3a") ||
    value.includes("generating ai summary") ||
    value.includes("generating summary")
  ) {
    return 1;
  }
  if (value.includes("stage 3")) {
    return 2;
  }
  if (value.includes("stage 2")) {
    return 1;
  }
  return 0;
}

function buildProcessingStages(message: string, detail: string | null): ProgressStage[] {
  const currentStageIndex = detectStageIndex(message);

  return LAB_STAGE_TEMPLATES.map((template, index) => {
    if (index < currentStageIndex) {
      return {
        stage: template.name,
        status: "completed" as const,
        message: template.completed,
        timestamp: new Date(),
      };
    }

    if (index === currentStageIndex) {
      return {
        stage: template.name,
        status: "processing" as const,
        message: detail || template.processing,
        timestamp: new Date(),
      };
    }

    return {
      stage: template.name,
      status: "pending" as const,
      message: template.pending,
      timestamp: new Date(),
    };
  });
}

function buildFailedStages(message: string, detail: string | null): ProgressStage[] {
  const failedStageIndex = detectStageIndex(message);

  return LAB_STAGE_TEMPLATES.map((template, index) => {
    if (index < failedStageIndex) {
      return {
        stage: template.name,
        status: "completed" as const,
        message: template.completed,
        timestamp: new Date(),
      };
    }

    if (index === failedStageIndex) {
      return {
        stage: template.name,
        status: "failed" as const,
        message: detail || template.failed,
        timestamp: new Date(),
      };
    }

    return {
      stage: template.name,
      status: "pending" as const,
      message: template.pending,
      timestamp: new Date(),
    };
  });
}

function prependUploadStage(stages: ProgressStage[]): ProgressStage[] {
  return [
    {
      stage: "Uploading File",
      status: "completed",
      message: "File uploaded successfully. Starting AI analysis.",
      timestamp: new Date(),
    },
    ...stages,
  ];
}

export function buildLabProgressStages(input: BuildLabProgressStagesInput): ProgressStage[] {
  const { processingStatus, processingError, includeUploadStage = false } = input;
  const safeMessage = processingError || "";
  const detail = extractReadableDetail(processingError);

  let stages: ProgressStage[];

  if (processingStatus === "COMPLETED") {
    stages = LAB_STAGE_TEMPLATES.map((template) => ({
      stage: template.name,
      status: "completed",
      message: template.completed,
      timestamp: new Date(),
    }));
  } else if (processingStatus === "FAILED") {
    stages = buildFailedStages(safeMessage, detail);
  } else {
    stages = buildProcessingStages(safeMessage, detail);
  }

  return includeUploadStage ? prependUploadStage(stages) : stages;
}

