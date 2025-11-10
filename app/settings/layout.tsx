'use client';

import SettingsNav from '@/components/SettingsNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const settingsNavItems = [
  { title: 'Account', href: '/settings/account' },
  { title: 'Preferences', href: '/settings/preferences' },
  { title: 'Organization', href: '/settings/organization' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  
  const currentPage = settingsNavItems.find(item => item.href === pathname);
  const isSettingsRoot = pathname === '/settings';

  if (isMobile && isSettingsRoot) {
    return (
      <div className="space-y-6 px-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and organization settings.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {settingsNavItems.map((item, index) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                index !== settingsNavItems.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''
              }`}
            >
              <span className="text-base font-medium">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isMobile && !isSettingsRoot) {
    return (
      <div className="space-y-6 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Select value={pathname} onValueChange={(value) => router.push(value)}>
            <SelectTrigger className="w-48">
              <SelectValue>{currentPage?.title || 'Settings'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {settingsNavItems.map((item) => (
                <SelectItem key={item.href} value={item.href}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-10">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and organization settings.
        </p>
      </div>
      
      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0 rounded-md py-3 bg-white dark:bg-zinc-900 sticky top-6 h-fit border border-zinc-200 dark:border-zinc-800">
          <SettingsNav />
        </aside>
        
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
