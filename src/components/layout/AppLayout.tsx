import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BrandWatermark } from '@/components/branding/BrandWatermark';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Topbar } from '@/components/layout/Topbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <BrandWatermark />
      <SidebarNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative min-h-screen lg:pr-[21rem]">
        <Topbar onOpenMenu={() => setSidebarOpen(true)} />

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
