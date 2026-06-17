# PRD: FridgeSnap — AI-Powered Recipe Suggester

**Version:** 1.0
**Date:** 2026-06-16
**Status:** Draft — Pending Stakeholder Review

---

## Problem Statement

Home cooks frequently open their refrigerator, see a collection of ingredients, and have no idea what to make. This leads to food waste, unnecessary grocery runs, and reliance on expensive takeout. There is no fast, frictionless way to go from "what's in my fridge?" to "here's what I can cook tonight" — without manually typing out every ingredient.

---

## Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce time from fridge-open to recipe suggestion | Time-to-first-recipe | Under 30 seconds |
| Ingredient detection accuracy | Precision rate | 85% or higher |
| User satisfaction with recipe relevance | Post-session rating | 4 out of 5 stars average |
| Mobile engagement | Sessions initiated on mobile | 70% or higher |
| Reduce food waste (user-reported) | Survey metric at 30 days | 40% of users report improvement |

---

## 1. User Persona & Primary User Journey

### Persona A — The Busy Parent

**Name:** Maya, 38
**Lifestyle:** Works full-time, manages a household with two children. Cooks dinner 5 nights a week but rarely has time to plan meals in advance.
**Pain Point:** She opens the fridge at 6 PM and has no idea what to make. She doesn't want to search recipe sites and manually check whether she has the ingredients.
**Goal:** Get a practical, family-friendly dinner idea in under a minute, using what she already has.

---

### Persona B — The Budget-Conscious Single Professional

**Name:** Jordan, 27
**Lifestyle:** Lives alone, shops once a week, and tries to avoid food waste. Confident in the kitchen but uninspired.
**Pain Point:** Ingredients go bad before Jordan can use them because meals aren't planned around what's actually available.
**Goal:** Use up ingredients before they expire by getting creative recipe suggestions tailored to exactly what's on hand.

---

### Primary User Journey

1. **Open App** — User lands on the home screen on their mobile device. A single clear call-to-action reads: "Snap Your Fridge."
2. **Capture or Upload** — User takes a photo of the inside of their fridge using the in-app camera, or uploads an existing photo from their device.
3. **Preview & Confirm** — User sees a preview of the photo and can retake it or proceed.
4. **AI Analysis** — The app submits the image to the vision analysis service. A loading state communicates progress (e.g., "Finding your ingredients...").
5. **Ingredient Review** — The detected ingredients are displayed as a visual checklist. The user can remove false positives or manually add missing items.
6. **Recipe Results** — The app surfaces 3 to 6 recipe suggestions. Each card shows the recipe name, estimated cook time, a category tag, and a thumbnail image.
7. **Recipe Detail** — User taps a recipe to see full step-by-step instructions, an ingredient checklist with quantities, cook time, and serving size.
8. **Cook & Complete** — User follows the recipe. Optionally, they rate the suggestion at the end.

---

## 2. Core Feature Requirements

### 2.1 Image Capture and Upload

- The app must access the device camera directly from the browser on mobile, without requiring a native app install.
- Users must be able to switch to a file upload option as a fallback (for desktop users or those who prefer uploading a saved photo).
- After capture or selection, a full-screen preview must be shown with two options: "Retake" and "Use This Photo."
- The accepted image formats are JPEG, PNG, and HEIC. Maximum file size is 10 MB.
- If camera permission is denied, the app must display a plain-English explanation and automatically offer the file upload alternative.

### 2.2 Vision Analysis Integration

- The uploaded image is sent to a server-side proxy. The proxy forwards the image to a computer vision or multimodal AI API. The API key is never exposed to the client.
- The vision model must return a structured list of identified ingredients with a confidence score for each.
- Items with a confidence score below a configurable threshold (default: 70%) must be flagged for user review rather than automatically included.
- The ingredient extraction result must be returned to the user within 10 seconds under normal network conditions.
- The system must distinguish between food items and non-food items (e.g., cleaning spray, condiment bottles with no readable label) and exclude non-food items from the ingredient list by default.

### 2.3 Recipe Rendering

- Each recipe suggestion must include: recipe name, a representative image, total estimated cook time, serving size, a full ingredient list with quantities, and numbered step-by-step instructions.
- An ingredient checklist must allow users to tick off items as they cook.
- Recipes must clearly indicate which detected ingredients from the user's fridge are used, and which additional items (if any) are needed.
- The recipe detail view must be readable and usable with one hand on a mobile device.

### 2.4 Categorisation and Filtering

- Every recipe must be tagged with at least one of the following categories: Dairy, Meat, Vegan, Vegetarian, Gluten-Free, Quick and Easy (30 minutes or under).
- The recipe results screen must include a filter bar allowing users to select one or more category tags to narrow results.
- Filters must apply instantly without a full page reload.
- The system must surface at least one "Quick and Easy" recipe whenever the detected ingredient set supports it.

---

## 3. Non-Functional Requirements

### Security
- The vision AI API key must never appear in client-side code, network responses, or browser developer tools. All calls to the AI service must be routed through a server-side proxy.
- User-uploaded images must not be stored permanently without explicit opt-in consent. By default, images are discarded after analysis is complete.

### Mobile Responsiveness
- The primary design target is 390 px viewport width (iPhone 14 Pro equivalent).
- All interactive elements must meet a minimum touch target size of 44 x 44 px.
- The app must be fully functional on current versions of Safari (iOS) and Chrome (Android).

### Performance and Latency
- Vision analysis must complete and return results within 10 seconds for 95% of requests under standard network conditions.
- Recipe results page must reach a visually complete state within 2 seconds of ingredient confirmation.
- Images must be compressed client-side before upload if they exceed 3 MB, to reduce upload time on mobile networks.

### Accessibility
- The application must meet WCAG 2.1 AA standards at minimum.
- All images must have descriptive alt text. All form controls must have associated labels.
- The app must be operable using a screen reader on both iOS (VoiceOver) and Android (TalkBack).
- Colour contrast ratios must meet the 4.5:1 minimum for body text.

### Deployment
- The application must be deployed to a publicly accessible URL (not localhost) prior to any user acceptance testing.
- The deployment environment must support HTTPS.

---

## 4. Edge Cases and Failure Modes

| Scenario | Expected System Behaviour |
|---|---|
| Blurry or dark photo | System detects low image quality and prompts the user to retake with a specific tip (e.g., "Try better lighting or move closer"). |
| Empty or near-empty fridge | System returns a result with zero or few ingredients and surfaces a message: "We found very little — try adding items manually or upload a clearer photo." |
| Non-food items in view | Cleaning products, tupperware, and unlabelled containers are excluded from the ingredient list. The user is not shown these items unless they manually add them. |
| Only condiments detected | System recognises the ingredient set is insufficient for a full recipe and suggests simple combinations (e.g., sauces, dressings) while prompting the user to add staples manually. |
| Very large ingredient set (20+ items) | Recipe results are ranked by ingredient match coverage. The highest-coverage recipes appear first. Filters become more important and are prominently surfaced. |
| Very small ingredient set (1–2 items) | System shows whatever partial matches exist, clearly labels them as "partial match," and suggests a short list of commonly available items the user could add. |
| Network timeout during analysis | After 15 seconds, the system shows a friendly error: "Something took too long. Please check your connection and try again." The uploaded image is preserved locally so the user does not need to recapture. |
| AI API failure or error response | System falls back to a manual ingredient entry flow and notifies the user: "Our ingredient scanner is temporarily unavailable. You can type your ingredients instead." |

---

## 5. Acceptance Criteria (MVP)

| # | Criterion | Pass / Fail Definition |
|---|---|---|
| AC-01 | Camera access on mobile | PASS: App opens the device camera natively on iOS Safari and Android Chrome without requiring an app install. FAIL: Camera does not launch or requires redirection. |
| AC-02 | File upload fallback | PASS: User can select a JPEG, PNG, or HEIC file from their device and proceed to analysis. FAIL: Upload fails or unsupported formats are not handled gracefully. |
| AC-03 | Ingredient detection accuracy | PASS: In a test set of 20 fridge photos, at least 85% of clearly visible ingredients are correctly identified. FAIL: Accuracy falls below 85%. |
| AC-04 | API key not exposed | PASS: Inspection of browser network traffic and page source reveals no AI API key. FAIL: Key is visible anywhere client-side. |
| AC-05 | Analysis completes within SLA | PASS: 95% of analysis requests return results in under 10 seconds on a standard 4G connection. FAIL: Median or P95 latency exceeds threshold. |
| AC-06 | Recipe detail completeness | PASS: Every recipe detail page contains a name, image, cook time, serving size, ingredient list, and numbered instructions. FAIL: Any of these elements is missing. |
| AC-07 | Category filtering works | PASS: Selecting "Vegan" filter returns only recipes tagged Vegan, with no non-vegan results shown. FAIL: Filter returns incorrect or unfiltered results. |
| AC-08 | Low image quality handling | PASS: Submitting a deliberately blurry photo triggers a user-facing quality warning rather than a silent failure. FAIL: App proceeds without warning or returns a generic error. |
| AC-09 | Empty fridge handling | PASS: Submitting a photo of an empty fridge returns a specific, helpful message rather than a blank results page. FAIL: Page is blank, broken, or displays a raw error. |
| AC-10 | WCAG 2.1 AA compliance | PASS: Automated accessibility audit (e.g., Axe) returns zero critical or serious violations on the home, analysis, and recipe detail screens. FAIL: One or more critical violations are present. |
| AC-11 | Public deployment | PASS: App is accessible at a live HTTPS URL from an external network without VPN or localhost access. FAIL: App is only reachable locally. |
| AC-12 | API failure fallback | PASS: When the AI service returns an error, the user is shown a plain-English message and offered manual ingredient entry. FAIL: User sees a raw error or a broken state. |

---

## 6. Open Questions

1. **Vision API Provider** — Which computer vision or multimodal AI provider will be used (e.g., OpenAI GPT-4o, Google Gemini Vision, AWS Rekognition)? This affects latency SLAs, cost per request, and ingredient recognition quality. Who owns this decision?

2. **Recipe Content Source** — Where do recipes come from? Will the AI generate them dynamically, or will they be pulled from a licensed recipe database (e.g., Spoonacular, Edamam)? Dynamic generation is flexible but less predictable; a database is consistent but requires licensing and cost approval.

3. **Image Storage and Privacy Policy** — Will user photos ever be retained (e.g., for model improvement)? If so, what consent mechanism is required, and which privacy regulations apply (GDPR, CCPA, other)?

4. **User Accounts and Personalisation** — Is user authentication in scope for MVP? Without it, there is no history, favourites, or personalisation. With it, the scope grows substantially. What is the decision?

5. **Supported Locales and Languages** — Is the MVP English-only? If non-English markets are in scope, recipe content, units of measurement (metric vs. imperial), and ingredient naming all require localisation planning.

6. **Monetisation Model** — Is this a free product, freemium (e.g., limited scans per month), or subscription-based? This affects how aggressively the MVP must be built and whether a payments integration is needed from day one.

7. **Dietary and Allergen Liability** — What is the company's legal position if a recipe suggestion causes an allergic reaction? Should the app include a disclaimer, and does legal need to review recipe-generation prompts before launch?

8. **Offline or Low-Connectivity Mode** — Is there any expectation of functionality when the user has no internet connection, or is a full network connection a hard requirement?

---

## Verification Steps

The following steps should be run before any MVP release is approved:

**Happy Path**
- A QA engineer uses a real mobile device to snap a well-lit photo of a stocked refrigerator, confirms the ingredient list, and successfully reaches a recipe detail page with all required fields present.

**Edge Cases**
- Submit a photo taken in near-darkness and confirm the quality warning appears.
- Submit a photo of an empty fridge and confirm the appropriate empty-state message appears.
- Submit a photo containing a bottle of cleaning spray and confirm it does not appear in the ingredient list.

**Security Check**
- Open browser developer tools during an analysis session and confirm no API key appears in any network request, response header, or page source.

**Accessibility Audit**
- Run the Axe browser extension on the home screen, analysis results screen, and recipe detail screen. Zero critical or serious violations must be present.

**Rollback Criteria**
- If vision analysis fails for more than 10% of real user sessions within the first 48 hours of launch, the engineering team must be able to switch to the manual ingredient entry fallback within one hour, without a full redeployment.

---

*This PRD is a living document. All open questions must be resolved with stakeholder sign-off before development of any dependent feature begins.*
