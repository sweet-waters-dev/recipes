document.addEventListener("DOMContentLoaded", async () => {
  // ---------------------------
  // Mobile drawer menu
  // ---------------------------
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const scrim = document.getElementById("scrim");

  function openMenu() {
    sidebar?.classList.add("is-open");
    if (scrim) scrim.hidden = false;
    menuBtn?.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sidebar?.classList.remove("is-open");
    if (scrim) scrim.hidden = true;
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  menuBtn?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  scrim?.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Close drawer when a recipe is selected (mobile)
  document.getElementById("recipeList")?.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li) closeMenu();
  });

  // ---------------------------
  // Theme toggle (light/dark)
  // ---------------------------
  const themeToggle = document.getElementById("themeToggle");
  const themeToggleText = document.getElementById("themeToggleText");
  const themeToggleTop = document.getElementById("themeToggleTop");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeToggleText) themeToggleText.textContent = theme === "light" ? "Light" : "Dark";
  }

  const savedTheme = localStorage.getItem("theme");
  applyTheme(savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark");

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  themeToggle?.addEventListener("click", toggleTheme);
  themeToggleTop?.addEventListener("click", toggleTheme);

  // ---------------------------
  // Elements
  // ---------------------------
  const searchInput = document.getElementById("searchInput");
  const recipeListEl = document.getElementById("recipeList");

  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const descriptionEl = document.getElementById("description");
  const tagsRowEl = document.getElementById("tagsRow");

  const galleryDesktopEl = document.getElementById("galleryDesktop");
  const galleryMobileEl = document.getElementById("galleryMobile");

  const ingredientsEl = document.getElementById("ingredients");
  const instructionsEl = document.getElementById("instructions");
  const adjustmentsEl = document.getElementById("adjustments");
  const nutritionEl = document.getElementById("nutrition");

  // ---------------------------
  // Helpers
  // ---------------------------
  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${path}`);
    return await res.json();
  }

  function pickCurrentVersion(recipeJson) {
    const versions = Array.isArray(recipeJson?.versions) ? recipeJson.versions : [];
    return versions.find(v => v.status === "current") || versions[0] || null;
  }

  function safeText(el, text) {
    if (!el) return;
    el.textContent = text ?? "";
  }

  // ---------------------------
  // Gallery builder
  // ---------------------------
  function buildGallery(container, images, recipeTitle) {
    if (!container) return;

    if (!images || !images.length) {
      container.innerHTML = `<div class="small-muted" style="padding:12px;">No images for this version.</div>`;
      return;
    }

    let index = 0;

    container.innerHTML = `
      <div class="gallery__viewport">
        <img class="gallery__img" alt="" />
        <div class="gallery__controls">
          <button class="gallery__btn" type="button" data-action="prev" aria-label="Previous photo">‹</button>
          <div class="gallery__dots" role="tablist" aria-label="Photo selector"></div>
          <button class="gallery__btn" type="button" data-action="next" aria-label="Next photo">›</button>
        </div>
      </div>
    `;

    const imgEl = container.querySelector(".gallery__img");
    const dotsEl = container.querySelector(".gallery__dots");
    const prevBtn = container.querySelector('[data-action="prev"]');
    const nextBtn = container.querySelector('[data-action="next"]');

    function renderDots() {
      dotsEl.innerHTML = "";
      images.forEach((_, i) => {
        const d = document.createElement("button");
        d.type = "button";
        d.className = "dot" + (i === index ? " is-active" : "");
        d.setAttribute("aria-label", `Photo ${i + 1}`);
        d.addEventListener("click", () => {
          index = i;
          render();
        });
        dotsEl.appendChild(d);
      });
    }

    function render() {
      const img = images[index];
      imgEl.src = img.uri;
      imgEl.alt = img.alt || recipeTitle || "Recipe photo";
      renderDots();
    }

    function prev() {
      index = (index - 1 + images.length) % images.length;
      render();
    }

    function next() {
      index = (index + 1) % images.length;
      render();
    }

    prevBtn?.addEventListener("click", prev);
    nextBtn?.addEventListener("click", next);

    // Swipe support (touch)
    let startX = null;
    container.addEventListener("touchstart", (e) => {
      startX = e.touches?.[0]?.clientX ?? null;
    }, { passive: true });

    container.addEventListener("touchend", (e) => {
      const endX = e.changedTouches?.[0]?.clientX ?? null;
      if (startX === null || endX === null) return;
      const dx = endX - startX;
      if (Math.abs(dx) < 40) return;
      dx > 0 ? prev() : next();
      startX = null;
    }, { passive: true });

    render();
  }

  // ---------------------------
  // Render recipe into page
  // ---------------------------
  function renderRecipe(recipeJson) {
    const meta = recipeJson?.recipeMeta || {};
    const version = pickCurrentVersion(recipeJson);
    // Some recipes use the newer template where fields live directly on the version
    // (version.ingredients, version.instructions, etc.). Older files nest these under
    // version.recipe.*. Support both.
    const v = version?.recipe ?? version ?? {};

    safeText(titleEl, meta.title || "Untitled");
    safeText(subtitleEl, meta.subtitle || "");
    safeText(descriptionEl, version?.description || v?.description || "");

    // Tags
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    if (tagsRowEl) {
      tagsRowEl.innerHTML = "";
      tags.forEach(t => {
        const span = document.createElement("span");
        span.className = "chip";
        span.textContent = t;
        tagsRowEl.appendChild(span);
      });
    }

    // Images for version
    const allImages = Array.isArray(recipeJson?.images) ? recipeJson.images : [];
    const refs = Array.isArray(version?.imageRefs) ? version.imageRefs : (Array.isArray(v?.imageRefs) ? v.imageRefs : []);
    const versionImages = refs
      .map(r => allImages.find(img => img.id === r.imageId))
      .filter(Boolean);

    buildGallery(galleryDesktopEl, versionImages, meta.title);
    buildGallery(galleryMobileEl, versionImages, meta.title);

    // Ingredients
    if (ingredientsEl) {
      ingredientsEl.innerHTML = "";
      (v?.ingredients || []).forEach(group => {
        const h = document.createElement("h3");
        h.textContent = group.group || "Ingredients";
        ingredientsEl.appendChild(h);

        const ul = document.createElement("ul");
        (group.items || []).forEach(item => {
          const li = document.createElement("li");
          const base = item?.quantity?.base;
          const qty = base ? `${base.value} ${base.unit}` : "";
          li.textContent = `${qty} ${item.name}`.trim();
          ul.appendChild(li);
        });
        ingredientsEl.appendChild(ul);
      });
    }

    // Instructions
    if (instructionsEl) {
      instructionsEl.innerHTML = "";
      (v?.instructions || []).forEach(group => {
        const h = document.createElement("h3");
        h.textContent = group.group || "Instructions";
        instructionsEl.appendChild(h);

        const ol = document.createElement("ol");
        (group.steps || []).forEach(s => {
          const li = document.createElement("li");
          li.textContent = s.text;
          ol.appendChild(li);
        });
        instructionsEl.appendChild(ol);
      });
    }

    // Adjustments
    if (adjustmentsEl) {
      adjustmentsEl.innerHTML = "";
      const adjustments = v?.adjustments || [];
      if (!adjustments.length) {
        adjustmentsEl.innerHTML = `<div class="small-muted">No adjustments listed.</div>`;
      } else {
        adjustments.forEach(adj => {
          const wrap = document.createElement("div");
          wrap.className = "adjustment";

          // Support both { afterStep } and { stepNumber } naming
          const stepNum =
            adj?.when?.afterStep ??
            adj?.when?.stepNumber ??
            "—";

          const check = adj?.check ?? "";
          wrap.innerHTML = `<strong>After step ${stepNum}:</strong> ${check}`;

          const list = document.createElement("ul");
          (adj.ifNeeded || []).forEach(x => {
            const li = document.createElement("li");
            li.textContent = `${x.condition}: ${x.action}`;
            list.appendChild(li);
          });
          if (list.children.length) wrap.appendChild(list);

          adjustmentsEl.appendChild(wrap);
        });
      }
    }

    // Nutrition (simple perServing)
    if (nutritionEl) {
      // Support both shapes:
      // - v.nutrition.scopes.perServing (older)
      // - v.nutrition.perServing (newer)
      const n = v?.nutrition?.scopes?.perServing ?? v?.nutrition?.perServing;
      if (!n) {
        nutritionEl.innerHTML = `<div class="small-muted">No nutrition data available.</div>`;
      } else {
        const m = n.macros_g || {};
        nutritionEl.innerHTML = `
          <p><strong>Calories:</strong> ${n.energy_kcal ?? "—"} kcal</p>
          <p><strong>Protein:</strong> ${m.protein ?? "—"} g</p>
          <p><strong>Carbs:</strong> ${m.carbs ?? "—"} g</p>
          <p><strong>Fat:</strong> ${m.fat ?? "—"} g</p>
        `;
      }
    }
  }

  // ---------------------------
  // Sidebar: load index and populate list
  // ---------------------------
  let indexData;
  try {
    indexData = await fetchJson("data/recipes/index.json");
  } catch (err) {
    if (recipeListEl) {
      recipeListEl.innerHTML = `<li class="recipe-list__loading">Could not load index.json: ${String(err)}</li>`;
    }
    return;
  }

  const indexRecipes = Array.isArray(indexData?.recipes) ? indexData.recipes : [];
  if (!indexRecipes.length) {
    if (recipeListEl) recipeListEl.innerHTML = `<li class="recipe-list__loading">No recipes found.</li>`;
    return;
  }

  // Load metadata for sidebar display (title/subtitle) without rendering everything yet
  // We’ll fetch each recipe once to grab title; cache results for click.
  const recipeCache = new Map(); // id -> recipeJson

  async function getRecipeById(id) {
    if (recipeCache.has(id)) return recipeCache.get(id);
    const entry = indexRecipes.find(r => r.id === id);
    if (!entry) throw new Error(`Recipe not found in index: ${id}`);
    const recipeJson = await fetchJson(entry.path);
    recipeCache.set(id, recipeJson);
    return recipeJson;
  }

  // Build sidebar list items
  const sidebarItems = [];

  for (const r of indexRecipes) {
    try {
      const recipeJson = await getRecipeById(r.id);
      const title = recipeJson?.recipeMeta?.title || r.id;
      const subtitle = recipeJson?.recipeMeta?.subtitle || "";
      sidebarItems.push({ id: r.id, title, subtitle });
    } catch (e) {
      sidebarItems.push({ id: r.id, title: r.id, subtitle: "Could not load recipe" });
    }
  }

  sidebarItems.sort((a, b) => a.title.localeCompare(b.title));

  function renderSidebarList(filterText = "") {
    if (!recipeListEl) return;
    const q = (filterText || "").trim().toLowerCase();

    const filtered = sidebarItems.filter(item => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });

    recipeListEl.innerHTML = "";

    if (!filtered.length) {
      const li = document.createElement("li");
      li.className = "recipe-list__loading";
      li.textContent = "No matches.";
      recipeListEl.appendChild(li);
      return;
    }

    filtered.forEach(item => {
      const li = document.createElement("li");
      li.setAttribute("data-id", item.id);
      li.style.padding = "10px 10px";
      li.style.borderRadius = "12px";
      li.style.cursor = "pointer";

      li.innerHTML = `
        <div style="font-weight:700;">${item.title}</div>
        ${item.subtitle ? `<div class="small-muted" style="margin-top:2px;">${item.subtitle}</div>` : ""}
      `;

      li.addEventListener("click", async () => {
        // Update URL hash for deep links
        window.location.hash = item.id;

        try {
          const recipeJson = await getRecipeById(item.id);
          renderRecipe(recipeJson);
        } catch (err) {
          safeText(titleEl, "Could not load recipe");
          safeText(descriptionEl, String(err));
        }
      });

      recipeListEl.appendChild(li);
    });
  }

  renderSidebarList("");

  searchInput?.addEventListener("input", (e) => {
    renderSidebarList(e.target.value);
  });

  // ---------------------------
  // Initial load: hash id, or first recipe in list
  // ---------------------------
  async function loadInitial() {
    const hashId = (window.location.hash || "").replace("#", "").trim();
    const initialId = hashId && indexRecipes.some(r => r.id === hashId)
      ? hashId
      : sidebarItems[0].id;

    try {
      const recipeJson = await getRecipeById(initialId);
      renderRecipe(recipeJson);
    } catch (err) {
      safeText(titleEl, "Could not load recipe");
      safeText(descriptionEl, String(err));
    }
  }

  // If user changes hash manually/back button
  window.addEventListener("hashchange", async () => {
    const id = (window.location.hash || "").replace("#", "").trim();
    if (!id) return;
    if (!indexRecipes.some(r => r.id === id)) return;
    try {
      const recipeJson = await getRecipeById(id);
      renderRecipe(recipeJson);
    } catch (err) {
      safeText(titleEl, "Could not load recipe");
      safeText(descriptionEl, String(err));
    }
  });

  await loadInitial();
});