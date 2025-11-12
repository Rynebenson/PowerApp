'use client';

import { usePathname } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import useSWR, { mutate as globalMutate } from 'swr';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '@/components/ui/sidebar';
import OnboardingWizard from './OnboardingWizard';
import Image from 'next/image';
import Logo from "@/public/logo.png";

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
  const { setOpenMobile } = useSidebar();
  const isSettingsPage = pathname?.startsWith('/settings');
  const [forceShow, setForceShow] = useState(false);



  useEffect(() => {
    const handleShowOnboarding = () => setForceShow(true);
    window.addEventListener('show-onboarding', handleShowOnboarding);
    return () => window.removeEventListener('show-onboarding', handleShowOnboarding);
  }, []);

  const handleComplete = async (data: { name: string; chatbot: { name: string; description: string; model: string } }) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      // Step 1: Create organization
      const orgResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orgs/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name }),
      });
      
      if (!orgResponse.ok) {
        const orgResult = await orgResponse.json();
        throw new Error(orgResult.error || 'Failed to create organization');
      }
      
      await orgResponse.json();
      
      // Step 2: Create chatbot (use accessToken for authenticated endpoints)
      const accessToken = session.tokens?.accessToken?.toString();
      const chatbotResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbots`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.chatbot.name,
          description: data.chatbot.description,
          systemPrompt: 'You are a helpful AI assistant. Answer questions clearly and concisely.',
          model: data.chatbot.model,
          temperature: 0.7,
          maxTokens: 2048,
        }),
      });
      
      if (!chatbotResponse.ok) {
        const chatbotResult = await chatbotResponse.json();
        console.error('Failed to create chatbot:', chatbotResult.error);
      }
      
      await chatbotResponse.json();
      
      // Close wizard and refresh all data
      setForceShow(false);
      await mutate();
      // Revalidate all SWR caches to pick up new org and chatbot
      await globalMutate(() => true);
    } catch (error) {
      console.error('Error in handleComplete:', error);
      throw error;
    }
  };

  const [mounted, setMounted] = useState(false);
  const hasOrganizations = appData?.organizations && appData.organizations.length > 0;
  const showWizard = forceShow || (!isSettingsPage && appData?.user && !appData.user.active_org_id);
  const canClose = forceShow && hasOrganizations;
  const isLoading = !appData;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showWizard) {
      setOpenMobile(false);
    }
  }, [showWizard, setOpenMobile]);

  // Show loading state until we know if onboarding is needed
  if (isLoading && !isSettingsPage) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-zinc-900 flex items-center justify-center z-10000">
        <Image src={Logo} alt="Logo" className="w-auto h-6 animate-pulse dark:invert" priority quality={100} />
      </div>
    );
  }

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
