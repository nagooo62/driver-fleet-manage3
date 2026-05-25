import { useState, useEffect } from "react";
import { Bell, Building2, Settings, Menu, LogOut, User, Key, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyInfoModal } from "@/components/CompanyInfoModal";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { SettingsModal } from "@/components/SettingsModal";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { supabase } from "@/integrations/supabase/client";
import { formatDateArabic } from "@/lib/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header = ({ onSidebarToggle }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchNotificationCount();
    fetchCompanyInfo();
    fetchUserProfile();
  }, [user]);

  const fetchNotificationCount = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("is_read", false);
      
      if (error) throw error;
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCompanyInfo(data);
    } catch (error) {
      console.error("Failed to fetch company info:", error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  return (
    <>
      <header className="h-16 glass border-b border-card-border flex items-center justify-between px-6">
        {/* Left Section - Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="lg:hidden touch-target"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Center Section - Company Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setIsCompanyModalOpen(true)}
            className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">
                {companyInfo?.company_name || "روائس"}
              </div>
              <div className="text-xs text-muted-foreground">
                للخدمات اللوجستية
              </div>
            </div>
          </Button>
        </div>

        {/* Right Section - Date, Notifications, Settings */}
        <div className="flex items-center gap-4">
          {/* Current Date */}
          <div className="hidden sm:flex glass px-3 py-2 rounded-lg font-cairo text-sm">
            اليوم: {formatDateArabic(new Date())}
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative touch-target"
            aria-label={unreadCount > 0 ? `الإشعارات — ${unreadCount} غير مقروء` : "الإشعارات"}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                aria-hidden="true"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="touch-target"
            aria-label="الإعدادات"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">
                  {userProfile?.full_name || user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>{userProfile?.full_name || user?.email}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Badge variant="secondary" className="mr-2">
                  {userProfile?.role || 'employee'}
                </Badge>
                <span>الصلاحية</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)}>
                <Key className="mr-2 h-4 w-4" />
                <span>تغيير كلمة المرور</span>
              </DropdownMenuItem>
              {userProfile?.role === 'admin' && (
                <DropdownMenuItem onClick={() => setIsUserManagementOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>إدارة المستخدمين</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CompanyInfoModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companyInfo={companyInfo}
        onUpdate={fetchCompanyInfo}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNotificationRead={fetchNotificationCount}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PasswordChangeModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
      />

      {isUserManagementOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background border-l shadow-lg overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">إدارة المستخدمين</h2>
              <Button variant="ghost" onClick={() => setIsUserManagementOpen(false)}>
                ✕
              </Button>
            </div>
            <AdminUserManagement />
          </div>
        </div>
      )}
    </>
  );
};