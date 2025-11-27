/**
 * Initialize AI settings in database
 * Run this once to set up AI configuration
 * 
 * Usage: tsx scripts/init-ai-settings.ts
 */

import { PrismaClient } from '@prisma/client';
import { setConfig } from '../src/lib/config';

const prisma = new PrismaClient();

async function initAISettings(): Promise<void> {
  console.log('🤖 Initializing AI settings...\n');

  try {
    // Set default AI provider to Hugging Face (FREE)
    await setConfig('ai_provider', 'huggingface', prisma);
    console.log('✓ Set ai_provider = huggingface (FREE)');

    // Set empty API keys (to be filled in later via UI or .env)
    await setConfig('openai_api_key', '', prisma);
    console.log('✓ Set openai_api_key = (empty, encrypted)');

    await setConfig('anthropic_api_key', '', prisma);
    console.log('✓ Set anthropic_api_key = (empty, encrypted)');

    await setConfig('huggingface_api_key', '', prisma);
    console.log('✓ Set huggingface_api_key = (empty, encrypted)');

    // Set default model to empty (will use provider defaults)
    await setConfig('ai_model', '', prisma);
    console.log('✓ Set ai_model = (empty, uses Mistral-7B-Instruct by default)');

    console.log('\n✅ AI settings initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Get FREE Hugging Face API key:');
    console.log('      - Visit: https://huggingface.co/settings/tokens');
    console.log('      - Create new token (read access is enough)');
    console.log('      - Add to .env: HUGGINGFACE_API_KEY=hf_...');
    console.log('   2. Restart dev server: npm run dev');
    console.log('   3. Test AI excerpt generation in blog editor');
    console.log('\n💡 Free tier: 1000 requests/day (perfect for blog content)');
    console.log('💡 The system will prioritize: Database settings > .env > defaults');
  } catch (error) {
    console.error('❌ Failed to initialize AI settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initAISettings();
