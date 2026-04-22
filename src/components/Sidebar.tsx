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
      <aside className={cn(
        "fixed lg:sticky top-0 right-0 h-screen w-80 z-50 glass-sidebar p-4 transition-all duration-300 lg:translate-x-0 font-cairo",
        isOpen ? "translate-x-0 animate-slide-in" : "translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl glass flex items-center justify-center font-bold text-lg">
            RL
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold opacity-90">روائس للخدمات اللوجستية</div>
            <div className="text-xs opacity-75">نظام إدارة المناديب والمركبات</div>
          </div>
          <button 
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-2 overflow-y-auto flex-1 max-h-[calc(100vh-200px)] scrollbar-visible">
          {sidebarGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.id);
            
            return (
              <div key={group.id} className="glass rounded-lg overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-3 font-semibold text-sm hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {group.icon}
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    isCollapsed ? "rotate-0" : "rotate-180"
                  )} />
                </button>

                {/* Group Items */}
                {!isCollapsed && (
                  <div className="transition-all duration-200">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleViewChange(item.id)}
                        className={cn(
                          "w-full text-right px-4 py-3 text-sm border-t border-border/20 transition-all duration-200 glass-hover",
                          currentView === item.id ? "bg-accent font-semibold shadow-lg" : ""
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
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