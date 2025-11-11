'use client';

import { createContext, useContext } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import useSWR from 'swr';

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface User {
  user_id: string;
  email: string;
  name?: string;
  active_org_id?: string;
}

interface AppContextType {
  user: User | null;
  activeOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  refetch: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetcher = async (url: string) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/users/app-data`,
    fetcher
  );

  const activeOrg = data?.user?.active_org_id && data?.organizations
    ? data.organizations.find((o: Organization) => o.id === data.user.active_org_id) || null
    : null;

  return (
    <AppContext.Provider
      value={{
        user: data?.user || null,
        activeOrg,
        organizations: data?.organizations || [],
        loading: !data && !error,
        refetch: mutate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
