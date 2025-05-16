// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'

const modelsWithStatus = ['User'] // List models that have a 'status' field

const prisma = new PrismaClient().$extends({
  name: 'SoftDelete',
  model: {
    $allModels: {
      async delete<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this)
        const modelName = (context as any).$name || (context as any).modelName
        
        // Create base data for soft deletion
        const newData: any = { deletedAt: new Date() }
        
        // Only update 'status' if this model is in the list
        if (modelName && modelsWithStatus.includes(modelName)) {
          newData.status = 'DELETED'
        }
        
        return (context as any).update({
          ...args,
          data: newData,
        })
      },
      
      async deleteMany<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this)
        const modelName = (context as any).$name || (context as any).modelName
        
        const newData: any = { deletedAt: new Date() }
        
        if (modelName && modelsWithStatus.includes(modelName)) {
          newData.status = 'DELETED'
        }
        
        return (context as any).updateMany({
          ...args,
          data: newData,
        })
      },
    },
  },
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      async findUnique({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      async findFirst({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      async count({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      async groupBy({ model, operation, args, query }) {
        // Ensure soft‑deleted rows are excluded from grouped results
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
})

export default prisma