import { useState } from 'react';

/** Deterministic fallback colour from recipe name */
function placeholderColor(name = '') {
  const colours = [
    '#2d6a4f', '#1b4332', '#40916c', '#52b788',
    '#1d3557', '#457b9d', '#e63946', '#c77dff',
    '#f77f00', '#588157',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return colours[Math.abs(hash) % colours.length];
}

function buildImageUrl(prompt) {
  const encoded = encodeURIComponent(`${prompt}, food photography, appetizing, high quality`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=600&height=338&nologo=true&seed=42`;
}

/**
 * V1_RecipeImage — shows an AI-generated food image via Pollinations.ai.
 * Falls back to the coloured placeholder if the image fails to load.
 */
export default function V1_RecipeImage({ imagePrompt, recipeName, style = {} }) {
  const [failed, setFailed] = useState(false);
  const bgColor = placeholderColor(recipeName);

  if (!imagePrompt || failed) {
    return (
      <div
        className="recipe-placeholder-img"
        style={{ background: bgColor, ...style }}
        role="img"
        aria-label={imagePrompt || `Photo of ${recipeName}`}
      >
        <span>{imagePrompt || recipeName}</span>
      </div>
    );
  }

  return (
    <img
      src={buildImageUrl(imagePrompt)}
      alt={imagePrompt || recipeName}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        objectFit: 'cover',
        display: 'block',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        background: bgColor,
        ...style,
      }}
    />
  );
}
