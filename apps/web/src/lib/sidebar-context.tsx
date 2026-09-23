'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isOpenMobile: boolean;
  toggleCollapse: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleMobile: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arihant_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arihant_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  const openSidebar = useCallback(() => {
    setIsCollapsed(false);
    try {
      localStorage.setItem('arihant_sidebar_collapsed', 'false');
    } catch {}
  }, []);

  const closeSidebar = useCallback(() => {
    setIsCollapsed(true);
    try {
      localStorage.setItem('arihant_sidebar_collapsed', 'true');
    } catch {}
  }, []);

  const toggleMobile = useCallback(() => setIsOpenMobile((prev) => !prev), []);
  const openMobile = useCallback(() => setIsOpenMobile(true), []);
  const closeMobile = useCallback(() => setIsOpenMobile(false), []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isOpenMobile,
        toggleCollapse,
        openSidebar,
        closeSidebar,
        toggleMobile,
        openMobile,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
