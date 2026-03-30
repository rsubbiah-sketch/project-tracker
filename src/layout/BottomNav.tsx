import { accentText } from '../tokens';
import { Icon } from '../components/Icons';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface BottomNavProps {
  mob: boolean;
  view: string;
  goTo: (id: string) => void;
  bottomNav: NavItem[];
  setSidebarOpen: (v: boolean) => void;
}

export default function BottomNav({ mob, view, goTo, bottomNav, setSidebarOpen }: BottomNavProps) {
  if (!mob) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border flex items-center justify-around h-16 backdrop-blur-[20px]" style={{ background: "hsl(var(--background) / 0.94)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {bottomNav.map(ni => (
        <button key={ni.id} onClick={() => goTo(ni.id)}
          className="flex flex-col items-center gap-1 py-2 px-3 bg-transparent border-none cursor-pointer">
          <Icon name={ni.icon} size={20} color={view === ni.id ? accentText : 'var(--muted-foreground)'} />
          <span className="font-medium text-[10px]" style={{ color: view === ni.id ? accentText : 'var(--muted-foreground)' }}>{ni.label}</span>
        </button>
      ))}
      <button onClick={() => setSidebarOpen(true)}
        className="flex flex-col items-center gap-1 py-2 px-3 bg-transparent border-none cursor-pointer">
        <Icon name="list" size={20} color="var(--muted-foreground)" />
        <span className="font-medium text-[10px] text-muted-foreground">More</span>
      </button>
    </div>
  );
}
