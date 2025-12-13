// Prisma 7 configuration for migrations
// Connection URLs are moved here from schema.prisma
export default {
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
}
