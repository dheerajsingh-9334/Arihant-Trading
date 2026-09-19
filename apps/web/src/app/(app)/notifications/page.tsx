'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function NotificationsPage() {
  const { user, hasRole } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notifications', { limit: 50 });
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#223FA7]" />
            <span>Alerts, Directives & Notifications</span>
          </h1>
          <p className="text-xs text-[#5871A5] mt-1">
            Real-time system events, GeM bid closing alerts, and executive broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
            <span>Mark All Read</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5871A5] bg-white border border-[#D6E3F5] rounded-xl">No notifications in your inbox.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 shadow-xs ${
                n.is_read
                  ? 'border-[#D6E3F5] bg-white text-[#5871A5]'
                  : 'border-red-200 bg-red-50/20 text-[#1A1A1A]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    n.is_read
                      ? 'bg-[#F7FBFF] text-[#5871A5] border border-[#D6E3F5]'
                      : 'bg-red-100 text-red-600 border border-red-200'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#1A1A1A]">{n.title}</span>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-red-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] font-mono text-[#5871A5]">
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkAsRead(n.id)}
                  className="shrink-0 text-xs text-[#223FA7]"
                >
                  Dismiss
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
