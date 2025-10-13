const { PrismaClient } = require("@prisma/client");
const { robustFix } = require('./robustFix');

const prisma = new PrismaClient();

async function runRobustFix() {
  console.log("🔧 Running robust fix to ensure all tables are properly populated...");
  console.log("⚠️  This will add missing data without losing existing data");
  
  try {
    await robustFix(prisma);
    console.log("✅ Robust fix completed successfully!");
  } catch (error) {
    console.error("❌ Error running robust fix:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runRobustFix()
    .catch((e) => {
      console.error("💥 FATAL ERROR:", e);
      process.exit(1);
    });
}

module.exports = { runRobustFix }; 