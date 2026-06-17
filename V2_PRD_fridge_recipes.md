# PRD: FridgeSnap — AI-Powered Recipe Suggester

**Version:** 2.0
**Date:** 2026-06-16
**Status:** Approved for Development — All Open Questions Resolved

---

## Resolved Decisions (Previously Open Questions)

| # | Decision | Resolution |
|---|---|---|
| 1 | Vision API Provider | **OpenAI GPT-4o** — used for both image analysis and ingredient extraction |
| 2 | Recipe Content Source | **Dynamically AI-generated recipes** via OpenAI GPT-4o (same provider, single integration) |
| 3 | Image Storage & Privacy | **Ephemeral processing only** — images are discarded immediately after analysis; no retention |
| 4 | User Accounts | **Out of scope for MVP** — no authentication, history, or personalisation in V1 |
| 5 | Language & Units | **English only**; units displayed based on user preference (metric or imperial) |
| 6 | Monetisation | **Free MVP** — no payments integration required |
| 7 | Allergen Liability | **Standard legal disclaimer** displayed on every recipe detail page |
| 8 | Connectivity | **Active internet connection is a hard requirement** — no offline mode |

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

### Persona B — The Budget-Conscious Single Professional

**Name:** Jordan, 27
**Lifestyle:** Lives alone, shops once a week, and tries to avoid food waste. Confident in the kitchen but uninspired.
**Pain Point:** Ingredients go bad before Jordan can use them because meals aren't planned around what's actually available.
**Goal:** Use up ingredients before they expire by getting creative recipe suggestions tailored to exactly what's on hand.

### Primary User Journey

1. **Open App** — User lands on the home screen on their mobile device. A single clear call-to-action reads: "Snap Your Fridge."
2. **Capture or Upload** — User takes a photo of the inside of their fridge using the in-app camera, or uploads an existing photo from their device.
3. **Preview & Confirm** — User sees a preview of the photo and can retake it or proceed.
4. **AI Analysis** — The app submits the image to OpenAI GPT-4o via a server-side proxy. A loading state communicates progress (e.g., "Finding your ingredients...").
5. **Ingredient Review** — The detected ingredients are displayed as a visual checklist. The user can remove false positives or manually add missing items.
6. **Recipe Results** — The app surfaces 3 to 6 AI-generated recipe suggestions. Each card shows the recipe name, estimated cook time, a category tag, and a thumbnail image.
7. **Recipe Detail** — User taps a recipe to see full step-by-step instructions, an ingredient checklist with quantities, cook time, and serving size. A legal disclaimer is displayed at the bottom of this page.
8. **Cook & Complete** — User follows the recipe. Optionally, they rate the suggestion at the end.

---

## 2. Core Feature Requirements

### 2.1 Image Capture and Upload

- The app must access the device camera directly from the browser on mobile, without requiring a native app install.
- Users must be able to switch to a file upload option as a fallback (for desktop users or those who prefer uploading a saved photo).
- After capture or selection, a full-screen preview must be shown with two options: "Retake" and "Use This Photo."
- Accepted image formats: JPEG, PNG, and HEIC. Maximum file size: 10 MB.
- If camera permission is denied, the app must display a plain-English explanation and automatically offer the file upload alternative.
- Images exceeding 3 MB must be compressed client-side before upload to reduce latency on mobile networks.

### 2.2 Vision Analysis Integration (OpenAI GPT-4o)

- The uploaded image is sent to a server-side proxy. The proxy forwards it to the **OpenAI GPT-4o** vision API. The API key is never exposed to the client.
- GPT-4o must return a structured list of identified food ingredients. Non-food items (cleaning products, unlabelled containers, tupperware) must be excluded from results.
- Items identified with low confidence must be flagged for user review rather than automatically included. The confidence threshold is configurable (default: 70%).
- **Images must be discarded immediately after the GPT-4o API call returns.** No image data is stored, logged, or retained on any server.
- The ingredient extraction result must be returned to the user within 10 seconds under standard 4G network conditions.
- An active internet connection is required. If the device is offline, the app must display a clear, plain-English message before the user attempts to upload.

### 2.3 Recipe Generation (OpenAI GPT-4o)

- Recipes are **dynamically generated by OpenAI GPT-4o** based on the confirmed ingredient list. No third-party recipe database is used.
- Each generated recipe must include: recipe name, a representative AI-generated or stock image, total estimated cook time, serving size, a full ingredient list with quantities, and numbered step-by-step instructions.
- Quantities must respect the user's unit preference: **metric** (grams, millilitres, Celsius) or **imperial** (ounces, cups, Fahrenheit). The preference is set on first use and can be changed in settings.
- Recipes must clearly indicate which detected fridge ingredients are used, and which additional items (if any) are required.
- Every recipe detail page must display the following standard legal disclaimer:

  > *FridgeSnap recipes are AI-generated suggestions. Always verify ingredients for allergens and dietary suitability. FridgeSnap is not liable for adverse reactions arising from the use of these recipes.*

- The recipe detail view must be readable and operable with one hand on a mobile device.

### 2.4 Categorisation and Filtering

- Every generated recipe must be tagged with at least one of the following categories: Dairy, Meat, Vegan, Vegetarian, Gluten-Free, Quick and Easy (30 minutes or under).
- The recipe results screen must include a filter bar allowing users to select one or more category tags to narrow results.
- Filters must apply instantly without a full page reload.
- The system must surface at least one "Quick and Easy" recipe whenever the detected ingredient set supports it.

---

## 3. Non-Functional Requirements

### Security
- The **OpenAI API key** must never appear in client-side code, network responses, or browser developer tools. All calls to OpenAI must be routed through a server-side proxy.
- Images are ephemeral: they must be discarded from server memory immediately after the GPT-4o response is received. No image logging, no cloud storage writes.
- No user authentication or session data is stored (user accounts are out of scope for MVP).

### Mobile Responsiveness
- Primary design target: **390 px viewport width** (iPhone 14 Pro equivalent).
- All interactive elements must meet a minimum touch target size of 44 × 44 px.
- The app must be fully functional on current versions of **Safari (iOS)** and **Chrome (Android)**.

### Performance and Latency
- Vision analysis + recipe generation must complete within **15 seconds end-to-end** for 95% of requests on a standard 4G connection.
- Recipe results page must reach a visually complete state within **2 seconds** of ingredient confirmation (excluding AI generation time).
- Images must be compressed client-side before upload if they exceed 3 MB.

### Accessibility
- The application must meet **WCAG 2.1 AA** standards at minimum.
- All images must have descriptive alt text. All form controls must have associated labels.
- The app must be operable using VoiceOver (iOS) and TalkBack (Android).
- Colour contrast ratios must meet the 4.5:1 minimum for body text.

### Connectivity
- An active internet connection is a **hard requirement**. The app has no offline mode.
- If the device goes offline mid-session, a clear error must be surfaced and the user's captured image must be preserved locally so they can retry without recapturing.

### Deployment
- The application must be deployed to a **publicly accessible HTTPS URL** prior to any user acceptance testing.
- The deployment environment must not require VPN or local network access.

### Localisation
- **English only** for MVP.
- Units of measurement (metric / imperial) are user-selectable on first launch and changeable in app settings.

---

## 4. Out of Scope (MVP)

- User accounts, authentication, or personalisation
- Recipe history or favourites
- Push notifications
- Offline or low-connectivity mode
- Non-English language support
- Monetisation, paywalls, or subscription tiers
- Native iOS or Android app (web app only)
- Social sharing features
- Nutritional information or calorie counts

---

## 5. Edge Cases and Failure Modes

| Scenario | Expected System Behaviour |
|---|---|
| Blurry or dark photo | System detects low image quality and prompts the user to retake with a specific tip (e.g., "Try better lighting or move closer"). |
| Empty or near-empty fridge | Returns a message: "We found very little — try adding items manually or upload a clearer photo." Offers manual ingredient entry. |
| Non-food items in view | Cleaning products, tupperware, and unlabelled containers are excluded from the ingredient list automatically. |
| Only condiments detected | System recognises the ingredient set is insufficient for a full recipe, suggests simple combinations, and prompts the user to add staples manually. |
| Very large ingredient set (20+ items) | Recipe results ranked by ingredient match coverage. Highest-coverage recipes appear first. Filters are prominently surfaced. |
| Very small ingredient set (1–2 items) | System shows partial matches, clearly labelled as such, and suggests a short list of commonly available items to add. |
| Device offline at launch | App displays a plain-English offline warning before the user reaches the upload screen. Camera/upload UI is not shown. |
| Network timeout during analysis | After 15 seconds, user sees: "Something took too long. Please check your connection and try again." Captured image is preserved locally. |
| OpenAI API failure or error response | System falls back to manual ingredient entry and notifies the user: "Our ingredient scanner is temporarily unavailable. You can type your ingredients instead." |
| GPT-4o generates a recipe with missing fields | The recipe is rejected server-side and the generation is retried once. If the retry also fails, the recipe is excluded from results and the user sees the remaining valid suggestions. |

---

## 6. Acceptance Criteria (MVP)

| # | Criterion | Pass / Fail Definition |
|---|---|---|
| AC-01 | Camera access on mobile | PASS: App opens the device camera natively on iOS Safari and Android Chrome without requiring an app install. FAIL: Camera does not launch or requires redirection. |
| AC-02 | File upload fallback | PASS: User can select a JPEG, PNG, or HEIC file from their device and proceed to analysis. FAIL: Upload fails or unsupported formats are not handled gracefully. |
| AC-03 | Ingredient detection accuracy | PASS: In a test set of 20 fridge photos, at least 85% of clearly visible ingredients are correctly identified by GPT-4o. FAIL: Accuracy falls below 85%. |
| AC-04 | API key not exposed | PASS: Inspection of browser network traffic and page source reveals no OpenAI API key. FAIL: Key is visible anywhere client-side. |
| AC-05 | Image discarded after analysis | PASS: Server-side logging and storage inspection confirms no image data is retained after the GPT-4o response is received. FAIL: Any image data persists beyond the API call. |
| AC-06 | End-to-end latency SLA | PASS: 95% of full analysis + recipe generation cycles complete in under 15 seconds on a 4G connection. FAIL: P95 latency exceeds threshold. |
| AC-07 | Recipe detail completeness | PASS: Every recipe detail page contains a name, image, cook time, serving size, ingredient list, numbered instructions, and the legal disclaimer. FAIL: Any of these elements is missing. |
| AC-08 | Legal disclaimer present | PASS: The standard allergen/liability disclaimer appears on every recipe detail page. FAIL: Disclaimer is absent on any recipe page. |
| AC-09 | Unit preference respected | PASS: Selecting metric displays all quantities in grams/ml/°C; selecting imperial displays oz/cups/°F. FAIL: Units do not match the selected preference. |
| AC-10 | Category filtering works | PASS: Selecting "Vegan" filter returns only recipes tagged Vegan, with no non-vegan results shown. FAIL: Filter returns incorrect or unfiltered results. |
| AC-11 | Offline state handled | PASS: Launching the app with no internet connection surfaces a plain-English offline message before the upload UI is shown. FAIL: App shows the upload UI or crashes silently. |
| AC-12 | Low image quality handling | PASS: Submitting a deliberately blurry photo triggers a user-facing quality warning rather than a silent failure. FAIL: App proceeds without warning or returns a generic error. |
| AC-13 | Empty fridge handling | PASS: Submitting a photo of an empty fridge returns a specific, helpful message rather than a blank results page. FAIL: Page is blank, broken, or displays a raw error. |
| AC-14 | WCAG 2.1 AA compliance | PASS: Axe audit returns zero critical or serious violations on the home, analysis, and recipe detail screens. FAIL: One or more critical violations are present. |
| AC-15 | Public deployment | PASS: App is accessible at a live HTTPS URL from an external network without VPN or localhost access. FAIL: App is only reachable locally. |
| AC-16 | API failure fallback | PASS: When OpenAI returns an error, the user sees a plain-English message and is offered manual ingredient entry. FAIL: User sees a raw error or a broken state. |

---

## Verification Steps

**Happy Path**
- A QA engineer uses a real mobile device to snap a well-lit photo of a stocked refrigerator, confirms the ingredient list, and successfully reaches a recipe detail page with all required fields and the legal disclaimer present. Units match the selected preference.

**Edge Cases**
- Submit a photo taken in near-darkness → quality warning appears.
- Submit a photo of an empty fridge → appropriate empty-state message appears.
- Submit a photo containing a bottle of cleaning spray → it does not appear in the ingredient list.
- Switch device to aeroplane mode before launching → offline warning appears before the upload screen.

**Privacy Check**
- After a completed analysis session, inspect server logs and storage to confirm no image data has been retained.

**Security Check**
- Open browser developer tools during an analysis session and confirm no OpenAI API key appears in any network request, response header, or page source.

**Accessibility Audit**
- Run the Axe browser extension on the home, analysis results, and recipe detail screens. Zero critical or serious violations must be present.

**Rollback Criteria**
- If OpenAI API failures exceed 10% of real user sessions within the first 48 hours of launch, the engineering team must be able to activate the manual ingredient entry fallback within one hour, without a full redeployment.

---

*This PRD is approved for development. No open questions remain. Any future scope changes require a V3 revision with stakeholder sign-off.*
