// lib/prisma.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client'

// For Prisma 7: use adapter if available, otherwise fall back to default
let adapter: any = undefined
try {
  // Try to use Prisma 7 adapter if packages are installed
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg')
    const { PrismaPg } = require('@prisma/adapter-pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
    })
    adapter = new PrismaPg(pool)
  }
} catch {
  // Adapter packages not installed, will use default connection
  adapter = undefined
}

// --- Models that truly have a deletedAt column (must match your schema) ---
const SOFT_DELETE_MODELS = new Set<string>([
  'User',
  'Clinic',
  'ClinicSpecialization',
  'PatientProfile',
  'DoctorProfile',
  'DieticianProfile',
  'LabTechProfile',
  'Phlebotomist',
  'PathologyLab',
  'LabAssignment',
  'LabTest',
  'TestResult',
  'DoctorAvailability',
  'DieticianAvailability',
  'Appointment',
  'Medicine',
  'Complaint',
  'Payment',
  'LabPackage',
  'LabBooking',
  'Plan',
  'PlanFeature',
  'SubscriptionTracker',
  'HealthMetric',
  'PrescriptionTemplate',
  'CommonValue',
  'LabReportAnalysis',
  'ReportTrendData',
] as const)

// Optional: models where you also flip a status on soft delete
const MODELS_WITH_STATUS = new Set<string>(['User'] as const)

// --- Reuse a single Prisma client in dev, with typed global ---
declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_BASE__: PrismaClient | undefined
}

const base: PrismaClient = global.__PRISMA_BASE__ ?? new PrismaClient(adapter ? { adapter } : {})
if (!global.__PRISMA_BASE__) global.__PRISMA_BASE__ = base

// Map model name -> delegate property, e.g. "User" -> "user"
const delegateName = (model: string) =>
  model.length ? (model[0]!.toLowerCase() + model.slice(1)) : model

type CrudDelegate = {
  delete: (args: any) => Promise<any>
  deleteMany: (args: any) => Promise<any>
  update: (args: any) => Promise<any>
  updateMany: (args: any) => Promise<any>
}

const getDelegate = (model: string): CrudDelegate =>
  (base as any)[delegateName(model)] as CrudDelegate

// Build an extended client that handles soft-delete purely in the query layer
const prisma = base.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }: { model: string; args: any; query: (a: any) => Promise<any> }) {
        if (!SOFT_DELETE_MODELS.has(model)) return query(args)
        const nextArgs = {
          ...args,
          where: {
            ...(args?.where ?? {}),
            ...(args?.where?.deletedAt === undefined ? { deletedAt: null } : {}),
          },
        }
        return query(nextArgs)
      },

      async findFirst({ model, args, query }: { model: string; args: any; query: (a: any) => Promise<any> }) {
        if (!SOFT_DELETE_MODELS.has(model)) return query(args)
        const nextArgs = {
          ...args,
          where: {
            ...(args?.where ?? {}),
            ...(args?.where?.deletedAt === undefined ? { deletedAt: null } : {}),
          },
        }
        return query(nextArgs)
      },

      // IMPORTANT: do not mutate findUnique.where (must match a unique key)
      async findUnique({ model, args, query }: { model: string; args: any; query: (a: any) => Promise<any> }) {
        if (!SOFT_DELETE_MODELS.has(model)) return query(args)
        const row = await query(args)
        if (row && Object.prototype.hasOwnProperty.call(row as any, 'deletedAt')) {
          return (row as any).deletedAt === null ? row : null
        }
        return row
      },

      async count({ model, args, query }: { model: string; args: any; query: (a: any) => Promise<any> }) {
        if (!SOFT_DELETE_MODELS.has(model)) return query(args)
        const nextArgs = {
          ...args,
          where: {
            ...(args?.where ?? {}),
            ...(args?.where?.deletedAt === undefined ? { deletedAt: null } : {}),
          },
        }
        return query(nextArgs)
      },

      async groupBy({ model, args, query }: { model: string; args: any; query: (a: any) => Promise<any> }) {
        if (!SOFT_DELETE_MODELS.has(model)) return query(args)
        const nextArgs = {
          ...args,
          where: {
            ...(args?.where ?? {}),
            ...(args?.where?.deletedAt === undefined ? { deletedAt: null } : {}),
          },
        }
        return query(nextArgs)
      },

      // Convert delete -> update (soft delete) for models with deletedAt; otherwise do a hard delete
      async delete({ model, args }: { model: string; args: any }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return getDelegate(model).delete(args)
        }
        const data: any = { deletedAt: new Date() }
        if (MODELS_WITH_STATUS.has(model)) data.status = 'DELETED'
        return getDelegate(model).update({ where: args.where, data })
      },

      // Convert deleteMany -> updateMany (soft delete) for models with deletedAt; otherwise hard deleteMany
      async deleteMany({ model, args }: { model: string; args: any }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return getDelegate(model).deleteMany(args)
        }
        const data: any = { deletedAt: new Date() }
        if (MODELS_WITH_STATUS.has(model)) data.status = 'DELETED'
        return getDelegate(model).updateMany({ where: args.where, data })
      },
    },
  },
})

export default prisma