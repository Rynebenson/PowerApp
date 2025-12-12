# Widget Features & Implementation Plan

## Overview
This document outlines the complete feature set for the customer support widget, including data structures, UI/UX requirements, and implementation details.

---

## Data Structure

### Chatbot Entity
```typescript
interface Chatbot {
  pk: string;              // ORG#<org_id>
  sk: string;              // CHATBOT#<chatbot_id>
  entity_type: 'chatbot';
  chatbot_id: string;
  org_id: string;
  name: string;
  theme: ChatbotTheme;
  created_at: string;
  updated_at: string;
}

interface ChatbotTheme {
  primary_color: string;    // Default: indigo (#6366f1)
  logo_url?: string;        // Company logo for home page
  gradient_enabled: boolean; // Hero section gradient
  gradient_colors?: {
    from: string;
    to: string;
  };
}
```

### Announcement Entity
```typescript
interface Announcement {
  pk: string;              // CHATBOT#<chatbot_id>
  sk: string;              // ANNOUNCEMENT#<announcement_id>
  entity_type: 'announcement';
  announcement_id: string;
  chatbot_id: string;
  title: string;
  content: string;         // Full article content
  preview: string;         // Short preview for news page
  featured: boolean;       // Shows on home page if true
  availability_window: {
    start_date: string;     // ISO 8601
    end_date: string;       // ISO 8601
  };
  created_at: string;
  updated_at: string;
  published_at: string;
}
```

### Collection Entity
```typescript
interface Collection {
  pk: string;              // CHATBOT#<chatbot_id>
  sk: string;              // COLLECTION#<collection_id>
  entity_type: 'collection';
  collection_id: string;
  chatbot_id: string;
  title: string;
  description: string;
  order: number;           // Display order
  created_at: string;
  updated_at: string;
}
```

### Article Entity
```typescript
interface Article {
  pk: string;              // COLLECTION#<collection_id>
  sk: string;              // ARTICLE#<article_id>
  entity_type: 'article';
  article_id: string;
  collection_id: string;
  chatbot_id: string;       // For querying all articles by chatbot
  title: string;
  content: string;         // Full article content (markdown/HTML)
  order: number;           // Display order within collection
  view_count: number;       // Track popularity
  related_articles: string[]; // Array of article_ids
  created_at: string;
  updated_at: string;
}
```

### Message/Conversation Entity
```typescript
interface Conversation {
  pk: string;              // CHATBOT#<chatbot_id>
  sk: string;              // CONVERSATION#<conversation_id>
  entity_type: 'conversation';
  conversation_id: string;
  chatbot_id: string;
  user_id: string;          // End user identifier
  user_email?: string;
  user_name?: string;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  assigned_to?: string;     // Workspace user ID
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  pk: string;              // CONVERSATION#<conversation_id>
  sk: string;              // MESSAGE#<timestamp>#<message_id>
  entity_type: 'message';
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'operator' | 'ai';
  content: string;
  attachments?: MessageAttachment[];
  created_at: string;
}

interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  filename: string;
  size: number;
}
```

### Help Context Entity (RAG)
```typescript
interface HelpContext {
  pk: string;              // CHATBOT#<chatbot_id>
  sk: string;              // CONTEXT#<context_id>
  entity_type: 'help_context';
  context_id: string;
  chatbot_id: string;
  type: 'document' | 'url' | 'text';
  content: string;         // Raw content for embedding
  embedding?: number[];    // Vector embedding for RAG
  metadata: {
    source: string;
    uploaded_by: string;
    uploaded_at: string;
  };
  created_at: string;
  updated_at: string;
}
```

---

## Widget Pages

### 1. Home Page (`/`)

#### Layout
- **No standard header** - Custom hero section instead
- Company logo (top left) with gradient fade-in effect
- Greeting: "Hi [Firstname Lastname],"
- Subheading: "How can we help?"

#### Components
1. **Recent Message** (if exists)
   - Shows last conversation preview
   - Click to open conversation in /messages

2. **Latest Announcement** (if featured)
   - Shows featured announcement preview
   - Click to view full announcement

3. **Search Widget**
   - Search input field
   - On click: Navigate to /help and focus input
   - Display 3-4 most commonly asked questions
   - Questions are clickable and open article page

4. **Send Us a Message Container**
   - Call-to-action button/card
   - On click: Open new message in /messages

#### Styling
- Uses chatbot theme colors
- Gradient hero section (if enabled in theme)
- Logo from theme settings

---

### 2. Messages Page (`/messages`)

#### Default View (List)
- Shows all conversations for current user
- Each conversation shows:
  - Last message preview
  - Timestamp
  - Unread indicator (if applicable)
  - Operator name/avatar (if assigned)

#### Empty State
- Cool illustration/image
- Text: "No messages yet"
- Info about messaging support
- CTA to start first conversation

#### Conversation View
- **Header**:
  - Back button (left)
  - Operator name (center) - defaults to "Operator"
  - Close button (right)

- **Message Thread**:
  - Scrollable message history
  - User messages (right-aligned)
  - Operator/AI messages (left-aligned)
  - Timestamps
  - Image attachments displayed inline

- **Input Area**:
  - Text input field
  - Image upload button
  - Send button
  - **Nice to haves**:
    - Emoji picker
    - GIF picker
    - Text-to-speech

#### Floating Action Button
- "Send us a message" button
- Hovers above navigation
- Triggers new conversation

---

### 3. Help Page (`/help`)

#### Header
- Title: "Help Center"
- Search input (below title)
- Close button

#### Search Functionality
- Real-time search suggestions
- Shows commonly asked questions as you type
- Click suggestion to view article
- Powered by RAG/vector search

#### Collections View
- List of collections
- Each collection card shows:
  - **Title** (bold)
  - **Description** (below title)
  - **Article count** (e.g., "5 articles")
  - **Right-facing caret** (center-aligned)

#### Expanded Collection View
- Shows when collection is clicked
- **Header**: Title, description, article count
- **Article List**:
  - Each article shows title + right-facing caret
  - Click to open article page

---

### 4. Article Page (`/help/article/:id`)

#### Header
- Back button (left)
- Close button (right)
- No title in header

#### Content
1. **Article Title** (large, bold)
2. **Updated Date** (small, muted)
3. **Article Content** (markdown/HTML rendered)
4. **Related Articles** section
   - List of clickable related articles
5. **"Open in Help Center"** link (optional)

---

### 5. News Page (`/news`)

#### Tabs/Filters
- **Latest** - All announcements in availability window
- **From Workspace** - Workspace-specific announcements

#### Announcement List
- Shows announcements in reverse chronological order
- Each announcement shows:
  - Title
  - Preview text
  - Published date
  - Click to view full announcement

#### Empty State
- "You're all caught up!" message
- Shows when no announcements available

#### Availability Logic
- Only show announcements where:
  - `current_date >= availability_window.start_date`
  - `current_date <= availability_window.end_date`

---

## Chatbot Details Page (Admin)

### Overview Section
- Chatbot name (editable)
- Created date
- Last updated date

### Theme Management
- **Live Preview**: Changes update widget preview instantly
- **Primary Color Picker**: Default indigo (#6366f1)
- **Logo Upload**: Shows on widget home page
- **Gradient Settings**:
  - Toggle gradient on/off
  - Gradient color picker (from/to)
  - Preview in hero section

### Announcements Management

#### Announcement List
- Table/list of all announcements
- Columns: Title, Status, Featured, Availability, Actions

#### Create/Edit Announcement
- **Title** (required)
- **Preview Text** (required) - Shows on news page
- **Full Content** (required) - Full article view
- **Featured Toggle** - Shows on home page if enabled
- **Availability Window**:
  - Start Date/Time
  - End Date/Time
- **Status**: Draft, Published, Archived

### Messages Management (To Be Fleshed Out)

#### Current Requirements
- View all conversations
- Assign conversations to workspace users
- AI agent for automated responses
- Manual response capability for support staff

#### Future Considerations
- Conversation routing rules
- AI response confidence threshold
- Escalation workflows
- Support staff roles/permissions
- Response templates
- Conversation tags/categories

### Help Center Context Management

#### Upload Context (RAG)
- **Document Upload**:
  - PDF, DOCX, TXT support
  - Automatic text extraction
  - Vector embedding generation
  
- **URL Scraping**:
  - Input URL to scrape content
  - Automatic embedding generation
  
- **Manual Text Entry**:
  - Direct text input for context

#### Context List
- Shows all uploaded context
- Columns: Type, Source, Uploaded Date, Actions
- Delete/edit functionality

### Collections Management

#### Collection List
- Drag-and-drop reordering
- Each collection shows:
  - Title
  - Description
  - Article count
  - Edit/Delete actions

#### Create/Edit Collection
- **Title** (required)
- **Description** (required)
- **Order** (auto-assigned, manually adjustable)

#### Article Management (within Collection)
- List of articles in collection
- Drag-and-drop reordering
- Create/Edit/Delete articles

#### Create/Edit Article
- **Title** (required)
- **Content** (rich text editor)
- **Collection** (dropdown)
- **Related Articles** (multi-select)
- **Order** (auto-assigned, manually adjustable)

---

## Implementation Phases

### Phase 1: Data Layer
- [ ] Create entity type definitions in `lib/entities/`
- [ ] Create DynamoDB helpers in `lib/dynamo/`
- [ ] Set up GSIs for querying patterns

### Phase 2: Widget Core Pages
- [ ] Home page with theme support
- [ ] Help page with collections/articles
- [ ] Article page
- [ ] News page with announcements

### Phase 3: Messages
- [ ] Conversation list view
- [ ] Conversation thread view
- [ ] Message input with image upload
- [ ] Real-time message updates

### Phase 4: Admin - Chatbot Details
- [ ] Theme editor with live preview
- [ ] Announcement CRUD
- [ ] Collection CRUD
- [ ] Article CRUD

### Phase 5: RAG & Search
- [ ] Context upload functionality
- [ ] Vector embedding generation
- [ ] Search implementation
- [ ] Commonly asked questions algorithm

### Phase 6: Messages Admin & AI
- [ ] Conversation management dashboard
- [ ] Assignment system
- [ ] AI agent integration
- [ ] Support staff interface

### Phase 7: Nice-to-Haves
- [ ] Emoji picker
- [ ] GIF picker
- [ ] Text-to-speech
- [ ] Analytics dashboard
- [ ] Conversation exports

---

## Technical Considerations

### Real-time Updates
- WebSocket connection for live messages
- Polling fallback for announcements/articles

### File Storage
- S3 for logo uploads
- S3 for message attachments
- CloudFront for CDN

### Search & RAG
- OpenSearch or Pinecone for vector search
- OpenAI/Bedrock for embeddings
- Semantic search for help articles

### Performance
- Cache frequently accessed articles
- Lazy load conversation history
- Optimize image uploads (compression, thumbnails)

### Security
- Validate file uploads (type, size)
- Sanitize user input
- Rate limiting on messages
- CORS configuration for widget embed

---

## API Endpoints Needed

### Chatbot
- `GET /chatbots/:id` - Get chatbot details
- `PUT /chatbots/:id` - Update chatbot
- `PUT /chatbots/:id/theme` - Update theme

### Announcements
- `GET /chatbots/:id/announcements` - List announcements
- `POST /chatbots/:id/announcements` - Create announcement
- `PUT /announcements/:id` - Update announcement
- `DELETE /announcements/:id` - Delete announcement

### Collections & Articles
- `GET /chatbots/:id/collections` - List collections
- `POST /chatbots/:id/collections` - Create collection
- `PUT /collections/:id` - Update collection
- `DELETE /collections/:id` - Delete collection
- `GET /collections/:id/articles` - List articles in collection
- `POST /collections/:id/articles` - Create article
- `PUT /articles/:id` - Update article
- `DELETE /articles/:id` - Delete article

### Messages
- `GET /chatbots/:id/conversations` - List conversations
- `POST /chatbots/:id/conversations` - Create conversation
- `GET /conversations/:id/messages` - Get messages
- `POST /conversations/:id/messages` - Send message
- `PUT /conversations/:id/assign` - Assign conversation

### Help Context
- `POST /chatbots/:id/context` - Upload context
- `GET /chatbots/:id/context` - List context
- `DELETE /context/:id` - Delete context

### Search
- `GET /chatbots/:id/search?q=query` - Search articles
- `GET /chatbots/:id/popular-questions` - Get popular questions

---

## Notes & Open Questions

1. **Message Assignment Logic**: How should AI vs human routing work?
2. **Conversation Persistence**: How long to keep closed conversations?
3. **User Authentication**: How to identify widget users (email, anonymous, etc.)?
4. **Embedding Model**: Which service for RAG (OpenAI, Bedrock, custom)?
5. **Widget Embedding**: How will customers embed widget on their sites?
6. **Multi-language Support**: Future consideration?
7. **Analytics**: What metrics to track?
