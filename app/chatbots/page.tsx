'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Bot, Loader2, Search, Lock, SlidersHorizontal, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Chatbot {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  model: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
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

export default function ChatbotsPage() {
  const router = useRouter();
  const { activeOrg, loading: appLoading } = useApp();
  
  const { data, error, mutate } = useSWR(
    activeOrg?.id ? `${process.env.NEXT_PUBLIC_API_URL}/chatbots` : null,
    fetcher
  );
  
  const chatbots = data?.chatbots || [];
  const loading = appLoading || (!data && !error);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'model'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [, setIsMobile] = useState(false);
  const [newChatbot, setNewChatbot] = useState({
    name: '',
    description: '',
    model: 'claude-3-5-haiku'
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const uniqueStatuses = Array.from(new Set(chatbots.map((c: Chatbot) => c.status))).sort() as string[];
  const uniqueModels = Array.from(new Set(chatbots.map((c: Chatbot) => c.model))).sort() as string[];

  const filteredAndSortedChatbots = chatbots
    .filter((chatbot: Chatbot) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = chatbot.name.toLowerCase().includes(query) ||
             chatbot.description?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
      if (filterStatus && filterStatus !== 'all' && chatbot.status !== filterStatus) return false;
      if (filterModel && filterModel !== 'all' && chatbot.model !== filterModel) return false;
      
      return true;
    })
    .sort((a: Chatbot, b: Chatbot) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'model':
          aValue = a.model.toLowerCase();
          bValue = b.model.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleAddChatbot = async () => {
    if (!newChatbot.name) {
      toast.error('Please enter a name');
      return;
    }

    if (!activeOrg?.id) {
      toast.error('No active organization found. Please create or switch to an organization first.');
      return;
    }

    try {
      setSubmitting(true);
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbots`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newChatbot)
        }
      );

      if (response.ok) {
        const { chatbot } = await response.json();
        await mutate();
        toast.success('Chatbot created successfully');
        router.push(`/chatbots/${chatbot.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create chatbot');
        console.error('Error creating chatbot:', errorData);
      }
    } catch (error) {
      console.error('Failed to create chatbot:', error);
      toast.error('Failed to create chatbot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-10 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Chatbots</h1>
          <p className="text-sm text-muted-foreground">Manage your AI chatbots</p>
        </div>
        
        <Drawer open={addDrawerOpen} onOpenChange={setAddDrawerOpen} direction="right">
          <DrawerTrigger asChild>
            <Button 
              className="bg-indigo-500 text-white hover:bg-indigo-600 w-full sm:w-auto"
              disabled={!activeOrg?.id}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Chatbot
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full dark:bg-slate-900">
            <DrawerHeader>
              <DrawerTitle>Create New Chatbot</DrawerTitle>
              <DrawerDescription>Add a new AI chatbot for your website</DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    placeholder="Customer Support Bot"
                    value={newChatbot.name}
                    onChange={(e) => setNewChatbot({...newChatbot, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Helps customers with product questions"
                    value={newChatbot.description}
                    onChange={(e) => setNewChatbot({...newChatbot, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model *</label>
                  <Select value={newChatbot.model} onValueChange={(value) => setNewChatbot({...newChatbot, model: value})}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BEDROCK_MODELS).map(([key, model]) => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          disabled={model.tier === 'premium'}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{model.name}</span>
                            {model.tier === 'premium' && (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {BEDROCK_MODELS[newChatbot.model as keyof typeof BEDROCK_MODELS]?.description}
                  </p>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button 
                className="bg-indigo-500 text-white hover:bg-indigo-600" 
                onClick={handleAddChatbot}
                disabled={submitting}
              >
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Chatbot'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search chatbots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Mobile: Sort & Filters Button */}
        <Button variant="outline" className="md:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="w-4 h-4" />
        </Button>

        {/* Desktop: Inline Filters */}
        <div className="hidden md:flex gap-2">
          <Select value={sortBy} onValueChange={(value: 'name' | 'created' | 'model') => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="model">Model</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map((status: string) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterModel} onValueChange={setFilterModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {uniqueModels.map((model: string) => (
                <SelectItem key={model} value={model}>
                  {BEDROCK_MODELS[model as keyof typeof BEDROCK_MODELS]?.name || model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterStatus || filterModel) && (
            <Button variant="ghost" size="sm" onClick={() => {
              setFilterStatus('');
              setFilterModel('');
            }}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Filters Drawer */}
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen} direction="bottom">
        <DrawerContent className="h-[60vh] dark:bg-slate-900">
          <DrawerHeader className="text-left">
            <DrawerTitle>Sort & Filter</DrawerTitle>
            <DrawerDescription>Organize your chatbots</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={(value: 'name' | 'created' | 'model') => setSortBy(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="model">Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status: string) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={filterModel} onValueChange={setFilterModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map((model: string) => (
                    <SelectItem key={model} value={model}>
                      {BEDROCK_MODELS[model as keyof typeof BEDROCK_MODELS]?.name || model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            {(filterStatus || filterModel) && (
              <Button variant="outline" onClick={() => {
                setFilterStatus('');
                setFilterModel('');
              }}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
            <DrawerClose asChild>
              <Button className="bg-indigo-500 text-white hover:bg-indigo-600">
                Apply
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {loading ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Active</h2>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : filteredAndSortedChatbots.length === 0 ? (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="text-6xl">🤖</div>
            <h3 className="text-xl font-semibold">{chatbots.length === 0 ? 'No Chatbots Yet' : 'No Chatbots Found'}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {chatbots.length === 0 ? 'Create your first chatbot to start engaging with your website visitors.' : 'Try adjusting your search.'}
            </p>
            {chatbots.length === 0 && (
              <Button 
                onClick={() => setAddDrawerOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Chatbot
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active</h2>
          <div className="space-y-2">
            {filteredAndSortedChatbots.map((chatbot: Chatbot) => (
              <div 
                key={chatbot.id} 
                className="bg-slate-100 dark:bg-slate-800/30 border-l-4 border-slate-400 dark:border-slate-600 p-4 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => router.push(`/chatbots/${chatbot.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">{chatbot.name}</span>
                    </div>
                    {chatbot.description && (
                      <p className="text-sm text-muted-foreground">
                        {chatbot.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {BEDROCK_MODELS[chatbot.model as keyof typeof BEDROCK_MODELS]?.name || chatbot.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(chatbot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge className="capitalize bg-slate-600 text-white hover:bg-slate-700">
                    {chatbot.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
