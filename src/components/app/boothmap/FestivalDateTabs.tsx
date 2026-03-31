// 역할: boothmap 화면에서 사용하는 Festival Date Tabs UI 블록을 렌더링합니다.
type FestivalDateTab = {
  label: string;
  value: string;
};

type FestivalDateTabsProps = {
  dates: FestivalDateTab[];
  selectedDate: string;
  onChange: (date: string) => void;
  className?: string;
};

export default function FestivalDateTabs({
  dates,
  selectedDate,
  onChange,
  className = "",
}: FestivalDateTabsProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 rounded-2xl bg-[var(--boothmap-chip-bg)] p-1">
        {dates.map((item) => {
          const isSelected = selectedDate === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`rounded-lg px-2 py-1.5 text-sm font-semibold transition-all ${
                isSelected
                  ? "border border-[var(--boothmap-chip-selected-border)] bg-[var(--boothmap-chip-selected-bg)] text-[var(--boothmap-chip-selected-text)] shadow-[var(--boothmap-chip-selected-shadow)]"
                  : "border border-transparent text-[var(--boothmap-chip-text)] hover:bg-[var(--boothmap-chip-hover-bg)] hover:text-[var(--boothmap-chip-hover-text)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
