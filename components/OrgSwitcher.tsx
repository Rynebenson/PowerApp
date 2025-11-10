'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface OrgSwitcherProps {
  activeOrg: Organization | null;
  organizations: Organization[];
  loading?: boolean;
  onSwitchOrg: (org: Organization) => void;
  onCreateOrg: () => void;
}

export default function OrgSwitcher({ activeOrg, organizations, onSwitchOrg, onCreateOrg }: OrgSwitcherProps) {
  const [switching, setSwitching] = useState(false);

  if (switching) {
    return (
      <div className="w-full px-2 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <Button variant="ghost" className="w-full justify-start px-2 h-auto py-2" onClick={onCreateOrg}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
            <Building className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">Create Workspace</span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-2 h-auto py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white text-sm font-bold">
              {activeOrg?.name?.charAt(0) || 'W'}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-32">{activeOrg?.name}</span>
              <span className="text-xs text-muted-foreground">{activeOrg?.role}</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent side="bottom" align="start" className="w-80">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className={activeOrg?.id === org.id ? "bg-accent" : ""}
            onClick={async () => {
              setSwitching(true);
              try {
                await onSwitchOrg(org);
              } finally {
                setSwitching(false);
              }
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white text-xs font-bold">
                {org.name?.charAt(0) || 'W'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground">{org.role}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onCreateOrg}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
