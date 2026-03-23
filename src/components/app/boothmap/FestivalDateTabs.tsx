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
      <div className="grid grid-cols-3 rounded-2xl bg-[var(--surface-subtle)] p-1">
        {dates.map((item) => {
          const isSelected = selectedDate === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`rounded-lg px-2 py-1.5 text-sm font-semibold transition-all ${
                isSelected
                  ? "bg-[var(--accent)] text-white shadow-[0_8px_18px_-10px_var(--shadow-color)]"
                  : "text-[var(--text-muted)] hover:bg-white/70 hover:text-[var(--text)]"
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