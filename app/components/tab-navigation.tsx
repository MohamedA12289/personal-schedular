export type TabKey = "calendar" | "day" | "list" | "settings";

export type TabDefinition = {
  key: TabKey;
  label: string;
};

type TabButtonProps = {
  tab: TabDefinition;
  isActive: boolean;
  onSelect: (key: TabKey) => void;
};

function TabButton({ tab, isActive, onSelect }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.key)}
      role="tab"
      id={`tab-${tab.key}`}
      aria-selected={isActive}
      aria-controls={`tab-panel-${tab.key}`}
      className={`min-w-[110px] rounded-xl px-4 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:flex-1 ${
        isActive
          ? "bg-teal-500 text-white shadow-[0_10px_40px_-18px_rgba(16,185,129,0.9)]"
          : "border border-gray-200 bg-white text-slate-600 hover:border-teal-200 hover:text-slate-900"
      }`}
    >
      {tab.label}
    </button>
  );
}

export type TabNavigationProps = {
  tabs: TabDefinition[];
  activeTab: TabKey;
  onSelect: (key: TabKey) => void;
};

export function TabNavigation({ tabs, activeTab, onSelect }: TabNavigationProps) {
  return (
    <nav
      className="flex flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="tablist"
      aria-label="Choose a schedule view"
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <TabButton key={tab.key} tab={tab} isActive={tab.key === activeTab} onSelect={onSelect} />
        ))}
      </div>
    </nav>
  );
}
