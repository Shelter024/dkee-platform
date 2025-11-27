/**
 * AI provider abstraction layer
 * Supports multiple AI providers (OpenAI, Anthropic, etc.)
 */

import { getConfig } from './config';
import { prisma } from './prisma';

export type AIProvider = 'openai' | 'anthropic' | 'huggingface' | 'mock';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get AI configuration from database config (with .env fallback)
 */
export async function getAIConfig(): Promise<AIConfig> {
  // Try to get from database first
  const dbProvider = await getConfig('ai_provider', prisma);
  const dbOpenAIKey = await getConfig('openai_api_key', prisma);
  const dbAnthropicKey = await getConfig('anthropic_api_key', prisma);
  const dbHuggingFaceKey = await getConfig('huggingface_api_key', prisma);
  const dbModel = await getConfig('ai_model', prisma);

  // Fall back to environment variables
  const provider = (dbProvider || process.env.AI_PROVIDER || 'mock') as AIProvider;
  
  let apiKey: string | undefined;
  if (provider === 'openai') {
    apiKey = dbOpenAIKey || process.env.OPENAI_API_KEY;
  } else if (provider === 'anthropic') {
    apiKey = dbAnthropicKey || process.env.ANTHROPIC_API_KEY;
  } else if (provider === 'huggingface') {
    apiKey = dbHuggingFaceKey || process.env.HUGGINGFACE_API_KEY;
  }

  return {
    provider,
    apiKey,
    model: dbModel || process.env.AI_MODEL || getDefaultModel(provider),
  };
}

/**
 * Get default model for provider
 */
function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4';
    case 'anthropic':
      return 'claude-3-sonnet-20240229';
    case 'huggingface':
      return 'mistralai/Mistral-7B-Instruct-v0.2'; // Free, good for general text
    default:
      return '';
  }
}

/**
 * Generate completion using configured AI provider
 */
export async function generateCompletion(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<AIResponse> {
  const config = await getAIConfig();

  switch (config.provider) {
    case 'openai':
      return generateOpenAICompletion(prompt, config, options);
    
    case 'anthropic':
      return generateAnthropicCompletion(prompt, config, options);
    
    case 'huggingface':
      return generateHuggingFaceCompletion(prompt, config, options);
    
    case 'mock':
    default:
      return generateMockCompletion(prompt, options);
  }
}

/**
 * OpenAI provider implementation
 */
async function generateOpenAICompletion(
  prompt: string,
  config: AIConfig,
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful writing assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 500,
      temperature: options?.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    text: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * Anthropic provider implementation
 */
async function generateAnthropicCompletion(
  prompt: string,
  config: AIConfig,
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-sonnet-20240229',
      messages: [
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 500,
      temperature: options?.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    text: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * Hugging Face Inference API provider (FREE)
 * Supports open-source models like Mistral, Llama, etc.
 */
async function generateHuggingFaceCompletion(
  prompt: string,
  config: AIConfig,
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('Hugging Face API key not configured');
  }

  const model = config.model || 'mistralai/Mistral-7B-Instruct-v0.2';

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: options?.maxTokens || 500,
          temperature: options?.temperature || 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  
  // Handle array response from Hugging Face
  const text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
  
  return {
    text: text.trim(),
    usage: {
      promptTokens: Math.ceil(prompt.length / 4), // Estimate
      completionTokens: Math.ceil(text.length / 4), // Estimate
      totalTokens: Math.ceil((prompt.length + text.length) / 4),
    },
  };
}

/**
 * Mock provider for development/testing
 */
async function generateMockCompletion(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    text: `[Mock AI Response]\n\nThis is a mock AI response for development. Configure AI_PROVIDER, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your environment to use real AI.\n\nPrompt received: "${prompt.substring(0, 100)}..."`,
    usage: {
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150,
    },
  };
}
