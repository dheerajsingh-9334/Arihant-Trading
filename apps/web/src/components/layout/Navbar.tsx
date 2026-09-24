'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { Kbd } from '@/components/ui';

export const Navbar: React.FC<{ onOpenCommand?: () => void }> = ({
  onOpenCommand,
}) => {
  const { user, logout } = useAuth();
  const { toggleMobile } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count & listen to socket notifications
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.count || 0);
      } catch {
        // quiet error
      }
    };

    fetchUnread();

    const socket = getSocket();
    if (socket) {
      const handleNewNotif = () => {
        setUnreadCount((c) => c + 1);
      };
      socket.on('notification:new', handleNewNotif);
      return () => {
        socket.off('notification:new', handleNewNotif);
      };
    }
  }, [user]);

  return (
    <header className="h-[64px] border-b border-[#E3E7ED] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none text-[#152235]">
      {/* Search / Cmd+K Trigger */}
      <div className="flex items-center flex-1 max-w-md min-w-[200px] mr-3">
        {/* Mobile Drawer Trigger Button */}
        <button
          type="button"
          onClick={toggleMobile}
          className="flex lg:hidden items-center justify-center p-2 mr-2.5 rounded-[8px] bg-white hover:bg-[#F1F7F5] border border-[#E3E7ED] text-[#5E6A7C] hover:text-[#0F5E4E] transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Open Menu Drawer"
          aria-label="Open Menu Drawer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Search Input Button */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-[8px] bg-[#F9FAFB] border border-[#E3E7ED] hover:border-[#16917A] text-[#5E6A7C] text-xs transition-colors cursor-pointer whitespace-nowrap overflow-hidden"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="h-3.5 w-3.5 text-[#5E6A7C] shrink-0" />
            <span className="text-[13px] truncate">Search tenders, leads, accounts...</span>
          </div>
          <Kbd className="shrink-0 ml-2 hidden sm:inline-block">⌘K</Kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2.5 shrink-0">

        {/* Notifications Icon with unread badge */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-[8px] bg-white hover:bg-[#F1F7F5] border border-[#E3E7ED] text-[#5E6A7C] hover:text-[#0F5E4E] transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#B42318] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill & Quick Sign Out */}
        {user && (
          <div className="flex items-center pl-2 border-l border-[#E3E7ED] gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-white border border-[#E3E7ED]">
              <div className="h-6 w-6 rounded-md bg-[#0F5E4E] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#132822] leading-tight truncate max-w-[120px]">
                  {user.full_name}
                </span>
                <span className="text-[9px] font-semibold text-[#84928C] uppercase tracking-wider leading-none">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out of Arihant BOS"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white hover:bg-[#FEF1EF] text-[#152235] hover:text-[#B42318] border border-[#E3E7ED] hover:border-[#F6CFC9] text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
            >
              <LogOut className="h-3.5 w-3.5 text-[#5E6A7C] group-hover:text-[#B42318] transition-colors" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
