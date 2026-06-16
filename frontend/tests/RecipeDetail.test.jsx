import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecipeDetail from '../src/components/RecipeDetail.jsx';

const sampleRecipe = {
  name: 'Mushroom Risotto',
  cookTime: '35 mins',
  servings: 3,
  categories: ['Vegetarian', 'Gluten-Free'],
  ingredients: [
    { item: 'Arborio rice', quantity: '300', unit: 'g' },
    { item: 'Mushrooms', quantity: '200', unit: 'g' },
    { item: 'Parmesan', quantity: '50', unit: 'g' },
  ],
  steps: [
    'Heat stock in a saucepan.',
    'Sauté mushrooms in butter.',
    'Add rice and toast for 2 minutes.',
    'Gradually add stock, stirring constantly.',
    'Finish with parmesan and season to taste.',
  ],
  imagePrompt: 'Creamy mushroom risotto in a white bowl',
};

const defaultProps = {
  recipe: sampleRecipe,
  onBack: vi.fn(),
};

describe('RecipeDetail', () => {
  it('renders the recipe name', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /mushroom risotto/i })).toBeInTheDocument();
  });

  it('renders cook time', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(screen.getByText(/35 mins/i)).toBeInTheDocument();
  });

  it('renders serving size', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(screen.getByText(/serves 3/i)).toBeInTheDocument();
  });

  it('renders category badges', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
  });

  it('renders all ingredients', () => {
    render(<RecipeDetail {...defaultProps} />);
    // Use getAllByText since ingredient names may also appear in step text
    expect(screen.getAllByText(/arborio rice/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mushrooms/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/parmesan/i).length).toBeGreaterThan(0);
  });

  it('renders numbered step-by-step instructions', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(screen.getByText(/heat stock in a saucepan/i)).toBeInTheDocument();
    expect(screen.getByText(/finish with parmesan/i)).toBeInTheDocument();
  });

  it('renders the placeholder image block with descriptive role', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(
      screen.getByRole('img', { name: /creamy mushroom risotto/i }),
    ).toBeInTheDocument();
  });

  it('renders the LegalDisclaimer — always (AC-08)', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(
      screen.getByRole('complementary', { name: /legal disclaimer/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/AI-generated suggestions/i)).toBeInTheDocument();
    expect(screen.getByText(/not liable/i)).toBeInTheDocument();
  });

  it('renders Back to Results button', () => {
    render(<RecipeDetail {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /back to recipe results/i }),
    ).toBeInTheDocument();
  });

  it('returns null when no recipe is provided', () => {
    const { container } = render(<RecipeDetail recipe={null} onBack={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
