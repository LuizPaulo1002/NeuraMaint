import { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-industrial-lightgray">
      {/* Fixed Navbar */}
      <Navbar />
      
      <div className="flex pt-16"> {/* pt-16 to account for fixed navbar */}
        {/* Collapsible Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}