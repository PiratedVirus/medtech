import prisma from '@/lib/prisma';

export type PlaygroundProfileInput = {
  name: string;
  description?: string;
  provider?: string;
  model: string;
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  seed?: number | null;
  stop?: string[] | null;
  systemPrompt?: string | null;
  userPrompt?: string | null;
  valuesPrompt?: string | null;
  summaryPrompt?: string | null;
  toolsConfig?: any | null;
  isActive?: boolean;
  isProductionCandidate?: boolean;
  parentProfileId?: number | null;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
};

export async function listProfiles(query?: { search?: string }) {
  const where = query?.search
    ? { OR: [ { name: { contains: query.search, mode: 'insensitive' as const } }, { description: { contains: query.search, mode: 'insensitive' as const } } ] }
    : undefined;
  return prisma.llmPlaygroundProfile.findMany({ where, orderBy: [{ updatedAt: 'desc' }] });
}

export async function getProfileById(profileId: number) {
  return prisma.llmPlaygroundProfile.findUnique({ where: { id: profileId } });
}

export async function getActiveProductionProfile() {
  const config = await prisma.llmProductionConfig.findUnique({ where: { id: 1 } });
  if (!config?.activeProfileId) return null;
  return prisma.llmPlaygroundProfile.findUnique({ where: { id: config.activeProfileId } });
}

export async function createProfile(input: PlaygroundProfileInput) {
  return prisma.llmPlaygroundProfile.create({ data: {
    name: input.name,
    description: input.description ?? null,
    provider: input.provider ?? 'groq',
    model: input.model,
    temperature: input.temperature ?? 0.2,
    topP: input.topP ?? null,
    maxTokens: input.maxTokens ?? null,
    seed: input.seed ?? null,
    stop: input.stop ?? [],
    systemPrompt: input.systemPrompt ?? null,
    userPrompt: input.userPrompt ?? null,
    valuesPrompt: input.valuesPrompt ?? null,
    summaryPrompt: input.summaryPrompt ?? null,
    toolsConfig: input.toolsConfig ?? null,
    isActive: input.isActive ?? true,
    isProductionCandidate: input.isProductionCandidate ?? false,
    parentProfileId: input.parentProfileId ?? null,
    createdByUserId: input.createdByUserId ?? null,
    updatedByUserId: input.updatedByUserId ?? null,
  }});
}

export async function updateProfile(profileId: number, input: Partial<PlaygroundProfileInput>) {
  const cleanData: any = { ...input };
  if (cleanData.parentProfileId === null) {
    delete cleanData.parentProfileId;
  }
  
  return prisma.llmPlaygroundProfile.update({ 
    where: { id: profileId }, 
    data: cleanData
  });
}

export async function promoteProfileToProduction(profileId: number) {
  await prisma.llmProductionConfig.upsert({
    where: { id: 1 },
    update: { activeProfileId: profileId },
    create: { id: 1, activeProfileId: profileId },
  });
  return getProfileById(profileId);
}

export type StageLog = {
  name: string;
  request?: any;
  response?: any;
  error?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  latencyMs?: number | null;
  startedAt: string;
  finishedAt?: string | null;
};

export type PlaygroundRunRecord = {
  id: number;
  profileId: number;
  status: string;
  inputType: string;
  sourceFileUrl?: string | null;
  rawInput?: string | null;
  finalOutput?: string | null;
  stageLogs?: StageLog[] | null;
  startedAt: string;
  finishedAt?: string | null;
};

export async function createRun(params: { profileId: number; inputType: string; rawInput?: string | null; sourceFileUrl?: string | null; createdByUserId?: number | null; }) {
  const run = await prisma.llmPlaygroundRun.create({ data: {
    profileId: params.profileId,
    inputType: params.inputType,
    status: 'queued',
    rawInput: params.rawInput ?? null,
    sourceFileUrl: params.sourceFileUrl ?? null,
    createdByUserId: params.createdByUserId ?? null,
  }});
  return run;
}

export async function appendStageLog(runId: number, stage: StageLog, updateStatus?: string) {
  const existing = await prisma.llmPlaygroundRun.findUnique({ where: { id: runId } });
  const logs: StageLog[] = Array.isArray((existing as any)?.stageLogs) ? (existing as any).stageLogs as StageLog[] : [];
  logs.push(stage);
  return prisma.llmPlaygroundRun.update({ where: { id: runId }, data: { stageLogs: logs as any, status: updateStatus ?? existing?.status } });
}

export async function completeRun(runId: number, finalOutput: any, status: 'completed'|'failed') {
  return prisma.llmPlaygroundRun.update({ where: { id: runId }, data: { finalOutput: typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput), status, finishedAt: new Date() } });
}

export async function getRunById(runId: number) {
  return prisma.llmPlaygroundRun.findUnique({ where: { id: runId }, include: { profile: true } });
}


