const { PrismaClient } = require("@prisma/client");
const { comprehensiveSeed } = require('./comprehensiveSeed');

const prisma = new PrismaClient();

async function fixMissingData() {
  console.log("🔧 Fixing missing data in existing database...");
  console.log("⚠️  This will only add missing data, existing data will be preserved");
  
  try {
    await comprehensiveSeed(prisma);
    console.log("✅ Missing data has been successfully added!");
  } catch (error) {
    console.error("❌ Error fixing missing data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixMissingData()
    .catch((e) => {
      console.error("💥 FATAL ERROR:", e);
      process.exit(1);
    });
}

module.exports = { fixMissingData }; 