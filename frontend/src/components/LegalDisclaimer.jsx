/**
 * LegalDisclaimer — must appear on every RecipeDetail render path.
 * AC-08: Disclaimer is absent on any recipe page → FAIL.
 */
export default function LegalDisclaimer() {
  return (
    <aside className="legal-disclaimer" aria-label="Legal disclaimer">
      <p>
        FridgeSnap recipes are AI-generated suggestions. Always verify ingredients
        for allergens and dietary suitability. FridgeSnap is not liable for adverse
        reactions arising from the use of these recipes.
      </p>
    </aside>
  );
}
