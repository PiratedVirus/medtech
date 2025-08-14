const { PrismaClient } = require('@prisma/client');
const { seedLlmPlaygroundProfile } = require('./llmPlaygroundProfile');

(async () => {
  const prisma = new PrismaClient();
  try {
    const profile = await seedLlmPlaygroundProfile(prisma);
    console.log('LLM Playground profile ready. id=', profile.id);
  } catch (e) {
    console.error('Seeding LLM Playground profile failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();


