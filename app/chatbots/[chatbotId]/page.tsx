'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit2, Loader2, Copy, Check, Upload, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatbotContext {
  id: string;
  chatbotId: string;
  type: 'document' | 'note' | 'url';
  content: string;
  metadata: {
    filename?: string;
    url?: string;
    title?: string;
  };
  createdAt: string;
}

interface ChatbotEvent {
  id: string;
  description: string;
  timestamp: string;
  userId?: string;
}

const BEDROCK_MODELS = {
  'llama-3-8b': {
    name: 'Llama 3 8B',
    description: 'Fastest and cheapest option',
    tier: 'free',
  },
  'claude-3-5-haiku': {
    name: 'Claude 3.5 Haiku',
    description: 'Fast and affordable, great for customer support',
    tier: 'free',
  },
  'llama-3-70b': {
    name: 'Llama 3 70B',
    description: 'Open source, strong performance',
    tier: 'premium',
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    description: 'Best balance of intelligence and speed',
    tier: 'premium',
  },
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    description: 'Most capable, for complex reasoning tasks',
    tier: 'premium',
  },
};

const fetcher = async (url: string) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function ChatbotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatbotId = params.chatbotId as string;
  
  const { data, error, mutate } = useSWR(
    chatbotId ? `${process.env.NEXT_PUBLIC_API_URL}/chatbots/${chatbotId}` : null,
    fetcher
  );
  
  const { data: contextsData, mutate: mutateContexts } = useSWR(
    chatbotId ? `${process.env.NEXT_PUBLIC_API_URL}/chatbots/${chatbotId}/context` : null,
    fetcher
  );
  
  const chatbot = data?.chatbot;
  const users = data?.users || {};
  const contexts: ChatbotContext[] = contextsData?.contexts || [];
  const loading = !data && !error;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    model: 'claude-3-5-haiku',
    temperature: 0.7,
    maxTokens: 2000,
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (chatbot) {
      setEditForm({
        name: chatbot.name,
        description: chatbot.description || '',
        systemPrompt: chatbot.systemPrompt,
        model: chatbot.model,
        temperature: chatbot.temperature,
        maxTokens: chatbot.maxTokens,
        status: chatbot.status,
      });
    }
  }, [chatbot]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbots/${chatbotId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(editForm)
        }
      );

      if (response.ok) {
        await mutate();
        setEditDrawerOpen(false);
        toast.success('Chatbot updated successfully');
      } else {
        toast.error('Failed to update chatbot');
      }
    } catch (error) {
      console.error('Failed to update chatbot:', error);
      toast.error('Failed to update chatbot');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyEmbed = () => {
    if (chatbot?.embedCode) {
      navigator.clipboard.writeText(chatbot.embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Embed code copied!');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      // Get presigned URL
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbots/${chatbotId}/context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            fileName: file.name,
            fileType: file.type,
            type: 'document'
          })
        }
      );

      if (!response.ok) {
        toast.error('Failed to get upload URL');
        return;
      }

      const { uploadUrl } = await response.json();

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResponse.ok) {
        await mutate();
        await mutateContexts();
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContext = async (contextId: string) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbots/${chatbotId}/context/${contextId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await mutate();
        await mutateContexts();
        toast.success('Document deleted');
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  if (error) {
    return (
      <div className="p-3 md:p-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">Chatbot not found</h3>
          <Button onClick={() => router.push('/chatbots')} className="mt-4">
            Back to Chatbots
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="p-3 md:p-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">Chatbot not found</h3>
          <Button onClick={() => router.push('/chatbots')} className="mt-4">
            Back to Chatbots
          </Button>
        </div>
      </div>
    );
  }

  const selectedModel = BEDROCK_MODELS[chatbot.model as keyof typeof BEDROCK_MODELS];

  return (
    <div className="p-3 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/chatbots')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chatbots
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold ml-2">
            {chatbot.name}
          </h1>
        </div>
        <Button onClick={() => setEditDrawerOpen(true)} className="bg-indigo-500 text-white hover:bg-indigo-600">
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Chatbot
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Model</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{selectedModel?.name}</p>
                  {selectedModel?.tier === 'free' ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">FREE</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">PREMIUM</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{selectedModel?.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Temperature</p>
                <p className="text-lg font-semibold">{chatbot.temperature}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Max Tokens</p>
                <p className="text-lg font-semibold">{chatbot.maxTokens}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className={chatbot.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {chatbot.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
            <div className="border rounded-md p-4 bg-muted/30 text-sm whitespace-pre-wrap">
              {chatbot.systemPrompt || <span className="text-muted-foreground italic">No system prompt configured</span>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Context & Knowledge Base</h2>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button size="sm" variant="outline" disabled={uploading} asChild>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                      Upload Document
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              {contexts.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-sm text-muted-foreground">No documents or context added yet</p>
                </div>
              ) : (
                contexts.map((context) => (
                  <div key={context.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{context.metadata?.filename || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{context.type}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteContext(context.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Events</h2>
            <div className="space-y-2">
              {chatbot.events && chatbot.events.length > 0 ? (
                [...chatbot.events]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((event: ChatbotEvent) => {
                    const user = event.userId ? users[event.userId] : null;
                    const userName = user ? user.name : 'Unknown';
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <p className="text-sm">
                          {event.description}
                          {event.userId && userName && userName !== 'Unknown' && (
                            <span className="text-muted-foreground">
                              {' by '}
                              <span className="font-medium">{userName}</span>
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(event.timestamp).toLocaleString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </p>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-muted-foreground">No events recorded</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Embed Code</h2>
            <div className="space-y-3">
              <div className="border rounded-lg p-3 bg-muted/30">
                <code className="text-xs break-all">
                  {chatbot.embedCode}
                </code>
              </div>
              <Button 
                onClick={handleCopyEmbed} 
                className="w-full"
                variant="outline"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Embed Code
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{contexts.length}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{new Date(chatbot.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen} direction="right">
        <DrawerContent className="h-full dark:bg-zinc-900">
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit Chatbot</DrawerTitle>
            <DrawerDescription>Update chatbot configuration</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Customer Support Bot"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Helps customers with product questions"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model *</label>
              <Select value={editForm.model} onValueChange={(value) => setEditForm({...editForm, model: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BEDROCK_MODELS).map(([key, model]) => (
                    <SelectItem 
                      key={key} 
                      value={key}
                      disabled={model.tier === 'premium'}
                    >
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.tier === 'free' ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">FREE</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">🔒 PREMIUM</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {BEDROCK_MODELS[editForm.model as keyof typeof BEDROCK_MODELS]?.description}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt</label>
              <Textarea
                className="min-h-[100px]"
                value={editForm.systemPrompt}
                onChange={(e) => setEditForm({...editForm, systemPrompt: e.target.value})}
                placeholder="You are a helpful customer support assistant..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature (0-1)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={editForm.temperature}
                onChange={(e) => setEditForm({...editForm, temperature: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <Input
                type="number"
                value={editForm.maxTokens}
                onChange={(e) => setEditForm({...editForm, maxTokens: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editForm.status} onValueChange={(value: 'active' | 'inactive') => setEditForm({...editForm, status: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button 
              className="bg-indigo-500 text-white hover:bg-indigo-600" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
