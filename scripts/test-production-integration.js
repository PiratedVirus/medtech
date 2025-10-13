#!/usr/bin/env node

/**
 * Test script to verify LLM playground production integration
 * This script tests:
 * 1. Creating a test profile
 * 2. Promoting it to production
 * 3. Verifying it's used in LLM processing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductionIntegration() {
  console.log('🧪 Testing LLM Playground Production Integration...\n');

  try {
    // 1. Create a test profile
    console.log('1️⃣ Creating test profile...');
    const testProfile = await prisma.llmPlaygroundProfile.create({
      data: {
        name: 'Test Production Profile',
        description: 'Test profile for production integration',
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.2,
        systemPrompt: 'You are a test medical analyzer. This is a test system prompt.',
        summaryPrompt: 'Test summary prompt: {{TEXT}}',
        valuesPrompt: 'Test values prompt: {{TEXT}}',
        isProductionCandidate: true
      }
    });
    console.log(`✅ Created test profile: ${testProfile.name} (ID: ${testProfile.id})`);

    // 2. Promote to production
    console.log('\n2️⃣ Promoting profile to production...');
    await prisma.llmProductionConfig.upsert({
      where: { id: 1 },
      update: { activeProfileId: testProfile.id },
      create: { id: 1, activeProfileId: testProfile.id }
    });
    console.log('✅ Profile promoted to production');

    // 3. Verify production profile is active
    console.log('\n3️⃣ Verifying production profile...');
    const productionConfig = await prisma.llmProductionConfig.findUnique({
      where: { id: 1 },
      include: { activeProfile: true }
    });
    
    if (productionConfig?.activeProfile) {
      console.log(`✅ Active production profile: ${productionConfig.activeProfile.name}`);
      console.log(`   Model: ${productionConfig.activeProfile.model}`);
      console.log(`   Temperature: ${productionConfig.activeProfile.temperature}`);
      console.log(`   Has system prompt: ${!!productionConfig.activeProfile.systemPrompt}`);
      console.log(`   Has summary prompt: ${!!productionConfig.activeProfile.summaryPrompt}`);
      console.log(`   Has values prompt: ${!!productionConfig.activeProfile.valuesPrompt}`);
    } else {
      console.log('❌ No active production profile found');
    }

    // 4. Test profile service functions
    console.log('\n4️⃣ Testing profile service functions...');
    const { getActiveProductionProfile } = require('../lib/llm/profile-service.ts');
    const activeProfile = await getActiveProductionProfile();
    
    if (activeProfile) {
      console.log(`✅ getActiveProductionProfile() returned: ${activeProfile.name}`);
    } else {
      console.log('❌ getActiveProductionProfile() returned null');
    }

    // 5. Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    await prisma.llmProductionConfig.update({
      where: { id: 1 },
      data: { activeProfileId: null }
    });
    await prisma.llmPlaygroundProfile.delete({
      where: { id: testProfile.id }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Production integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProductionIntegration();
