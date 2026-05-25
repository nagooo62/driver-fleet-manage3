import { useState } from 'react';
import { ChevronDown, Users, Car, MessageSquare, Menu, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  active?: boolean;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  collapsed?: boolean;
}

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  closeAllModals?: () => void;
}

const sidebarGroups: SidebarGroup[] = [
  {
    id: 'drivers',
    label: 'المناديب',
    icon: <Users className="w-5 h-5" />,
    items: [
      { id: 'drivers_all', label: 'إجمالي المناديب' },
      { id: 'drivers_new', label: 'المتقدمين الجدد' },
      { id: 'drivers_accepted', label: 'تم قبولهم' },
      { id: 'drivers_sponsored', label: 'على الكفالة' },
      { id: 'drivers_ajer', label: 'عقود أجير' },
      { id: 'drivers_archived', label: 'الأرشيف' },
    ]
  },
  {
    id: 'cars',
    label: 'السيارات',
    icon: <Car className="w-5 h-5" />,
    items: [
      { id: 'cars_all', label: 'كل السيارات' },
      { id: 'cars_delegated', label: 'مفوضة' },
      { id: 'cars_handed', label: 'مسلمة' },
      { id: 'cars_oos', label: 'خارج الخدمة' },
    ]
  },
  {
    id: 'applications',
    label: 'التطبيقات',
    icon: <MessageSquare className="w-5 h-5" />,
    items: [
      { id: 'applications_toyou', label: 'ToYou' },
      { id: 'applications_jahez', label: 'جاهز' },
      { id: 'applications_keeta', label: 'كيتا' },
      { id: 'applications_hungerstation', label: 'هنقرستيشن' },
    ]
  },
  {
    id: 'reports',
    label: 'التقارير',
    icon: <BarChart3 className="w-5 h-5" />,
    items: [
      { id: 'reports_drivers', label: 'تقارير المناديب' },
      { id: 'reports_cars', label: 'تقارير السيارات' },
      { id: 'reports_ads', label: 'تقارير الإعلانات' },
      { id: 'reports_archive', label: 'تقارير الأرشيف' },
      { id: 'reports_performance', label: 'تقارير الأداء' },
      { id: 'toyota_reports', label: 'تقارير تويوتا' },
    ]
  }
];

export const Sidebar = ({ currentView, onViewChange, isOpen, onToggle, closeAllModals }: SidebarProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(sidebarGroups.map(group => group.id)) // Start with all groups collapsed
  );

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleViewChange = (view: string) => {
    // Find which group contains the clicked item
    const clickedGroupId = sidebarGroups.find(group => 
      group.items.some(item => item.id === view)
    )?.id;
    
    if (clickedGroupId) {
      // Collapse all groups except the clicked one
      setCollapsedGroups(new Set(sidebarGroups
        .filter(group => group.id !== clickedGroupId)
        .map(group => group.id)
      ));
    }
    
    // Close any open modals
    closeAllModals?.();
    
    // Change the view
    onViewChange(view);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 right-0 h-screen w-72 z-50 glass-sidebar flex flex-col p-4 transition-transform duration-300 lg:translate-x-0 font-cairo",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="القائمة الجانبية الرئيسية"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center font-bold text-base logo-glow shrink-0 text-primary">
            RL
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">روائس اللوجستية</div>
            <div className="text-[11px] text-muted-foreground truncate">إدارة المناديب والمركبات</div>
          </div>
          <button
            onClick={onToggle}
            aria-label="إغلاق القائمة"
            className="lg:hidden touch-target rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav
          className="space-y-1.5 overflow-y-auto flex-1 scrollbar-thin pb-4"
          aria-label="روابط التنقل"
        >
          {sidebarGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.id);
            const hasActive = group.items.some((i) => i.id === currentView);

            return (
              <div key={group.id} className="rounded-[16px] overflow-hidden border border-white/8">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 font-semibold text-sm transition-colors",
                    hasActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-white/5 text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("transition-colors", hasActive ? "text-primary" : "text-muted-foreground")}>
                      {group.icon}
                    </span>
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200 text-muted-foreground",
                      !isCollapsed && "rotate-180"
                    )}
                  />
                </button>

                {/* Group Items */}
                {!isCollapsed && (
                  <div className="bg-white/[0.02]">
                    {group.items.map((item) => {
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleViewChange(item.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "w-full text-right px-4 py-2.5 text-sm border-t border-white/5 transition-colors duration-150",
                            isActive
                              ? "nav-item-active font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};