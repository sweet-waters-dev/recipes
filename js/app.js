document.addEventListener("DOMContentLoaded", async () => {
  // ---------------------------
  // Mobile drawer menu
  // ---------------------------
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const scrim = document.getElementById("scrim");

  function openMenu() {
    sidebar.classList.add("is-open");
    scrim.hidden = false;
    menuBtn?.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sidebar.classList.remove("is-open");
    scrim.hidden = true;
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  menuBtn?.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  scrim?.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
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
  // Load a single recipe (for now)
  // ---------------------------
  const recipePath = "data/recipes/garlic-ginger-stir-fry-sauce.json";

  let data;
  try {
    const res = await fetch(recipePath, { cache: "no-store" });
    data = await res.json();
  } catch (err) {
    titleEl.textContent = "Could not load recipe JSON";
    descriptionEl.textContent = String(err);
    return;
  }

  const version = data.versions.find(v => v.status === "current") || data.versions[0];

  // ---------------------------
  // Title / subtitle / description
  // ---------------------------
  titleEl.textContent = data.recipeMeta?.title || "Untitled";
  subtitleEl.textContent = data.recipeMeta?.subtitle || "";
  descriptionEl.textContent = version?.description || "";

  // ---------------------------
  // Tags (replace difficulty)
  // ---------------------------
  const tags = Array.isArray(data.recipeMeta?.tags) ? data.recipeMeta.tags : [];
  tagsRowEl.innerHTML = "";
  tags.forEach(t => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = t;
    tagsRowEl.appendChild(span);
  });

  // ---------------------------
  // Gallery (version-specific imageRefs)
  // ---------------------------
  const allImages = Array.isArray(data.images) ? data.images : [];
  const refs = Array.isArray(version?.imageRefs) ? version.imageRefs : [];

  const versionImages = refs
    .map(r => allImages.find(img => img.id === r.imageId))
    .filter(Boolean);

  function buildGallery(container, images) {
    if (!container) return;

    if (!images.length) {
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
      imgEl.alt = img.alt || data.recipeMeta?.title || "Recipe photo";
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

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

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
      if (dx > 0) prev();
      else next();
      startX = null;
    }, { passive: true });

    render();
  }

  buildGallery(galleryDesktopEl, versionImages);
  buildGallery(galleryMobileEl, versionImages);

  // ---------------------------
  // Ingredients (grouped)
  // ---------------------------
  ingredientsEl.innerHTML = "";
  (version?.recipe?.ingredients || []).forEach(group => {
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

  // ---------------------------
  // Instructions (grouped)
  // ---------------------------
  instructionsEl.innerHTML = "";
  (version?.recipe?.instructions || []).forEach(group => {
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

  // ---------------------------
  // Adjustments
  // ---------------------------
  adjustmentsEl.innerHTML = "";
  const adjustments = version?.recipe?.adjustments || [];
  if (!adjustments.length) {
    adjustmentsEl.innerHTML = `<div class="small-muted">No adjustments listed.</div>`;
  } else {
    adjustments.forEach(adj => {
      const wrap = document.createElement("div");
      wrap.className = "adjustment";
      const stepNum = adj?.when?.stepNumber ?? "—";
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

  // ---------------------------
  // Nutrition (simple perServing)
  // ---------------------------
  const n = version?.recipe?.nutrition?.scopes?.perServing;
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
});