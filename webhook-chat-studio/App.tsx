
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from './types';
import { sendToWebhook } from './services/webhookService';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import { getSmartSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Fetch smart suggestions when the assistant finishes speaking
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && !isLoading) {
      const fetchSuggestions = async () => {
        const nextSuggestions = await getSmartSuggestions(messages);
        setSuggestions(nextSuggestions);
      };
      fetchSuggestions();
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setSuggestions([]); // Clear suggestions during turn
    setIsLoading(true);

    try {
      const answer = await sendToWebhook(text);
      
      setMessages(prev => 
        prev.map(m => m.id === userMessage.id ? { ...m, status: 'sent' } : m)
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      // Log technical details for developers only
      console.error('Webhook processing error:', error);
      
      // Update status to show error indicator on the user message
      setMessages(prev => 
        prev.map(m => m.id === userMessage.id ? { ...m, status: 'error' } : m)
      );
      
      // Send a graceful, user-friendly message as requested
      const gracefulErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I am unable to fetch this information right now. Please try again in a moment or check your connection.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, gracefulErrorMessage]);
      setSuggestions(["Try again", "How can you help?", "Tell me a joke"]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-robot text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none">AI Assistant</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Webhook Mode
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main 
        ref={scrollRef}
        className="flex-grow overflow-y-auto custom-scrollbar px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <i className="fas fa-spinner animate-spin text-slate-400 text-xs"></i>
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex gap-1 items-center shadow-sm">
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 mb-6 animate-in fade-in slide-in-from-bottom-1 duration-500">
              {suggestions.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(text)}
                  className="px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Input Section */}
      <InputArea onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default App;
