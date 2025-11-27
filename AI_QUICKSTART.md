# 🚀 Quick AI Setup - 3 Steps

## Step 1: Get Free API Key
Visit: https://huggingface.co/settings/tokens
→ Create new token (Read access)
→ Copy token (starts with `hf_...`)

## Step 2: Add to .env
\`\`\`env
HUGGINGFACE_API_KEY=hf_YourTokenHere
\`\`\`

## Step 3: Restart Server
\`\`\`powershell
npm run dev
\`\`\`

## ✅ You're Done!
- Free: 1,000 requests/day
- Model: Mistral-7B-Instruct (excellent quality)
- Features: Blog excerpts, outlines, SEO descriptions

## Test It
\`\`\`powershell
curl -X POST http://localhost:3000/api/ai/suggest-excerpt \`
  -H "Content-Type: application/json" \`
  -d '{"title":"Test","content":"<p>Fleet maintenance is important...</p>"}'
\`\`\`

Full guide: See `FREE_AI_SETUP.md`
