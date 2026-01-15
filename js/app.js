document.addEventListener("DOMContentLoaded", async () => {
    // Mobile drawer menu
  const sidebar = document.querySelector(".sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const scrim = document.getElementById("scrim");

  function openMenu() {
    sidebar.classList.add("is-open");
    scrim.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sidebar.classList.remove("is-open");
    scrim.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn?.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  scrim?.addEventListener("click", closeMenu);

  // Close drawer if user taps a recipe in the list (future-proof)
  document.getElementById("recipeList")?.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) closeMenu();
  });

  // Optional: close on Escape (desktop keyboards)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  const recipePath = "data/recipes/garlic-ginger-stir-fry-sauce.json";

  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const descriptionEl = document.getElementById("description");
  const difficultyEl = document.getElementById("difficulty");
  const heroEl = document.getElementById("hero");

  const ingredientsEl = document.getElementById("ingredients");
  const instructionsEl = document.getElementById("instructions");
  const adjustmentsEl = document.getElementById("adjustments");
  const nutritionEl = document.getElementById("nutrition");

  const res = await fetch(recipePath);
  const data = await res.json();

  const version = data.versions.find(v => v.status === "current");

  // Hero
  titleEl.textContent = data.recipeMeta.title;
  subtitleEl.textContent = data.recipeMeta.subtitle;
  descriptionEl.textContent = version.description;
  difficultyEl.textContent = version.difficulty.toUpperCase();

  const heroImage = data.images.find(img => img.id === version.imageRefs[0]?.imageId);
  if (heroImage) {
    heroEl.style.backgroundImage = `url(${heroImage.uri})`;
  }

  // Ingredients
  ingredientsEl.innerHTML = "";
  version.recipe.ingredients.forEach(group => {
    const h = document.createElement("h3");
    h.textContent = group.group;
    ingredientsEl.appendChild(h);

    const ul = document.createElement("ul");
    group.items.forEach(item => {
      const li = document.createElement("li");
      const q = item.quantity.base;
      li.textContent = `${q.value} ${q.unit} ${item.name}`;
      ul.appendChild(li);
    });
    ingredientsEl.appendChild(ul);
  });

  // Instructions
  instructionsEl.innerHTML = "";
  version.recipe.instructions.forEach(group => {
    const h = document.createElement("h3");
    h.textContent = group.group;
    instructionsEl.appendChild(h);

    const ol = document.createElement("ol");
    group.steps.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step.text;
      ol.appendChild(li);
    });
    instructionsEl.appendChild(ol);
  });

  // Adjustments
  adjustmentsEl.innerHTML = "";
  (version.recipe.adjustments || []).forEach(adj => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>After step ${adj.when.stepNumber}:</strong> ${adj.check}`;
    adjustmentsEl.appendChild(div);
  });

  // Nutrition
  const n = version.recipe.nutrition?.scopes?.perServing;
  if (n) {
    nutritionEl.innerHTML = `
      <p><strong>Calories:</strong> ${n.energy_kcal} kcal</p>
      <p><strong>Protein:</strong> ${n.macros_g.protein} g</p>
      <p><strong>Carbs:</strong> ${n.macros_g.carbs} g</p>
      <p><strong>Fat:</strong> ${n.macros_g.fat} g</p>
    `;
  } else {
    nutritionEl.textContent = "No nutrition data available.";
  }
});