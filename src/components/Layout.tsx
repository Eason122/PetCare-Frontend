import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Map, Users, Stethoscope, UserCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import BannerAd from './BannerAd';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/map', icon: Map, label: t('nav.map') },
    { to: '/community', icon: Users, label: t('nav.community') },
    { to: '/ai-health', icon: Stethoscope, label: t('nav.ai_health') },
    { to: '/profile', icon: UserCircle, label: t('nav.profile') },
  ];

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-gray-50 dark:bg-gray-900 max-w-md mx-auto relative shadow-xl overflow-hidden transition-colors">
      {/* NOTE: pt-safe 確保頂部不被瀏海遮擋，pb-32 確保內容不被底部廣告+導覽列遮蔽 */}
      <main className="flex-1 overflow-y-auto pb-32 pt-safe">
        <Outlet />
      </main>

      {/* 底部固定區域：廣告 + 導覽列 */}
      <div className="absolute bottom-0 w-full z-50">
        {/* 非 VIP 用戶的橫幅廣告 */}
        <BannerAd />

        {/* NOTE: pb-safe 搭配 env(safe-area-inset-bottom) 適配 iOS 瀏海/底部安全區域 */}
        <nav className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 px-2 transition-colors pb-safe">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-all duration-200',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                    : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-6 h-6 transition-transform', isActive && 'animate-nav-active')} />
                  <span className={cn('transition-all', isActive && 'font-semibold')}>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

