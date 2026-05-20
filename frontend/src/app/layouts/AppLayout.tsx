import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col transition-colors bg-gray-50 text-gray-900 pt-[60px]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors bg-slate-50/50">
        <div className="w-full animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
