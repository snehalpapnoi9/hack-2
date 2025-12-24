
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold 
          ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        <div className={`relative px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
          {message.content}
          
          <div className={`text-[10px] mt-1 opacity-70 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(message.timestamp)}
            {message.status === 'sending' && <span className="ml-1 italic">...</span>}
            {message.status === 'error' && <span className="ml-1 text-red-300"><i className="fas fa-exclamation-circle"></i></span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
