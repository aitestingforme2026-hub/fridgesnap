import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IngredientReview from '../src/components/IngredientReview.jsx';

const sampleIngredients = [
  { name: 'Milk', confidence: 0.95 },
  { name: 'Eggs', confidence: 0.90 },
  { name: 'Cheese', confidence: 0.60, flagged: true },
];

const defaultProps = {
  ingredients: sampleIngredients,
  isOnline: true,
  onFindRecipes: vi.fn(),
};

describe('IngredientReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all detected ingredients', () => {
    render(<IngredientReview {...defaultProps} />);
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    expect(screen.getByText('Cheese')).toBeInTheDocument();
  });

  it('shows a warning badge for flagged ingredients', () => {
    render(<IngredientReview {...defaultProps} />);
    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  it('does not show a warning for non-flagged ingredients', () => {
    render(<IngredientReview {...defaultProps} />);
    const warnings = screen.getAllByText(/low confidence/i);
    // Only Cheese is flagged, so there should be exactly 1 warning
    expect(warnings).toHaveLength(1);
  });

  it('unchecking an ingredient removes it from the selection count', () => {
    render(<IngredientReview {...defaultProps} />);
    // Initially all 3 are checked
    const findBtn = screen.getByRole('button', { name: /find recipes/i });
    expect(findBtn).toHaveTextContent('3 ingredients');

    // Uncheck Milk
    const milkCheckbox = screen.getByRole('checkbox', { name: /milk/i });
    fireEvent.click(milkCheckbox);
    expect(findBtn).toHaveTextContent('2 ingredients');
  });

  it('Find Recipes CTA is disabled when 0 ingredients are checked', () => {
    render(<IngredientReview {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Uncheck all
    checkboxes.forEach((cb) => {
      if (cb.checked) fireEvent.click(cb);
    });
    const findBtn = screen.getByRole('button', { name: /find recipes/i });
    expect(findBtn).toBeDisabled();
  });

  it('Find Recipes CTA is enabled with at least 1 ingredient checked', () => {
    render(<IngredientReview {...defaultProps} />);
    const findBtn = screen.getByRole('button', { name: /find recipes/i });
    expect(findBtn).not.toBeDisabled();
  });

  it('calls onFindRecipes with selected ingredient names on submit', () => {
    const onFindRecipes = vi.fn();
    render(<IngredientReview {...defaultProps} onFindRecipes={onFindRecipes} />);

    // Uncheck Eggs
    const eggsCheckbox = screen.getByRole('checkbox', { name: /eggs/i });
    fireEvent.click(eggsCheckbox);

    fireEvent.click(screen.getByRole('button', { name: /find recipes/i }));
    expect(onFindRecipes).toHaveBeenCalledWith(['Milk', 'Cheese'], null);
  });

  it('allows adding a new ingredient via the text field', () => {
    render(<IngredientReview {...defaultProps} />);
    const input = screen.getByLabelText(/type an ingredient to add/i);
    fireEvent.change(input, { target: { value: 'Spinach' } });
    fireEvent.click(screen.getByRole('button', { name: /add ingredient/i }));
    expect(screen.getByText('Spinach')).toBeInTheDocument();
  });

  it('shows OfflineBanner when isOnline is false', () => {
    render(<IngredientReview {...defaultProps} isOnline={false} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
  });
});

describe('IngredientReview — zero-ingredient result (AC-13)', () => {
  const onFindRecipes = vi.fn();
  const onRetakePhoto = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the exact empty-fridge message when ingredient list is empty', () => {
    render(
      <IngredientReview
        ingredients={[]}
        isOnline={true}
        onFindRecipes={onFindRecipes}
        onRetakePhoto={onRetakePhoto}
      />,
    );
    expect(
      screen.getByText(
        /we found very little — try adding items manually or upload a clearer photo/i,
      ),
    ).toBeInTheDocument();
  });

  it('surfaces the manual text-input field immediately when ingredient list is empty', () => {
    render(
      <IngredientReview
        ingredients={[]}
        isOnline={true}
        onFindRecipes={onFindRecipes}
        onRetakePhoto={onRetakePhoto}
      />,
    );
    // The manual entry input must be visible without any additional action
    expect(screen.getByLabelText(/type an ingredient to add/i)).toBeInTheDocument();
  });

  it('shows Retake Photo button when onRetakePhoto is provided and list is empty', () => {
    render(
      <IngredientReview
        ingredients={[]}
        isOnline={true}
        onFindRecipes={onFindRecipes}
        onRetakePhoto={onRetakePhoto}
      />,
    );
    expect(screen.getByRole('button', { name: /retake photo/i })).toBeInTheDocument();
  });

  it('calls onRetakePhoto when Retake Photo is clicked', () => {
    render(
      <IngredientReview
        ingredients={[]}
        isOnline={true}
        onFindRecipes={onFindRecipes}
        onRetakePhoto={onRetakePhoto}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retake photo/i }));
    expect(onRetakePhoto).toHaveBeenCalledTimes(1);
  });

  it('allows user to add ingredients manually and then find recipes from empty-fridge state', () => {
    render(
      <IngredientReview
        ingredients={[]}
        isOnline={true}
        onFindRecipes={onFindRecipes}
        onRetakePhoto={onRetakePhoto}
      />,
    );
    const input = screen.getByLabelText(/type an ingredient to add/i);
    fireEvent.change(input, { target: { value: 'Tomato' } });
    fireEvent.click(screen.getByRole('button', { name: /add ingredient/i }));
    expect(screen.getByText('Tomato')).toBeInTheDocument();

    // Find Recipes button should now be enabled
    const findBtn = screen.getByRole('button', { name: /find recipes/i });
    expect(findBtn).not.toBeDisabled();
    fireEvent.click(findBtn);
    expect(onFindRecipes).toHaveBeenCalledWith(['Tomato'], null);
  });
});
