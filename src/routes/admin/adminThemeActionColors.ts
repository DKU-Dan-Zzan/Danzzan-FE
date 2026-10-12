import type { CSSProperties } from "react";
import { BUNDLED_THEME_STRONG, DESIGN_SYSTEM_BLACK, DESIGN_SYSTEM_DARK_TEXT, DESIGN_SYSTEM_WHITE } from "@/lib/app/festival/themeFallbackColors";

const DEFAULT_STRONG = BUNDLED_THEME_STRONG; // Mirrors the bundled Theme Core when CSS has not loaded yet.
const DARK_TEXT = DESIGN_SYSTEM_DARK_TEXT;
const WHITE = DESIGN_SYSTEM_WHITE;

type Rgb = [number, number, number];

function parseHex(value: string): Rgb | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return null;
  return [1, 3, 5].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)) as Rgb;
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((part) => Math.round(part).toString(16).padStart(2, "0")).join("")}`;
}

function mix(first: Rgb, second: Rgb, secondWeight: number): Rgb {
  return first.map((part, index) => part * (1 - secondWeight) + second[index] * secondWeight) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [red, green, blue] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(parseHex(first) ?? parseHex(DEFAULT_STRONG)!);
  const b = luminance(parseHex(second) ?? parseHex(WHITE)!);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function darkenUntil(base: Rgb, minContrast: number): string {
  for (let step = 0; step <= 100; step += 2) {
    const candidate = toHex(mix(base, [0, 0, 0], step / 100));
    if (contrastRatio(candidate, WHITE) >= minContrast) return candidate;
  }
  return DESIGN_SYSTEM_BLACK;
}

/** Page-scoped action colors; draft preview variables never feed this function. */
export function createAdminThemeActionStyle(strong: string): CSSProperties {
  const base = parseHex(strong) ?? parseHex(DEFAULT_STRONG)!;
  const primary = darkenUntil(base, 3);
  const outline = darkenUntil(base, 4.5);
  const primaryText = contrastRatio(primary, WHITE) >= 4.5 ? WHITE
    : contrastRatio(primary, DARK_TEXT) >= 4.5 ? DARK_TEXT : DESIGN_SYSTEM_BLACK;
  const hover = toHex(mix(base, [255, 255, 255], 0.91));
  return {
    "--admin-theme-action-bg": primary,
    "--admin-theme-action-fg": primaryText,
    "--admin-theme-action-outline": outline,
    "--admin-theme-action-hover": hover,
    "--admin-theme-action-focus": outline,
  } as CSSProperties;
}

export function readActiveThemeStrong(root = document.documentElement): string {
  const value = getComputedStyle(root).getPropertyValue("--theme-brand-strong").trim();
  return parseHex(value) ? value : DEFAULT_STRONG;
}
