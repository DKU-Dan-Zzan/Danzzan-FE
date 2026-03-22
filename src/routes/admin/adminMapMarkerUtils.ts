import {
  getBoothmapColor,
  getBoothmapLabelAccent,
  getBoothmapMarkerColor,
  parseBoothmapMarkerType,
} from "@/utils/app/boothmap/boothmapTheme";
import type { KakaoGlobal } from "@/types/app/boothmap/kakao-map";

const createCollegeMarkerSvg = (selected: boolean) => {
  const stroke = selected
    ? getBoothmapColor("collegeStrokeSelected")
    : getBoothmapColor("collegeStrokeDefault");
  const fill = selected
    ? getBoothmapColor("collegeFillSelected")
    : getBoothmapColor("collegeFillDefault");

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 50C22 50 38 33.8 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 33.8 22 50 22 50Z"
        fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <path d="M14 20.5L22 15L30 20.5V29.5H14V20.5Z" fill="${stroke}"/>
      <rect x="19.5" y="21.5" width="5" height="8" rx="1" fill="white"/>
    </svg>
  `)}`;
};

const getBoothColor = (type?: string) => {
  return getBoothmapMarkerColor(parseBoothmapMarkerType(type));
};

const createBoothMarkerSvg = (type: string | undefined, selected: boolean) => {
  const mainColor = getBoothColor(type);
  const stroke = selected ? getBoothmapColor("overlayBadgeBackground") : mainColor;
  const fill = selected ? getBoothmapColor("overlayBadgeText") : mainColor;
  const inner = selected ? mainColor : getBoothmapColor("overlayBadgeText");

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 50C22 50 38 33.8 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 33.8 22 50 22 50Z"
        fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="21" cy="21" r="7" fill="${inner}" />
    </svg>
  `)}`;
};

export const createMarkerImage = (
  kakao: KakaoGlobal,
  options: {
    kind: "booth" | "college";
    boothType?: string;
    selected: boolean;
  },
) => {
  const width = options.selected ? 44 : 36;
  const height = options.selected ? 52 : 44;

  const size = new kakao.maps.Size(width, height);
  const offset = new kakao.maps.Point(width / 2, height);

  const src =
    options.kind === "college"
      ? createCollegeMarkerSvg(options.selected)
      : createBoothMarkerSvg(options.boothType, options.selected);

  return new kakao.maps.MarkerImage(src, size, { offset });
};

export const createLabelContent = (options: {
  name: string;
  kind: "booth" | "college";
  selected: boolean;
  dimmed: boolean;
}) => {
  const accent = getBoothmapLabelAccent(options.kind);
  const background = options.selected ? accent : getBoothmapColor("overlayBadgeText");
  const color = options.selected
    ? getBoothmapColor("overlayBadgeText")
    : getBoothmapColor("overlayBadgeBackground");
  const border = options.selected ? accent : getBoothmapColor("overlayLabelBorder");
  const opacity = options.dimmed ? 0.55 : 1;
  const shadow = getBoothmapColor("overlayShadow");

  return `
    <div style="
      pointer-events:none;
      transform: translateY(-52px);
      opacity:${opacity};
    ">
      <div style="
        display:inline-flex;
        align-items:center;
        max-width:180px;
        padding:6px 10px;
        border-radius:999px;
        border:1px solid ${border};
        background:${background};
        color:${color};
        font-size:12px;
        font-weight:700;
        line-height:1;
        white-space:nowrap;
        box-shadow:0 6px 14px ${shadow};
      ">
        ${options.name}
      </div>
    </div>
  `;
};

export const createAnchorDotContent = (selected: boolean, kind: "booth" | "college") => {
  const color = getBoothmapLabelAccent(kind);
  const size = selected ? 10 : 8;
  const border = selected
    ? getBoothmapColor("overlayBadgeBackground")
    : getBoothmapColor("overlayBadgeText");
  const shadow = getBoothmapColor("overlayShadow");

  return `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:999px;
      background:${color};
      border:2px solid ${border};
      box-shadow:0 2px 6px ${shadow};
      pointer-events:none;
    "></div>
  `;
};
