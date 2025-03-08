// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
const prisma = new PrismaClient().$extends({
  name: 'SoftDelete',
  model: {
    $allModels: {
      async delete<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this)
        return (context as any).update({
          ...args,
          data: {
            deletedAt: new Date(),
            status: 'DELETED' // For User model
          }
        })
      },
      async deleteMany<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this)
        return (context as any).updateMany({
          ...args,
          data: {
            deletedAt: new Date(),
            status: 'DELETED' // For User model
          }
        })
      }
    }
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
      }
    }
  }
})

export default prisma