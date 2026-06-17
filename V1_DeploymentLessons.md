# FridgeSnap Deployment — Lessons Learned

**Project:** FridgeSnap (AI-powered fridge recipe app)
**Date:** 2026-06-16
**Stack:** Vite + React (Vercel) → Express (Render) → OpenAI GPT-4o

---

## 3 Key Findings

1. **Always set Root Directories correctly from the start.** Both Vercel and Render defaulted to the repo root instead of `frontend/` and `backend/`. This caused the wrong code to deploy and wasted a lot of debugging time. Next time: set these *before* the first deployment.

2. **Use Vercel proxy rewrites instead of direct API calls.** Calling Render directly from the browser caused messy CORS errors. Routing everything through `/api/*` on Vercel eliminated the problem entirely. This should be the default setup from day one.

3. **Make sure your OpenAI account has credits before deploying.** The app was 100% working — the only problem was an empty wallet on the OpenAI side. Next time: verify the API key works (with a simple test call) *before* deploying.

## 2 Potential Risks

1. **Render free tier goes to sleep after inactivity.** The first request after a nap takes ~50 seconds. Users might think the app is broken. Consider upgrading or adding a "waking up" message.

2. **No error logging by default.** We originally suppressed all error details for security, which made debugging nearly impossible. The logging line we added saved us — keep it.

## 1 Recommended Next Step

**Create a deployment checklist** for future projects — a simple list:

- [ ] Set root directories (Vercel + Render)
- [ ] Configure proxy rewrites in `vercel.json`
- [ ] Test the API key has credits
- [ ] Set all environment variables (like `OPENAI_API_KEY`) *before* first deploy
- [ ] Check the Render logs after first request

---

*Generated from the FridgeSnap deployment retrospective.*
