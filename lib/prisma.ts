// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'

const modelsWithStatus = ['User'] // List models that have a 'status' field

const prisma = new PrismaClient().$extends({
  name: 'SoftDelete',
  model: {
    $allModels: {
      async delete<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this)
        // Create base data for soft deletion
        const newData: any = { deletedAt: new Date() }
        // Only update 'status' if this model is in the list.
        if ((context as any)?.modelName && modelsWithStatus.includes((context as any).modelName)) {
          newData.status = 'DELETED'
        }
        return (context as any).update({
          ...args,
          data: newData,
        })
      },
      async deleteMany<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this)
        const newData: any = { deletedAt: new Date() }
        if ((context as any)?.modelName && modelsWithStatus.includes((context as any).modelName)) {
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
    },
  },
})

export default prisma