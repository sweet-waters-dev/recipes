// STEP 1A scaffold JS
// JSON loading will be added next

document.addEventListener("DOMContentLoaded", () => {
  const ingredientsEl = document.getElementById("ingredients");
  const instructionsEl = document.getElementById("instructions");
  const adjustmentsEl = document.getElementById("adjustments");
  const nutritionEl = document.getElementById("nutrition");

  // Placeholder content so layout feels alive
  ingredientsEl.innerHTML = "<p class='muted'>Ingredients will render here.</p>";
  instructionsEl.innerHTML = "<p class='muted'>Instructions will render here.</p>";
  adjustmentsEl.innerHTML = "<p class='muted'>Adjustments will render here.</p>";
  nutritionEl.innerHTML = "<p class='muted'>Nutrition will render here.</p>";
});