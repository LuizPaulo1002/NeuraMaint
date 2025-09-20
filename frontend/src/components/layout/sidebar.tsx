'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  CogIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSidebarStore } from '@/store/sidebar-store';
import { clsx } from 'clsx';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Bombas',
    href: '/dashboard/bombas',
    icon: CogIcon,
    description: 'Gestão de equipamentos'
  },
  {
    name: 'Monitoramento',
    href: '/dashboard/monitoramento',
    icon: ChartBarIcon,
    description: 'Dados em tempo real'
  },
  {
    name: 'Alertas',
    href: '/dashboard/alertas',
    icon: ExclamationTriangleIcon,
    description: 'Notificações ativas'
  },
  {
    name: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: DocumentTextIcon,
    description: 'Análises e relatórios'
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-16 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Close Button */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 pb-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'sidebar-link group',
                  isActive && 'active bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                )}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    close();
                  }
                }}
              >
                <Icon 
                  className={clsx(
                    'h-6 w-6 mr-3 transition-colors duration-200',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
                  )} 
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="block text-xs text-gray-500 group-hover:text-primary-500">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Status Card */}
        <div className="mx-4 mt-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Status do Sistema</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">API Backend</span>
              <span className="flex items-center text-status-normal">
                <div className="h-2 w-2 bg-status-normal rounded-full mr-1"></div>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">ML Service</span>
              <span className="flex items-center text-status-normal">
                <div className="h-2 w-2 bg-status-normal rounded-full mr-1"></div>
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Última Atualização</span>
              <span className="text-gray-500">2min atrás</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-500 text-center">
            <p>NeuraMaint v1.0.0</p>
            <p className="mt-1">© 2024 - Manutenção Preditiva</p>
          </div>
        </div>
      </aside>
    </>
  );
}