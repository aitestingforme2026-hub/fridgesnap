import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecipeResults from '../src/components/RecipeResults.jsx';

const sampleRecipes = [
  {
    name: 'Veggie Omelette',
    cookTime: '15 mins',
    servings: 2,
    categories: ['Vegetarian', 'Quick & Easy'],
    ingredients: [{ item: 'Eggs', quantity: '3', unit: '' }],
    steps: ['Beat eggs', 'Cook in pan'],
    imagePrompt: 'A golden veggie omelette',
  },
  {
    name: 'Beef Stir Fry',
    cookTime: '20 mins',
    servings: 4,
    categories: ['Meat'],
    ingredients: [{ item: 'Beef', quantity: '200', unit: 'g' }],
    steps: ['Slice beef', 'Stir fry'],
    imagePrompt: 'Sizzling beef stir fry',
  },
  {
    name: 'Lentil Soup',
    cookTime: '40 mins',
    servings: 4,
    categories: ['Vegan', 'Gluten-Free'],
    ingredients: [{ item: 'Lentils', quantity: '200', unit: 'g' }],
    steps: ['Boil lentils', 'Season'],
    imagePrompt: 'Hearty lentil soup',
  },
];

const defaultProps = {
  recipes: sampleRecipes,
  isOnline: true,
  onSelectRecipe: vi.fn(),
  onBack: vi.fn(),
};

describe('RecipeResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all recipe cards', () => {
    render(<RecipeResults {...defaultProps} />);
    expect(screen.getByText('Veggie Omelette')).toBeInTheDocument();
    expect(screen.getByText('Beef Stir Fry')).toBeInTheDocument();
    expect(screen.getByText('Lentil Soup')).toBeInTheDocument();
  });

  it('renders the filter bar', () => {
    render(<RecipeResults {...defaultProps} />);
    expect(screen.getByRole('navigation', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vegan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /meat/i })).toBeInTheDocument();
  });

  it('filters recipes by single category', () => {
    render(<RecipeResults {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^vegan$/i }));
    expect(screen.getByText('Lentil Soup')).toBeInTheDocument();
    expect(screen.queryByText('Beef Stir Fry')).not.toBeInTheDocument();
    expect(screen.queryByText('Veggie Omelette')).not.toBeInTheDocument();
  });

  it('applies multiple filters (AND logic)', () => {
    render(<RecipeResults {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^vegan$/i }));
    fireEvent.click(screen.getByRole('button', { name: /gluten-free/i }));
    expect(screen.getByText('Lentil Soup')).toBeInTheDocument();
    expect(screen.queryByText('Beef Stir Fry')).not.toBeInTheDocument();
    expect(screen.queryByText('Veggie Omelette')).not.toBeInTheDocument();
  });

  it('shows empty state message when no recipes match filters', () => {
    render(<RecipeResults {...defaultProps} />);
    // Select Dairy — none of the recipes have Dairy
    fireEvent.click(screen.getByRole('button', { name: /^dairy$/i }));
    expect(
      screen.getByText(/no recipes match your filters/i),
    ).toBeInTheDocument();
  });

  it('toggling active filter off restores results', () => {
    render(<RecipeResults {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^vegan$/i }));
    expect(screen.queryByText('Beef Stir Fry')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^vegan$/i }));
    expect(screen.getByText('Beef Stir Fry')).toBeInTheDocument();
  });

  it('calls onSelectRecipe when View Recipe is clicked', () => {
    const onSelectRecipe = vi.fn();
    render(<RecipeResults {...defaultProps} onSelectRecipe={onSelectRecipe} />);
    const viewButtons = screen.getAllByRole('button', { name: /view recipe/i });
    fireEvent.click(viewButtons[0]);
    expect(onSelectRecipe).toHaveBeenCalledWith(sampleRecipes[0]);
  });

  it('displays cookTime with "min" label when cookTime is a number (AC-07)', () => {
    const recipesWithNumericCookTime = [
      {
        ...sampleRecipes[0],
        name: 'Quick Omelette',
        cookTime: 15, // bare integer from API
      },
    ];
    render(<RecipeResults {...defaultProps} recipes={recipesWithNumericCookTime} />);
    expect(screen.getByText(/15 min/i)).toBeInTheDocument();
  });

  it('does not double-label cookTime when it is already a string with units', () => {
    render(<RecipeResults {...defaultProps} />);
    // sampleRecipes[0] has cookTime '15 mins' — should render as-is, not '15 mins min'
    // The emoji and text are siblings in the same span, so use a regex that matches the text portion
    expect(screen.getByText(/^⏱ 15 mins$/)).toBeInTheDocument();
    expect(screen.queryByText(/15 mins min/i)).not.toBeInTheDocument();
  });
});

describe('RecipeResults — zero-recipe states (AC-13)', () => {
  const onBack = vi.fn();
  const onBackToIngredients = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "couldn\'t find recipes" message when API returns 0 recipes and no filters active', () => {
    render(
      <RecipeResults
        recipes={[]}
        isOnline={true}
        onSelectRecipe={vi.fn()}
        onBack={onBack}
        onBackToIngredients={onBackToIngredients}
      />,
    );
    expect(
      screen.getByText(/we couldn't find recipes for these ingredients/i),
    ).toBeInTheDocument();
  });

  it('shows "Back to Ingredients" button when API returns 0 recipes', () => {
    render(
      <RecipeResults
        recipes={[]}
        isOnline={true}
        onSelectRecipe={vi.fn()}
        onBack={onBack}
        onBackToIngredients={onBackToIngredients}
      />,
    );
    expect(screen.getByRole('button', { name: /back to ingredients/i })).toBeInTheDocument();
  });

  it('calls onBackToIngredients when "Back to Ingredients" button is clicked', () => {
    render(
      <RecipeResults
        recipes={[]}
        isOnline={true}
        onSelectRecipe={vi.fn()}
        onBack={onBack}
        onBackToIngredients={onBackToIngredients}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /back to ingredients/i }));
    expect(onBackToIngredients).toHaveBeenCalledTimes(1);
  });

  it('does NOT show "couldn\'t find recipes" message when recipes exist but are all filtered out', () => {
    const { sampleRecipes: sr } = { sampleRecipes: [
      {
        name: 'Veggie Omelette',
        cookTime: '15 mins',
        servings: 2,
        categories: ['Vegetarian'],
        ingredients: [],
        steps: [],
        imagePrompt: '',
      },
    ]};
    render(
      <RecipeResults
        recipes={[{
          name: 'Veggie Omelette',
          cookTime: '15 mins',
          servings: 2,
          categories: ['Vegetarian'],
          ingredients: [],
          steps: [],
          imagePrompt: '',
        }]}
        isOnline={true}
        onSelectRecipe={vi.fn()}
        onBack={onBack}
        onBackToIngredients={onBackToIngredients}
      />,
    );
    // Activate a filter that excludes the only recipe (e.g. Meat)
    fireEvent.click(screen.getByRole('button', { name: /^meat$/i }));

    // Should show filter-specific message, NOT the zero-API message
    expect(screen.getByText(/no recipes match your filters/i)).toBeInTheDocument();
    expect(screen.queryByText(/we couldn't find recipes for these ingredients/i)).not.toBeInTheDocument();
  });
});
