# Free AI Setup Guide - Hugging Face Integration

## ✅ What You Get (100% FREE)

- **1,000 AI requests per day** - More than enough for blog content generation
- **No credit card required**
- **Enterprise-grade models**: Mistral-7B, Llama-3.2, and more
- **Perfect for**: Blog excerpts, content outlines, SEO meta descriptions

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Hugging Face Account

1. Go to: **https://huggingface.co/join**
2. Sign up with email (free, no payment needed)
3. Verify your email

### Step 2: Generate API Token

1. Visit: **https://huggingface.co/settings/tokens**
2. Click **"New token"**
3. Settings:
   - Name: `DKee CMS`
   - Type: **Read** (sufficient for inference)
4. Click **"Generate token"**
5. **Copy the token** (starts with `hf_...`)
   - ⚠️ You won't see it again after closing!

### Step 3: Add to Your Project

Open your `.env` file and update:

\`\`\`env
# Already configured:
AI_PROVIDER=huggingface

# Add your token here:
HUGGINGFACE_API_KEY=hf_YourActualTokenHere

# Optional - specify model (or use default Mistral-7B):
AI_MODEL=mistralai/Mistral-7B-Instruct-v0.2
\`\`\`

### Step 4: Restart Dev Server

\`\`\`powershell
# Stop current server (Ctrl+C), then:
npm run dev
\`\`\`

---

## 🎯 Recommended FREE Models

Your system defaults to **Mistral-7B-Instruct-v0.2** (excellent general purpose).

Other great free options:

| Model | Best For | Speed | Quality |
|-------|----------|-------|---------|
| \`mistralai/Mistral-7B-Instruct-v0.2\` | General content | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| \`meta-llama/Llama-3.2-3B-Instruct\` | Fast responses | ⚡⚡⚡⚡ | ⭐⭐⭐ |
| \`google/gemma-7b-it\` | Technical content | ⚡⚡ | ⭐⭐⭐⭐ |
| \`microsoft/phi-2\` | Short excerpts | ⚡⚡⚡⚡ | ⭐⭐⭐ |

To change model, update `.env`:
\`\`\`env
AI_MODEL=meta-llama/Llama-3.2-3B-Instruct
\`\`\`

---

## 🧪 Test It Works

### Option 1: Admin Dashboard (Once Logged In)

1. Go to: `http://localhost:3000/dashboard/admin/blog`
2. Create/edit a blog post
3. Write some content
4. Click **"Suggest Excerpt"** button (uses AI)

### Option 2: Direct API Test

\`\`\`powershell
# Test excerpt generation
curl -X POST http://localhost:3000/api/ai/suggest-excerpt \`
  -H "Content-Type: application/json" \`
  -d '{
    "title": "Fleet Maintenance Tips for 2025",
    "content": "<p>Regular vehicle maintenance is crucial for fleet longevity. Proper oil changes, tire rotations, and brake inspections can prevent costly breakdowns...</p>"
  }'
\`\`\`

Expected response:
\`\`\`json
{
  "excerpt": "Discover essential fleet maintenance strategies...",
  "usage": { "totalTokens": 156 }
}
\`\`\`

---

## 💡 How It Works in Your CMS

### Automatic Features Enabled:

1. **Blog Excerpt Generation** (`/api/ai/suggest-excerpt`)
   - Analyzes your blog content
   - Generates compelling 2-3 sentence summaries
   - Perfect for SEO meta descriptions

2. **Content Outlines** (`/api/ai/outline`)
   - Enter a topic (e.g., "Preventive Auto Maintenance")
   - AI generates structured outline with sections
   - Speeds up content creation

### Usage in Code:

\`\`\`typescript
import { generateCompletion } from '@/lib/ai';

// Simple completion
const response = await generateCompletion(
  'Write a brief excerpt about fleet management services',
  { maxTokens: 150, temperature: 0.7 }
);

console.log(response.text);
\`\`\`

---

## 📊 Rate Limits & Costs

### Free Tier (What You Get):
- ✅ 1,000 requests/day
- ✅ All open-source models
- ✅ No credit card needed
- ✅ No expiration

### Typical Usage:
- **Blog excerpt**: ~1 request (150 tokens)
- **Content outline**: ~1 request (500 tokens)
- **Daily capacity**: ~500-1000 blog posts worth of AI assistance

### If You Exceed Limits:
You'll get a 429 error. Options:
1. Wait until next day (resets at midnight UTC)
2. Upgrade to Pro ($9/month = 10,000 requests/day)
3. Use multiple tokens with round-robin (advanced)

---

## 🔒 Security Best Practices

✅ **DO:**
- Store token in `.env` (already gitignored)
- Use read-only token (sufficient for inference)
- Monitor usage at: https://huggingface.co/settings/billing

❌ **DON'T:**
- Commit token to git
- Use `NEXT_PUBLIC_` prefix (exposes to browser)
- Share token publicly

---

## 🐛 Troubleshooting

### "API key not configured"
- Check `.env` has: `HUGGINGFACE_API_KEY=hf_...`
- Restart dev server after adding key

### "Model loading" / Slow first request
- Free models "cold start" if unused for 15+ minutes
- First request may take 10-20 seconds
- Subsequent requests are instant
- Consider warming up on server start (optional)

### "Rate limit exceeded"
- Check usage: https://huggingface.co/settings/billing
- Free tier = 1000 req/day
- Resets at midnight UTC

### Model errors / Bad responses
- Try different model (see Recommended Models above)
- Adjust temperature (0.5 = more focused, 0.9 = more creative)
- Reduce max_tokens if truncated

---

## 🚀 Advanced: Custom Prompts

Edit `src/app/api/ai/suggest-excerpt/route.ts`:

\`\`\`typescript
const prompt = \`Based on this automotive/property services content, write a compelling excerpt:

Title: \${title}
Content: \${preview}

Focus on:
- Key benefits for fleet managers
- Practical takeaways
- Professional tone

Excerpt (2-3 sentences):\`;
\`\`\`

---

## 📈 Monitoring Usage

Track AI calls in your database:

\`\`\`sql
-- See recent AI usage
SELECT 
  action, 
  metadata->>'model' as model,
  COUNT(*) as calls
FROM audit_log 
WHERE action LIKE 'ai.%'
GROUP BY action, model
ORDER BY calls DESC;
\`\`\`

Or add custom analytics:
\`\`\`typescript
await prisma.aiUsageLog.create({
  data: {
    provider: 'huggingface',
    model: config.model,
    tokens: response.usage.totalTokens,
    cost: 0, // Free tier
  }
});
\`\`\`

---

## 🎓 Learning Resources

- **Hugging Face Docs**: https://huggingface.co/docs/api-inference
- **Model Explorer**: https://huggingface.co/models?pipeline_tag=text-generation&sort=trending
- **Pricing**: https://huggingface.co/pricing

---

## ✨ What's Next?

Your CMS now has FREE AI-powered:
- Blog excerpt generation
- Content outline creation
- SEO meta description suggestions

**Future enhancements** (optional):
- AI image generation (Stable Diffusion via HF)
- Auto-tagging blog posts
- Content quality scoring
- Chatbot for customer inquiries

---

**Setup complete! 🎉** Your automotive/property services CMS now has intelligent content assistance at zero cost.
