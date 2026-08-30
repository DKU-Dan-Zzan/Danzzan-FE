// 역할: 안내 화면 가운데에 놓는 LEGEND 톤의 선화 아이콘을 제공한다.

/**
 * 안내 화면은 "무언가 사라진 자리"라 글만 있으면 허전하고, 사용자가
 * 오류 화면으로 오해하기 쉽다. 가운데에 그림을 하나 두면 "안내"로 읽힌다.
 *
 * 색은 넘겨받은 곳의 color 를 그대로 쓰도록 currentColor 로 둔다.
 * 여기서 값을 직접 박으면 팔레트가 바뀔 때 이 파일만 남는다.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

/** 아이콘 양옆에 놓는 4각 반짝임. 위치와 크기만 받아 같은 모양을 재사용한다. */
const Sparkle = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <path
    d={`M${x} ${y - r} Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y} Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r} Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y} Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r} Z`}
    fill="currentColor"
  />
)

/**
 * 티켓팅 — 무대와 그 앞의 관객. "현장에서 본다"를 그림으로 말한다.
 *
 * 관객은 어깨 호의 반지름(7)과 간격(14)을 맞춰 호가 정확히 맞닿게 두었다.
 * 겹치면 선이 엉켜 군중이 아니라 얼룩으로 보인다.
 */
export const StageIcon = () => (
  <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false">
    <g {...STROKE} strokeWidth={2}>
      {/* 무대 차양. 바닥 선을 긋지 않는다 — 사면을 닫으면 무대가 아니라 집으로 읽힌다. */}
      <path d="M48 12 86 32 10 32 Z" />
      <path d="M17 32 17 52" />
      <path d="M79 32 79 52" />
      {/* 관객. 무대와 떼어 앞줄로 보이게 한다. */}
      <circle cx="20" cy="66" r="4.4" />
      <circle cx="34" cy="66" r="4.4" />
      <circle cx="48" cy="66" r="4.4" />
      <circle cx="62" cy="66" r="4.4" />
      <circle cx="76" cy="66" r="4.4" />
      <path d="M13 79a7 7 0 0 1 14 0" />
      <path d="M27 79a7 7 0 0 1 14 0" />
      <path d="M41 79a7 7 0 0 1 14 0" />
      <path d="M55 79a7 7 0 0 1 14 0" />
      <path d="M69 79a7 7 0 0 1 14 0" />
    </g>
    {/* 차양 아래 전구 */}
    <g fill="currentColor">
      <circle cx="30" cy="41" r="1.9" />
      <circle cx="42" cy="41" r="1.9" />
      <circle cx="54" cy="41" r="1.9" />
      <circle cx="66" cy="41" r="1.9" />
    </g>
    <Sparkle x={7} y={22} r={4.4} />
    <Sparkle x={89} y={18} r={4.4} />
    <Sparkle x={88} y={38} r={2.6} />
  </svg>
)

/** 로그인·내 정보 — 계정이 필요 없다는 뜻으로 사람 표시를 지운 화면. */
export const NoAccountIcon = () => (
  <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false">
    {/* 휴대폰 */}
    <g {...STROKE} strokeWidth={2}>
      <rect x="30" y="15" width="36" height="66" rx="8" />
      <path d="M42 23 54 23" />
    </g>
    {/* 사람. 지우는 선과 굵기를 달리해야 겹치는 자리에서 서로 구분된다. */}
    <g {...STROKE} strokeWidth={1.8}>
      <circle cx="48" cy="41" r="7.6" />
      <path d="M36 65a12 12 0 0 1 24 0" />
    </g>
    {/* 지우는 선. 휴대폰 밖까지 빼야 그림의 일부가 아니라 덧씌운 표시로 읽힌다. */}
    <g {...STROKE} strokeWidth={2.2}>
      <path d="M27 77 69 21" />
    </g>
    <Sparkle x={16} y={32} r={4.4} />
    <Sparkle x={80} y={54} r={4.4} />
    <Sparkle x={20} y={52} r={2.6} />
  </svg>
)
