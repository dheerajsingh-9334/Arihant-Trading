'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, PRESET_ROLE_USERS } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';

export const Navbar: React.FC<{ onOpenCommand?: () => void }> = ({
  onOpenCommand,
}) => {
  const { user } = useAuth();
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

  const roleInfo = user ? PRESET_ROLE_USERS[user.role] : null;

  return (
    <header className="h-[64px] border-b border-[#D6E3F5] bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none text-[#1A1A1A]">
      {/* Search / Cmd+K Trigger */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] hover:border-[#9FC0F5] text-gray-500 text-xs transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[13px]">Search tenders, leads, accounts...</span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-white text-[#223FA7] rounded border border-[#D6E3F5] font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3.5">
        {/* Live IST clock */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#F7FBFF] border border-[#D6E3F5] text-xs font-mono text-[#1A1A1A]">
          <Clock className="h-3.5 w-3.5 text-[#223FA7]" />
          <span className="font-semibold">{istTime || 'IST Clock'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EAF2FF] text-[#223FA7] font-bold border border-[#D6E3F5]">
            FY 26-27
          </span>
        </div>

        {/* Security badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">PostgreSQL 16</span>
        </div>

        {/* Notifications Icon with unread badge */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg bg-white hover:bg-[#F7FBFF] border border-[#D6E3F5] text-gray-600 hover:text-[#223FA7] transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-[#D6E3F5]">
            <div className="h-8 w-8 rounded-lg bg-[#223FA7] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                {user.full_name}
              </div>
              <div className="text-[11px] text-[#5871A5] leading-tight">
                {roleInfo?.title || user.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
