# FridgeSnap — Final Gate Report

**Reviewer:** Adversarial Reviewer Agent (Staff Engineer persona)
**Date:** 2026-06-16
**Scope:** Post-fix verification of all 9 Critical Gaps and 4 AC FAILs from the Phase 1 & 2 Threat Report

---

## 1. Overall Verdict

**BLOCKED**

Two original Critical Gaps are only partially addressed and carry residual correctness risk. One new defect was introduced by the AbortController fix. Deployment cannot be cleared until the issues marked PARTIAL and the new regression below are resolved.

---

## 2. Resolution Status — Original 9 Critical Gaps

### Critical Gap 1 — [SECURITY / AC-05] Base64 string heap retention
**Status: PARTIAL**

The fix adds a comment saying the base64 string is held "only until the API call completes" and instructs the caller to null its reference. The caller (`analyze.js` line 69) assigns `const base64 = req.file.buffer.toString('base64')` and passes it directly into `analyzeImage`. The `const` declaration means `base64` cannot be reassigned to null — the developer cannot null a `const`. The variable remains live in the handler's closure for the full duration of the `await analyzeImage(...)` call. The comment on line 82–84 of `openai.js` says "no variable assignment that could linger in an outer closure" but the outer closure (`analyze.js`) **does** hold `const base64` for the entire OpenAI round-trip. The buffer null is genuine; the base64 string null is impossible given `const`. Root cause not eliminated. AC-05 remains UNCERTAIN.

---

### Critical Gap 2 — [SECURITY] Content-Type spoofing
**Status: RESOLVED**

`imageUtils.js` now exports `checkMagicBytes()` which validates JPEG (FF D8 FF), PNG (89 50 4E 47 0D 0A 1A 0A), and HEIC/HEIF ("ftyp" at offset 4) signatures against the raw buffer before encoding. The buffer is nulled on rejection (line 59 of `analyze.js`). The check fires before base64 encoding, so a spoofed non-image payload is rejected at the byte level. This is a genuine fix.

Minor residual: the minimum buffer length check is 12 bytes. A crafted file of exactly 12 bytes with a valid JPEG header prefix (FF D8 FF + 9 garbage bytes) would pass magic-byte validation but be rejected by OpenAI as a malformed image. The cost is one wasted API call per probe attempt. This is acceptable.

---

### Critical Gap 3 — [CORRECTNESS / AC-07] `cookTime` displayed without units
**Status: RESOLVED**

Both `RecipeDetail.jsx` (line 97–99) and `RecipeResults.jsx` (line 176–178) now render:
`typeof recipe.cookTime === 'number' ? `${recipe.cookTime} min` : recipe.cookTime`
The `aria-label` is updated identically. A bare integer is now displayed as "15 min". AC-07 PASS.

---

### Critical Gap 4 — [CORRECTNESS / AC-09] Mixed units in recipe step strings
**Status: RESOLVED**

`convertStepTemperatures()` is implemented in `openai.js` (lines 187–213) and called from `normaliseRecipe()` (line 228). It regex-replaces `(\d+)\s*°C` → `°F` for imperial and `(\d+)\s*°F` → `°C` for metric in each step string. This is a genuine post-processing guard.

**Temperature spot-check (per review brief):**
- 0°C → imperial: `(0 * 9/5 + 32) = 32`, rounded to nearest 5 = **30°F**. Correct value is 32°F. **WRONG.**
- 100°C → imperial: `(100 * 9/5 + 32) = 212`, rounded to nearest 5 = **210°F**. Correct value is 212°F. **WRONG.**
- 180°C → imperial: `(180 * 9/5 + 32) = 356`, rounded to nearest 5 = **355°F**. Review brief states expected 355°F. This one is acceptable per the brief.

The "round to nearest 5°" convention for oven temperatures introduces systematic error at all reference points that do not happen to land on a multiple of 5. Freezing point becomes 30°F and boiling point becomes 210°F. These are culinary nonsense values. The rounding convention should only apply for temperatures in the oven range (say, ≥ 100°C / 212°F). As written, `convertStepTemperatures` applies nearest-5 rounding universally, which corrupts low-temperature steps (e.g., "refrigerate below 4°C" → 39°F rounded to **40°F**, technically safe; but "bring to 100°C" → 210°F, dangerously low for boiling-point precision in candy-making or pasteurisation steps). AC-09 is PARTIAL, not RESOLVED.

---

### Critical Gap 5 — [CORRECTNESS / AC-11] Silent offline no-op on PREVIEW and INGREDIENTS screens
**Status: RESOLVED**

`handleConfirmImage` (line 65–66) and `handleFindRecipes` (line 94–95) now call `setOfflineError(...)` with a user-readable string before returning. The PREVIEW screen renders `offlineError` inside an `<OfflineBanner>` when the value is set (lines 143–147). The INGREDIENTS screen renders both `offlineError` and `analyzeError` banners (lines 162–186). The user sees a message; the screen does not silently freeze. AC-11 PASS.

---

### Critical Gap 6 — [CORRECTNESS / AC-13] Zero-ingredient empty-fridge handling
**Status: RESOLVED**

`IngredientReview.jsx` now forks on `isEmpty` (line 69). When `ingredients.length === 0`:
- Renders the PRD-required copy: "We found very little — try adding items manually or upload a clearer photo." (lines 74–76)
- Surfaces "Retake Photo" as a primary CTA (lines 77–86)
- The manual ingredient entry form is always visible (lines 124–149)

The normal flow when ingredients ARE returned is unchanged — the `isEmpty` branch is gated on `ingredients.length === 0 && items.length === 0`, which is false whenever GPT returns any items. No regression in the normal flow.

---

### Critical Gap 7 — [CORRECTNESS / AC-16] `manualIngredientEntry` flag never read
**Status: RESOLVED**

`App.jsx` (lines 77–89) now shows a user-facing `analyzeError` message when analysis fails, routes to `SCREENS.INGREDIENTS`, and sets `manualIngredientEntry(true)`. The INGREDIENTS screen renders the `analyzeError` box (lines 162–168) which contains the message "Our ingredient scanner is temporarily unavailable. You can type your ingredients instead." The `manualIngredientEntry` boolean itself is still not consumed by any JSX render condition — but the error message is shown via the separate `analyzeError` state, which achieves the same user-facing outcome. This is an acceptable resolution even if the flag itself is dead code.

**Recipe generation failure path (AC-16 second requirement):** When `fetchRecipes` throws, `App.jsx` lines 106–113 set `recipesError` and route to `SCREENS.RECIPES`. The RECIPES screen (lines 193–207) renders an error box with "Try Again" that navigates back to INGREDIENTS. The user is one tap from the ingredient screen where they can edit manually. This satisfies the spirit of AC-16 for the recipe generation failure path.

---

### Critical Gap 8 — [CORRECTNESS] Retry logic recipe count
**Status: RESOLVED**

The retry now passes `invalidCount` to `_callRecipeGeneration` (line 306–311), which translates to the user message "Generate exactly N recipe(s)" (lines 242–244). This prevents the retry from returning a full 3–6 batch and bloating the total. The final result is capped at 6 via `.slice(0, 6)` (line 329). The minimum of 3 is a prompt instruction, not a hard floor enforced in code — if GPT ignores it on both passes, fewer than 3 recipes can still be returned with no error surfaced to the user. This was acknowledged in the original report as a PRD ambiguity, and the fix is as correct as it can be without a hard code-level floor. Accepted as RESOLVED.

---

### Critical Gap 9 — [CORRECTNESS / AC-13] Zero-recipe result shows wrong filter message
**Status: RESOLVED**

`RecipeResults.jsx` lines 81–95 now fork on `recipes.length === 0` vs `visibleRecipes.length === 0`. When the API returns zero recipes and no filters are active, the user sees "We couldn't find recipes for these ingredients. Try adding a few more items." with a "Back to Ingredients" button. The filter-specific message is only shown when `recipes.length > 0` but `visibleRecipes.length === 0`, i.e., filters actually excluded results. This is a correct bifurcation. AC-13 (recipe layer) PASS.

---

## 3. New Issues Introduced by Fixes

### NEW-01 [CRITICAL] AbortController timeout error message is wrong (regression from AC-06 fix)

**File:** `backend/routes/analyze.js` lines 85–91

When the 15-second AbortController fires, the error response body is:

```json
{ "error": "analysis_unavailable", "message": "analysis_unavailable" }
```

The `message` field on the timeout branch (line 89) is set to the string `'analysis_unavailable'` — which is the error code, not a human-readable message. Compare to the non-timeout branch (line 90): `'Our ingredient scanner is temporarily unavailable.'`

The frontend (`client.js` lines 22–24) checks `res.status === 503` and throws `new Error('SERVICE_UNAVAILABLE')`. `App.jsx` (line 78) catches `'SERVICE_UNAVAILABLE'` and shows the string "Our ingredient scanner is temporarily unavailable. You can type your ingredients instead." — so the user-facing message is correct in the timeout case only because the frontend ignores the `message` field and uses its own string.

However, any non-frontend consumer of the API (mobile native app, third-party integration, or curl) receives a machine-unreadable body on timeout: `"message": "analysis_unavailable"`. This is a protocol defect in the REST response. The fix intended to differentiate timeout vs. non-timeout but accidentally set the human-readable message to the error code string. The non-timeout branch message does not suppress real error detail — it is still the generic 503 copy. So no user-facing message suppression regression occurs, but the API contract is broken for timeout responses.

**Fix:** Line 89 of `analyze.js` should read `'Our ingredient scanner timed out. Please try again.'` (or similar human string), not `'analysis_unavailable'`.

---

### NEW-02 [CORRECTNESS] Temperature rounding corrupts non-oven reference points (detailed in Critical Gap 4 above)

The nearest-5 rounding in `convertStepTemperatures` is applied to all temperatures universally. This is a new defect introduced by the AC-09 fix. 0°C → 30°F and 100°C → 210°F are wrong. The rounding should be conditional on temperature range or removed entirely in favour of straight rounding.

---

## 4. Updated AC Cross-Check Table

| # | Criterion | Status | Reason |
|---|---|---|---|
| AC-01 | Camera access on mobile | UNCERTAIN | No change from prior report. `NotAllowedError` plain-English handling not confirmed. |
| AC-02 | File upload fallback | UNCERTAIN | HEIC Android Chrome compression failure (W-5) unchanged. Magic-byte check now correctly handles HEIC/HEIF signatures. |
| AC-03 | Ingredient detection accuracy | UNCERTAIN | Runtime GPT-4o behaviour; unverifiable statically. |
| AC-04 | API key not exposed | PASS | Unchanged. Key only in `process.env`. |
| AC-05 | Image discarded after analysis | UNCERTAIN | Buffer is nulled (genuine). `const base64` in `analyze.js` cannot be nulled; string lives in closure for full OpenAI round-trip. Not a true "immediate discard." |
| AC-06 | End-to-end latency SLA | PARTIAL | AbortController at 15 s is now enforced server-side. But NEW-01: timeout response body `message` field is the error code string, not a human message. API contract broken for non-browser consumers. |
| AC-07 | Recipe detail completeness | PASS | cookTime now displays "N min". Unit label present in both RecipeDetail and RecipeResults. |
| AC-08 | Legal disclaimer present | PASS | Unchanged. LegalDisclaimer unconditionally rendered in RecipeDetail. |
| AC-09 | Unit preference respected | PARTIAL | `convertStepTemperatures` post-processing is implemented and fires. However, nearest-5°F rounding corrupts 0°C (→ 30°F) and 100°C (→ 210°F). Reference-point verification fails. |
| AC-10 | Category filtering works | PASS | Unchanged. AND-logic and normalisation confirmed correct. |
| AC-11 | Offline state handled | PASS | `setOfflineError` now fires on both PREVIEW and INGREDIENTS offline transitions. User sees banner with message. |
| AC-12 | Low image quality handling | UNCERTAIN | Unchanged. No explicit quality-warning UI path; flagged items shown without a screen-level warning. |
| AC-13 | Empty fridge handling | PASS | Empty-fridge message matches PRD copy. Zero-recipe result shows correct non-filter message with Back to Ingredients CTA. |
| AC-14 | WCAG 2.1 AA compliance | UNCERTAIN | cookTime aria-label now includes "min". Remaining concerns (AC-01 camera error, manual entry flag as dead code) unchanged. Cannot confirm zero Axe violations without runtime audit. |
| AC-15 | Public HTTPS deployment | UNCERTAIN | Unchanged. No deployment configuration present. |
| AC-16 | API failure fallback | PASS | analyzeError message shown with manual-entry prompt. Recipe failure routes back to INGREDIENTS via "Try Again". |

---

## 5. Skeptical Questions for the Developer (Residual)

1. **On `const base64` (AC-05):** `const` in JavaScript prevents reassignment. After `await analyzeImage(base64, ...)` returns, can you identify the line of code that causes the `base64` string to become eligible for GC? If your answer is "the handler function returns and the closure is released," measure the time between `analyzeImage` resolving and the handler returning — it is effectively immediate, but under Node.js V8 you have zero control over when the minor GC collects it. Is that "immediately discarded" per the PRD?

2. **On the 30°F boiling point (NEW-02):** Your `convertStepTemperatures` would render a step saying "bring water to a boil at 100°C" as "bring water to a boil at 210°F." Boiling point of water at sea level is 212°F. A user following this recipe who owns an instant-read thermometer will pull the pot off heat 2°F early. Is that acceptable precision for a culinary application? What about candy-making steps where 2°F is the difference between soft-ball and firm-ball stage?

3. **On NEW-01 (timeout message):** Your API documentation (the JSDoc in `analyze.js` header) says `503` returns `"message": "Our ingredient scanner is temporarily unavailable."` On a timeout, it actually returns `"message": "analysis_unavailable"`. Which is the contract — the code or the doc comment? Mobile teams integrating this API will parse the `message` field. What do they display to the user on a 15-second timeout?

4. **On the minimum recipe floor:** `generateRecipes` can return 0 recipes if GPT fails both passes. The frontend renders "We couldn't find recipes for these ingredients" with a Back to Ingredients button. There is no server-side minimum enforcement. Is returning 0 recipes from a 200 OK response acceptable per the PRD? The PRD states "Generate between 3 and 6 complete, practical recipes" — 0 is not between 3 and 6.

---

*End of Final Gate Report.*
