'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from 'next-themes';
import { NetworkStatusProvider } from '@/context/NetworkStatusContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NetworkStatusProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NetworkStatusProvider>
    </ThemeProvider>
  );
}
