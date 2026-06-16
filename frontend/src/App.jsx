import { useState } from 'react';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import { useUnitPreference } from './hooks/useUnitPreference.js';
import { analyzeImage, fetchRecipes } from './api/client.js';

import HomeScreen from './components/HomeScreen.jsx';
import CameraCapture from './components/CameraCapture.jsx';
import ImagePreview from './components/ImagePreview.jsx';
import LoadingState from './components/LoadingState.jsx';
import IngredientReview from './components/IngredientReview.jsx';
import RecipeResults from './components/RecipeResults.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';

/**
 * Screen flow:
 *  home → capture → preview → analyzing → ingredients → loading-recipes → recipes → detail
 */
const SCREENS = {
  HOME: 'home',
  CAPTURE: 'capture',
  PREVIEW: 'preview',
  ANALYZING: 'analyzing',
  INGREDIENTS: 'ingredients',
  LOADING_RECIPES: 'loading-recipes',
  RECIPES: 'recipes',
  DETAIL: 'detail',
};

export default function App() {
  const isOnline = useOnlineStatus();
  const [unit, setUnit] = useUnitPreference();
  const [screen, setScreen] = useState(SCREENS.HOME);

  // State carried through the flow
  const [imageFile, setImageFile] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [recipesError, setRecipesError] = useState(null);
  const [manualIngredientEntry, setManualIngredientEntry] = useState(false);
  const [offlineError, setOfflineError] = useState(null);

  // ------ Handlers ------

  const goHome = () => {
    setScreen(SCREENS.HOME);
    setImageFile(null);
    setIngredients([]);
    setRecipes([]);
    setSelectedRecipe(null);
    setAnalyzeError(null);
    setRecipesError(null);
    setManualIngredientEntry(false);
    setOfflineError(null);
  };

  const handleImageSelected = (file) => {
    setImageFile(file);
    setScreen(SCREENS.PREVIEW);
  };

  const handleConfirmImage = async () => {
    if (!isOnline) {
      setOfflineError('You appear to be offline. Please check your connection and try again.');
      return;
    }
    setOfflineError(null);
    setAnalyzeError(null);
    setScreen(SCREENS.ANALYZING);

    try {
      const data = await analyzeImage(imageFile);
      setIngredients(data.ingredients || []);
      setScreen(SCREENS.INGREDIENTS);
    } catch (err) {
      if (err.message === 'SERVICE_UNAVAILABLE') {
        setAnalyzeError(
          'Our ingredient scanner is temporarily unavailable. You can type your ingredients instead.',
        );
      } else {
        setAnalyzeError(
          'Something went wrong while analysing your photo. Please try again.',
        );
      }
      setManualIngredientEntry(true);
      setIngredients([]);
      setScreen(SCREENS.INGREDIENTS);
    }
  };

  const handleFindRecipes = async (selectedIngredients) => {
    if (!isOnline) {
      setOfflineError('You appear to be offline. Please check your connection and try again.');
      return;
    }
    setOfflineError(null);
    setRecipesError(null);
    setScreen(SCREENS.LOADING_RECIPES);

    try {
      const data = await fetchRecipes(selectedIngredients, unit);
      setRecipes(data.recipes || []);
      setScreen(SCREENS.RECIPES);
    } catch (err) {
      if (err.message === 'SERVICE_UNAVAILABLE') {
        setRecipesError("We couldn't generate recipes right now. Please try again.");
      } else {
        setRecipesError('Something went wrong generating recipes. Please try again.');
      }
      setScreen(SCREENS.RECIPES);
    }
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setScreen(SCREENS.DETAIL);
  };

  // ------ Render ------

  return (
    <div className="app">
      {screen === SCREENS.HOME && (
        <HomeScreen
          isOnline={isOnline}
          unit={unit}
          onUnitChange={setUnit}
          onStart={() => setScreen(SCREENS.CAPTURE)}
        />
      )}

      {screen === SCREENS.CAPTURE && (
        <CameraCapture
          onImageSelected={handleImageSelected}
          onBack={() => setScreen(SCREENS.HOME)}
        />
      )}

      {screen === SCREENS.PREVIEW && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {offlineError && (
            <div style={{ padding: '1rem 1rem 0' }}>
              <OfflineBanner message={offlineError} />
            </div>
          )}
          <ImagePreview
            imageFile={imageFile}
            onRetake={() => setScreen(SCREENS.CAPTURE)}
            onConfirm={handleConfirmImage}
          />
        </div>
      )}

      {screen === SCREENS.ANALYZING && (
        <LoadingState message="Finding your ingredients…" />
      )}

      {screen === SCREENS.INGREDIENTS && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {analyzeError && (
            <div style={{ padding: '1rem 1rem 0' }}>
              <div className="error-box" role="alert">
                {analyzeError}
              </div>
            </div>
          )}
          {offlineError && (
            <div style={{ padding: '1rem 1rem 0' }}>
              <OfflineBanner message={offlineError} />
            </div>
          )}
          {!isOnline && !offlineError && (
            <div style={{ padding: '1rem 1rem 0' }}>
              <OfflineBanner />
            </div>
          )}
          <IngredientReview
            ingredients={ingredients}
            isOnline={isOnline}
            onFindRecipes={handleFindRecipes}
            onRetakePhoto={() => setScreen(SCREENS.CAPTURE)}
          />
        </div>
      )}

      {screen === SCREENS.LOADING_RECIPES && (
        <LoadingState message="Generating your recipes…" />
      )}

      {screen === SCREENS.RECIPES && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {recipesError && (
            <div style={{ padding: '1rem 1rem 0' }}>
              <div className="error-box" role="alert" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span>{recipesError}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setRecipesError(null); setScreen(SCREENS.INGREDIENTS); }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          <RecipeResults
            recipes={recipes}
            isOnline={isOnline}
            onSelectRecipe={handleSelectRecipe}
            onBack={goHome}
            onBackToIngredients={() => setScreen(SCREENS.INGREDIENTS)}
          />
        </div>
      )}

      {screen === SCREENS.DETAIL && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => setScreen(SCREENS.RECIPES)}
        />
      )}
    </div>
  );
}
