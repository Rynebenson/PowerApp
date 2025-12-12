'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Send, X, MessageCircle } from 'lucide-react';
import { PiHouseLine, PiHouseLineFill, PiChatCircleDots, PiChatCircleDotsFill, PiQuestion, PiQuestionFill, PiMegaphone, PiMegaphoneFill } from 'react-icons/pi';
import { TbHeadset } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatPreviewProps {
  chatbotId: string;
  chatbotName: string;
}

type Tab = 'home' | 'messages' | 'help' | 'news';

export default function ChatPreview({ chatbotId, chatbotName }: ChatPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${chatbotId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: input,
            sessionId: 'preview-session',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Preview Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 md:bottom-6 bottom-24 right-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full px-6 py-3 flex items-center gap-2 shadow-lg z-[9997] hover:scale-105 transition-transform"
      >
        <TbHeadset className="w-6 h-6 text-white" />
        <span className="text-base font-semibold text-white">Preview</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[650px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl flex flex-col z-[9999] overflow-hidden transition-all duration-300 ease-out origin-bottom-right scale-0 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100" data-state="open">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-5 flex items-center justify-between shadow-md">
              <div className="flex-1 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {activeTab === 'home' && 'Chat Support'}
                  {activeTab === 'messages' && 'Messages'}
                  {activeTab === 'help' && 'Help'}
                  {activeTab === 'news' && 'News'}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {/* Home Tab */}
              {activeTab === 'home' && (
                <div className="h-full flex items-center justify-center p-8 bg-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <PiHouseLineFill className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-[15px] font-medium text-gray-900 mb-1">Welcome Home!</div>
                    <div className="text-xs text-gray-500">Your dashboard overview</div>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-[15px] font-medium text-gray-900 mb-1">Welcome!</div>
                        <div className="text-xs text-gray-500">Ask me anything to get started</div>
                      </div>
                    )}
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                              : 'bg-gray-50 text-gray-900 rounded-bl-sm border border-gray-200'
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {msg.role === 'assistant' ? (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                              msg.content
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-5 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        disabled={loading}
                        className="flex-1 rounded-full border-2 focus:border-indigo-500 bg-gray-50"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Tab */}
              {activeTab === 'help' && (
                <div className="h-full flex items-center justify-center p-8 bg-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <PiQuestionFill className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-[15px] font-medium text-gray-900 mb-1">Help Center</div>
                    <div className="text-xs text-gray-500">Find answers to common questions</div>
                  </div>
                </div>
              )}

              {/* News Tab */}
              {activeTab === 'news' && (
                <div className="h-full flex items-center justify-center p-8 bg-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <PiMegaphoneFill className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-[15px] font-medium text-gray-900 mb-1">Latest News</div>
                    <div className="text-xs text-gray-500">Stay updated with announcements</div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'home'
                    ? 'text-indigo-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {activeTab === 'home' ? <PiHouseLineFill className="w-7 h-7" /> : <PiHouseLine className="w-7 h-7" />}
                <span className="text-xs font-medium">Home</span>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'messages'
                    ? 'text-indigo-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {activeTab === 'messages' ? <PiChatCircleDotsFill className="w-7 h-7" /> : <PiChatCircleDots className="w-7 h-7" />}
                <span className="text-xs font-medium">Messages</span>
              </button>
              <button
                onClick={() => setActiveTab('help')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'help'
                    ? 'text-indigo-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {activeTab === 'help' ? <PiQuestionFill className="w-7 h-7" /> : <PiQuestion className="w-7 h-7" />}
                <span className="text-xs font-medium">Help</span>
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'news'
                    ? 'text-indigo-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {activeTab === 'news' ? <PiMegaphoneFill className="w-7 h-7" /> : <PiMegaphone className="w-7 h-7" />}
                <span className="text-xs font-medium">News</span>
              </button>
            </div>
          </div>
      )}
    </>
  );
}
