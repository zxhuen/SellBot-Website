(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cars = JSON.parse($("#vehicle-data").textContent);
  const money = (price) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

  // Progressive enhancement: content remains readable when JavaScript is unavailable.
  if ("IntersectionObserver" in window && !reducedMotion) {
    document.documentElement.classList.add("js");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    $$("[data-reveal]").forEach((element) => observer.observe(element));
  }

  const menuToggle = $("#menu-toggle");
  const mobileMenu = $("#mobile-menu");
  function closeMenu() { mobileMenu.hidden = true; menuToggle.setAttribute("aria-expanded", "false"); menuToggle.setAttribute("aria-label", "Open navigation"); }
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    mobileMenu.hidden = !open;
  });
  $$("#mobile-menu a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !mobileMenu.hidden) { closeMenu(); menuToggle.focus(); } });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => { if (event.matches) closeMenu(); });

  if ("IntersectionObserver" in window) {
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$(".nav-link").forEach((link) => {
            if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      });
    }, { rootMargin: "-20% 0px -60% 0px" });
    $$("main section[id]").forEach((section) => sections.observe(section));

    const counterObserver = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      $$("[data-counter]").forEach((counter) => {
        const target = Number(counter.dataset.counter);
        if (reducedMotion) return;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / 1100, 1);
          counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      counterObserver.disconnect();
    }, { threshold: 0.4 });
    counterObserver.observe($("[data-counter-group]"));
  }

  $$(".image-frame").forEach((frame) => {
    const image = frame.querySelector("img");
    if (!image.complete) frame.classList.add("is-loading");
    image.addEventListener("load", () => frame.classList.remove("is-loading"));
    image.addEventListener("error", () => { frame.classList.remove("is-loading"); image.classList.add("image-unavailable"); });
  });

  let filter = "All vehicles";
  const cardElements = $$("[data-car]");
  function updateCollection() {
    const order = $("#car-sort").value;
    const sorted = [...cardElements].sort((a, b) => order === "low" ? Number(a.dataset.price) - Number(b.dataset.price) : order === "high" ? Number(b.dataset.price) - Number(a.dataset.price) : cars.findIndex((car) => car.id === a.dataset.car) - cars.findIndex((car) => car.id === b.dataset.car));
    sorted.forEach((card) => { card.hidden = filter !== "All vehicles" && card.dataset.category !== filter; $("#car-grid").append(card); });
    const count = cardElements.filter((card) => !card.hidden).length;
    $("#results").textContent = `Showing ${count} of ${cars.length} sample vehicles`;
  }
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.filter;
    $$("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    updateCollection();
  }));
  $("#car-sort").addEventListener("change", updateCollection);

  const carDialog = $("#car-dialog");
  const inquiryDialog = $("#inquiry-dialog");
  let selectedCar;
  const restoreBodyScroll = () => { if (!carDialog.open && !inquiryDialog.open) document.body.style.overflow = ""; };
  [carDialog, inquiryDialog].forEach((dialog) => {
    dialog.addEventListener("close", restoreBodyScroll);
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  $$("[data-details]").forEach((button) => button.addEventListener("click", () => {
    selectedCar = cars.find((car) => car.id === button.dataset.details);
    if (!selectedCar) return;
    $("#detail-title").textContent = `${selectedCar.year} ${selectedCar.name}`;
    $("#detail-category").textContent = `${selectedCar.type.toUpperCase()} / SAMPLE COLLECTION`;
    $("#detail-label").textContent = selectedCar.label;
    $("#detail-price").textContent = `${money(selectedCar.price)} USD`;
    $("#detail-image").src = `/site/zxhuenGarage/${selectedCar.image}`;
    $("#detail-image").alt = selectedCar.alt;
    $("#detail-specs").replaceChildren();
    [["Power", `${selectedCar.hp} HP`], ["Transmission", "Automatic"], ["Drivetrain", selectedCar.drive], ["Model year", selectedCar.year]].forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt"); term.style.cssText = "color:#94a3b8;font-size:10px;margin-bottom:6px"; term.textContent = label;
      const description = document.createElement("dd"); description.style.cssText = "font-size:13px"; description.textContent = value;
      wrapper.append(term, description); $("#detail-specs").append(wrapper);
    });
    carDialog.showModal(); document.body.style.overflow = "hidden";
  }));
  $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => carDialog.close()));
  $$("[data-close-inquiry]").forEach((button) => button.addEventListener("click", () => inquiryDialog.close()));
  $("#enquire-car").addEventListener("click", () => {
    carDialog.close();
    $("#message").value = `I’m interested in the ${selectedCar.year} ${selectedCar.name}. Please share more information about its condition, history, and availability.`;
    $("#contact").scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" });
    $("#full-name").focus({ preventScroll: true });
  });

  // Explicitly local-only: no fetch, email action, cookies, or persistent storage.
  $("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    $("#inquiry-content").replaceChildren();
    [["Full name", "name"], ["Email address", "email"], ["Phone number", "phone"], ["Message", "message"]].forEach(([label, key]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt"); term.style.cssText = "color:#94a3b8;font-size:10px;margin-bottom:6px"; term.textContent = label;
      const value = document.createElement("dd"); value.style.whiteSpace = "pre-wrap"; value.textContent = String(values.get(key) || "Not provided");
      wrapper.append(term, value); $("#inquiry-content").append(wrapper);
    });
    $("#form-status").textContent = "Inquiry preview created. Nothing has been sent or saved.";
    inquiryDialog.showModal(); document.body.style.overflow = "hidden";
  });
  $$("[data-social]").forEach((button) => button.addEventListener("click", () => {
    const platform = button.dataset.social;
    $("#social-status").textContent = `${platform.charAt(0).toUpperCase() + platform.slice(1)} is a sample profile. Add a real social URL before launch.`;
  }));
})();
