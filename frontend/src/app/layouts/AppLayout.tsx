import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F9] pt-[60px] text-[#1A1A2E]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-[#F4F6F9] p-4 sm:p-6 lg:p-8">
        <div className="w-full animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
