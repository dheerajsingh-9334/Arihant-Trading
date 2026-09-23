'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Clock,
  ShieldCheck,
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
  const [istTime, setIstTime] = useState('');

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      setIstTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <header className="h-[64px] border-b border-[#D6E3F5] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none text-[#1A1A1A]">
      {/* Search / Cmd+K Trigger */}
      <div className="flex items-center flex-1 max-w-md min-w-[200px] mr-3">
        {/* Mobile Drawer Trigger Button */}
        <button
          type="button"
          onClick={toggleMobile}
          className="flex lg:hidden items-center justify-center p-2 mr-2.5 rounded-lg bg-white hover:bg-[#EAF2FF] border border-[#D6E3F5] text-[#5871A5] hover:text-[#223FA7] transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Open Menu Drawer"
          aria-label="Open Menu Drawer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Search Input Button */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] hover:border-[#9FC0F5] text-[#5871A5] text-xs transition-colors cursor-pointer whitespace-nowrap overflow-hidden"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="h-3.5 w-3.5 text-[#5871A5] shrink-0" />
            <span className="text-[13px] truncate">Search tenders, leads, accounts...</span>
          </div>
          <Kbd className="shrink-0 ml-2 hidden sm:inline-block">⌘K</Kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Live IST clock */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-xs tabular-nums text-[#1A1A1A] shrink-0">
          <Clock className="h-3.5 w-3.5 text-[#223FA7]" />
          <span className="font-semibold">{istTime || 'IST Clock'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EAF2FF] text-[#223FA7] font-bold border border-[#D6E3F5]">
            FY 26-27
          </span>
        </div>

        {/* System status */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">System Active</span>
        </div>

        {/* Notifications Icon with unread badge */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg bg-white hover:bg-[#F7FBFF] border border-[#D6E3F5] text-gray-600 hover:text-[#223FA7] transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill & Quick Sign Out */}
        {user && (
          <div className="flex items-center pl-2 border-l border-[#D6E3F5] gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5]">
              <div className="h-6 w-6 rounded-md bg-[#223FA7] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#1A1A1A] leading-tight truncate max-w-[120px]">
                  {user.full_name}
                </span>
                <span className="text-[9px] font-semibold text-[#5871A5] uppercase tracking-wider leading-none">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out of Arihant BOS"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 border border-[#D6E3F5] hover:border-red-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
            >
              <LogOut className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-600 transition-colors" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
