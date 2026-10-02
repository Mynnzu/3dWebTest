export const OPTIONS = {
  dial: {
    label: "DIAL FINISH",
    values: {
      ink: ["Obsidian", "#202626"],
      blue: ["Midnight", "#233d53"],
      silver: ["Silver", "#c4c6bd"],
      emerald: ["Emerald", "#294738"],
    },
  },
  hardware: {
    label: "HARDWARE & BRIDGES",
    values: {
      steel: ["Steel", "#c4c8c4"],
      gold: ["Champagne", "#c5a365"],
      rose: ["Rose gold", "#ba8770"],
      graphite: ["Graphite", "#4e5552"],
    },
  },
  strap: {
    label: "BRACELET FINISH",
    values: {
      steel: ["Brushed steel", "#bec4bf"],
      dark: ["Dark steel", "#515952"],
      cognac: ["Bronze", "#97704b"],
    },
  },
};
export const PRESETS = {
  monochrome: { dial: "ink", hardware: "steel", strap: "steel" },
  royal: { dial: "blue", hardware: "gold", strap: "steel" },
  heritage: { dial: "silver", hardware: "rose", strap: "cognac" },
  phantom: { dial: "emerald", hardware: "graphite", strap: "dark" },
};
export class ConfiguratorManager {
  constructor(watch, onChange) {
    this.watch = watch;
    this.onChange = onChange;
    this.state = { ...PRESETS.monochrome };
    try {
      const saved = JSON.parse(localStorage.getItem("aether-composition"));
      if (saved)
        Object.keys(OPTIONS).forEach((key) => {
          if (OPTIONS[key].values[saved[key]]) this.state[key] = saved[key];
        });
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    const container = document.getElementById("config-groups");
    Object.entries(OPTIONS).forEach(([category, group]) => {
      const element = document.createElement("div");
      element.className = "config-group";
      element.innerHTML = `<p class="group-label" id="label-${category}"><span>${group.label}</span><span id="value-${category}"></span></p><div class="swatch-row" data-category="${category}" role="group" aria-labelledby="label-${category}"></div>`;
      Object.entries(group.values).forEach(([value, [name, color]]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "swatch-btn";
        button.dataset.val = value;
        button.title = name;
        button.setAttribute(
          "aria-label",
          `${group.label.toLowerCase()}: ${name}`,
        );
        button.innerHTML = `<span class="swatch-dot" style="--swatch:${color}"></span>`;
        button.addEventListener("click", () => {
          this.state[category] = value;
          this.sync();
        });
        element.querySelector(".swatch-row").append(button);
      });
      container.append(element);
    });
    document.querySelectorAll(".preset-card").forEach((button) =>
      button.addEventListener("click", () => {
        this.state = { ...PRESETS[button.dataset.preset] };
        this.sync();
      }),
    );
    document
      .getElementById("btn-save-composition")
      .addEventListener("click", () => this.download());
    this.sync();
  }
  sync() {
    Object.entries(OPTIONS).forEach(([category, group]) => {
      document.getElementById(`value-${category}`).textContent =
        group.values[this.state[category]][0];
      document
        .querySelectorAll(`[data-category="${category}"] .swatch-btn`)
        .forEach((button) => {
          const selected = button.dataset.val === this.state[category];
          button.classList.toggle("is-active", selected);
          button.setAttribute("aria-pressed", String(selected));
        });
    });
    document.querySelectorAll(".preset-card").forEach((button) => {
      const preset = PRESETS[button.dataset.preset];
      const selected = Object.keys(OPTIONS).every(
        (category) => this.state[category] === preset[category],
      );
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    document.getElementById("config-summary-text").textContent = Object.entries(
      OPTIONS,
    )
      .map(([key, group]) => group.values[this.state[key]][0])
      .join(" · ");
    document.getElementById("save-status").textContent = "";
    this.watch?.applyConfiguration(this.state);
    try {
      localStorage.setItem("aether-composition", JSON.stringify(this.state));
    } catch {
      /* Configuration still works without persistence. */
    }
    this.onChange();
  }
  download() {
    const lines = [
      "AETHER — YOUR COMPOSITION",
      "Open Heart / Calibre AE–321",
      "",
      ...Object.entries(OPTIONS).map(
        ([category, group]) =>
          `${group.label}: ${group.values[this.state[category]][0]}`,
      ),
      "",
      "39.7 mm case · 55 hour power reserve · 21,600 vph",
      "",
      "An independent digital watch study.",
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aether-composition.txt";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById("save-status").textContent =
      "Composition downloaded.";
  }
}
