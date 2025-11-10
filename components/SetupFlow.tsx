'use client';

import { usePathname } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import OnboardingWizard from './OnboardingWizard';

interface SetupFlowProps {
  children: React.ReactNode;
}

const fetchAppData = async () => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/app-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) throw new Error('Failed to fetch app data');
  return response.json();
};

export default function SetupFlow({ children }: SetupFlowProps) {
  const { data: appData, mutate } = useSWR('app-data', fetchAppData);
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith('/settings');
  const [forceShow, setForceShow] = useState(false);



  useEffect(() => {
    const handleShowOnboarding = () => setForceShow(true);
    window.addEventListener('show-onboarding', handleShowOnboarding);
    return () => window.removeEventListener('show-onboarding', handleShowOnboarding);
  }, []);

  const handleComplete = async (data: { name: string; email?: string; phone?: string }) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orgs/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }
      
      setForceShow(false);
      await mutate();
    } catch (error) {
      console.error('Error in handleComplete:', error);
      throw error;
    }
  };

  const [mounted, setMounted] = useState(false);
  const hasOrganizations = appData?.organizations && appData.organizations.length > 0;
  const showWizard = forceShow || (!isSettingsPage && appData?.user && !appData.user.active_org_id);
  const canClose = forceShow && hasOrganizations;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      
      {mounted && showWizard && createPortal(
        <OnboardingWizard onComplete={handleComplete} onClose={canClose ? () => setForceShow(false) : undefined} />,
        document.body
      )}
    </>
  );
}
