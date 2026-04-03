# Design System Specification: Editorial Etherealism

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system moves away from the rigid, utility-first structures of standard web apps and toward a high-end editorial experience. Inspired by the soft, expansive whitespace of the Toss Impact site, the system prioritizes "breathing room" over density. The spacing scale has been refined to a value of `2` to balance spaciousness with a slightly more compact, yet still airy, presentation.

We achieve a premium feel through **intentional asymmetry** and **tonal layering**. Instead of containing information in boxes, we allow content to float on vast, airy backgrounds (`background: #f8fafb`), using the low-saturation peach, coral, and muted sky blue tones to guide the eye. This is a system where the "silence" of the whitespace is as important as the content itself.

---

## 2. Color & Tonal Architecture

Our palette is refined and muted, trading high-vibrancy for sophisticated, desaturated depth. The primary accent color is a muted sky blue (`#8FA9BE`), while secondary elements utilize an earthy, desaturated orange (`#F5B070`). Tertiary accents add a touch of warm, desaturated coral (`#F28C82`), all anchored by a soft off-white neutral base (`#F7F9FA`).

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning or container definition. Boundaries must be established through:
- **Tonal Shifts:** Transitions between `surface` and `surface-container-low` (#f0f4f6).
- **Negative Space:** Using the Spacing Scale to create massive gaps that imply separation without physical lines.

### Surface Hierarchy & Nesting
Think of the UI as layers of fine, semi-transparent paper.
- **Base:** `surface` (#f8fafb).
- **Secondary Content:** `surface-container-low` (#f0f4f6).
- **Elevated Interactive Elements:** `surface-container-lowest` (#ffffff) to provide a soft, natural "pop."

### Signature Textures & Glassmorphism
To capture the "Luminous Gradient" soul, use **Glassmorphism** for floating headers or navigation rails:
- **Background:** `surface` at 70% opacity.
- **Backdrop-blur:** 20px to 40px.
- **Gradient CTAs:** Use a linear gradient from `primary` (`#8FA9BE`) to `primary-container` (#cbe6fc) at a 135-degree angle to give buttons a "luminous" internal glow.

---

## 3. Typography

The typography strategy leverages high-contrast scales to establish an authoritative, editorial voice.

* **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for hero moments. This creates a bold, "poster-like" aesthetic.
* **Body & Titles (Plus Jakarta Sans):** Chosen for its exceptional legibility and modern warmth.
* **The Hierarchy Goal:** Use extreme size differentials. A `display-md` headline paired with a `body-sm` caption creates a sophisticated, boutique-agency look that feels more "designed" than "templated."

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than traditional structural shadows.

* **The Layering Principle:** To highlight a card, do not add a border. Instead, place a `surface-container-lowest` card atop a `surface-container` background. The subtle shift in hex value creates a "soft lift."
* **Ambient Shadows:** If a floating element (like a modal) is required, use the "Ambient Light" approach:
* `box-shadow: 0 20px 50px rgba(44, 52, 54, 0.06);` (Using a tinted version of `on-surface`).
* **The Ghost Border:** For high-density data fields where containment is mandatory, use `outline-variant` (#acb3b6) at **15% opacity**. It should be felt, not seen.
* **Glass Depth:** Use semi-transparent `tertiary-container` (#fab79a) with a blur for informational alerts to let the peach/coral background tones bleed through, maintaining the "airy" feel.

---

## 5. Components

### Buttons
* **Primary:** Gradient fill (`primary` to `primary-container`), white text (`on-primary`), `md` (0.75rem) rounded corners.
* **Secondary:** Ghost style. No background, `label-md` typography, using `primary` color for text. Underline on hover only.

### Cards & Lists
* **Card Aesthetic:** Forbid dividers. Use `xl` (1.5rem) rounded corners. Content within cards should be padded aggressively (minimum 32px).
* **List Items:** Separate items with a 4px vertical gap and a subtle background change on hover (`surface-container-high`) rather than a horizontal line.

### Input Fields
* **State:** Soft `surface-container-lowest` background.
* **Focus State:** Instead of a thick border, use a 2px "Ghost Border" of `primary` at 40% opacity and a soft outer glow.

### Chips
* **Aesthetic:** `full` (9999px) roundedness. Use `secondary-container` (#fcd6af) with `on-secondary-container` text for a muted, orange "Selected" state that feels fresh and airy.

---

## 6. Do's and Don'ts

### Do
* **DO** use "Over-scaled" whitespace, but within the refined `spacing` scale of `2`.
* **DO** use the `primary` (`#8FA9BE`) and its containers for "calm" UI moments—this is your muted sky blue.
* **DO** align text asymmetrically in hero sections to break the "standard" center-aligned web grid.

### Don't
* **DON'T** use pure black (#000000). Always use `on-surface` (#2c3436) for text to maintain the low-saturation elegance.
* **DON'T** use 1px solid borders to separate sections.
* **DON'T** use high-saturation blues. Stick to the desaturated `primary` tokens.
* **DON'T** use standard "drop shadows" with 20% or higher opacity. It breaks the "ethereal" illusion.
