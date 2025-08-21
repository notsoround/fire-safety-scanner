# AI Diagnosis and Fix Plan

## 🚨 CRITICAL TROUBLESHOOTING: OpenRouter Integration Issues

### **The Real Error (August 17, 2025)**

**Problem**: OpenRouter API calls failing with "unknown" responses despite valid API key

**Root Cause**: **WRONG MODEL NAME FORMAT** for litellm

**Wrong**: `google/gemini-2.5-pro`
**Correct**: `openrouter/google/gemini-2.5-pro`

**Error Message**:
```
litellm.BadRequestError: LLM Provider NOT provided. Pass in the LLM provider you are trying to call. 
You passed model=google/gemini-2.5-pro
Pass model as E.g. For 'Huggingface' inference endpoints pass in `completion(model='huggingface/starcoder',..)`
```

**Debug Process**:
1. Print statements not showing in Docker logs → Check `/var/log/supervisor/backend.out.log`
2. API returning success but "unknown" values → Check supervisor logs for real errors
3. Model name missing provider prefix → Add `openrouter/` prefix for litellm

**Files Fixed**:
- `backend/server.py`: Default model name
- `.env` and `.env.prod`: MODEL_ID environment variable

**Result**: Processing time went from ~100ms (no AI) to ~2000ms (real AI processing)

### **Key Lessons**:
- **litellm requires provider prefix** for OpenRouter models
- **Supervisor logs are separate** from Docker logs
- **Always check actual error logs** when debug prints don't show up

---

