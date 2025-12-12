export interface ChatbotTheme {
  primary_color: string;
  logo_url?: string;
  gradient_enabled: boolean;
  gradient_colors?: {
    from: string;
    to: string;
  };
}

export interface Chatbot {
  pk: string; // ORG#<org_id>
  sk: string; // CHATBOT#<chatbot_id>
  entity_type: 'chatbot';
  chatbot_id: string;
  org_id: string;
  name: string;
  theme: ChatbotTheme;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  pk: string; // CHATBOT#<chatbot_id>
  sk: string; // ANNOUNCEMENT#<announcement_id>
  entity_type: 'announcement';
  announcement_id: string;
  chatbot_id: string;
  title: string;
  content: string;
  preview: string;
  featured: boolean;
  availability_window: {
    start_date: string;
    end_date: string;
  };
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface Collection {
  pk: string; // CHATBOT#<chatbot_id>
  sk: string; // COLLECTION#<collection_id>
  entity_type: 'collection';
  collection_id: string;
  chatbot_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Article {
  pk: string; // COLLECTION#<collection_id>
  sk: string; // ARTICLE#<article_id>
  entity_type: 'article';
  article_id: string;
  collection_id: string;
  chatbot_id: string;
  title: string;
  content: string;
  order: number;
  view_count: number;
  related_articles: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  pk: string; // CHATBOT#<chatbot_id>
  sk: string; // CONVERSATION#<conversation_id>
  entity_type: 'conversation';
  conversation_id: string;
  chatbot_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  assigned_to?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  pk: string; // CONVERSATION#<conversation_id>
  sk: string; // MESSAGE#<timestamp>#<message_id>
  entity_type: 'message';
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'operator' | 'ai';
  content: string;
  attachments?: MessageAttachment[];
  created_at: string;
}

export interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  filename: string;
  size: number;
}

export interface HelpContext {
  pk: string; // CHATBOT#<chatbot_id>
  sk: string; // CONTEXT#<context_id>
  entity_type: 'help_context';
  context_id: string;
  chatbot_id: string;
  type: 'document' | 'url' | 'text';
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    uploaded_by: string;
    uploaded_at: string;
  };
  created_at: string;
  updated_at: string;
}
