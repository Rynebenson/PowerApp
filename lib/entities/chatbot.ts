export type BedrockModel = 
  | 'claude-3-5-haiku'
  | 'claude-3-5-sonnet'
  | 'claude-3-opus'
  | 'llama-3-70b'
  | 'llama-3-8b';

export interface ChatbotEvent {
  id: string;
  description: string;
  timestamp: string;
  userId?: string;
}

export interface Chatbot {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model: BedrockModel;
  temperature: number;
  maxTokens: number;
  status: 'active' | 'inactive';
  embedCode: string;
  events: ChatbotEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotContext {
  id: string;
  chatbotId: string;
  type: 'document' | 'note' | 'url';
  content: string;
  metadata: {
    filename?: string;
    url?: string;
    title?: string;
    vectorIds?: string[];
  };
  createdAt: string;
}
