'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNavItems = [
  {
    title: 'Account',
    href: '/settings/account',
    description: 'Personal information'
  },
  {
    title: 'Preferences',
    href: '/settings/preferences',
    description: 'Notifications & display'
  },
  {
    title: 'Organization',
    href: '/settings/organization',
    description: 'Workspace & members'
  },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {settingsNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex flex-col items-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-muted px-3 py-2',
            pathname === item.href
              ? 'bg-muted text-accent-foreground border-l-4 border-blue-500'
              : 'text-muted-foreground hover:text-accent-foreground'
          )}
        >
          <span className="font-medium">{item.title}</span>
          <span className="text-xs opacity-70">{item.description}</span>
        </Link>
      ))}
    </nav>
  );
}
