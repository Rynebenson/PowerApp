'use client';

import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import useSWR from 'swr';
import { Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';

const fetcher = async (url: string) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function RootPage() {
  const { activeOrg } = useApp();
  const { data, error } = useSWR(
    activeOrg?.id ? `${process.env.NEXT_PUBLIC_API_URL}/chatbots` : null,
    fetcher
  );
  
  const chatbots = data?.chatbots || [];
  const activeChatbots = chatbots.filter((c: { status: string }) => c.status === 'active');
  const loading = !data && !error;

  return (
    <div className="p-4 lg:p-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">Quick access to your active chatbots. Click any chatbot to view details, manage settings, or get the embed code.</p>
      </div>

      <div>
        {loading ? (
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border-l-4 border-indigo-400 dark:border-indigo-600 p-4 rounded">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </div>
        ) : activeChatbots.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active chatbots yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeChatbots.map((chatbot: { id: string; name: string; description?: string; model: string; createdAt: string; status: string }) => (
              <Link
                key={chatbot.id}
                href={`/chatbots/${chatbot.id}`}
                className="block bg-indigo-400 dark:bg-indigo-950/30 border-l-4 border-indigo-400 dark:border-indigo-600 p-4 rounded cursor-pointer hover:bg-indigo-500 dark:hover:bg-indigo-950/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium">{chatbot.name}</span>
                    </div>
                    {chatbot.description && (
                      <p className="text-sm text-muted-foreground">
                        {chatbot.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {chatbot.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(chatbot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}