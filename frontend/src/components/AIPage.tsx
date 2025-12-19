'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, LogIn, Car, Bike, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';

interface AIPageProps {
  token: string | null;
  onLogin?: () => void;
}

// Common problems organized by vehicle type
const COMMON_PROBLEMS = {
  car: [
    { label: 'Change Wheels', prompt: 'How do I change car wheels? Step by step guide.' },
    { label: 'Flat Tire', prompt: 'What should I do if I have a flat tire? Emergency steps.' },
    { label: 'Battery Dead', prompt: 'My car battery is dead. How to jump start or fix it?' },
    { label: 'Engine Won\'t Start', prompt: 'My car engine won\'t start. What could be wrong?' },
    { label: 'Brake Problems', prompt: 'I have brake problems. What should I check?' },
    { label: 'Oil Change', prompt: 'How to change car oil? When and how often?' },
    { label: 'Overheating', prompt: 'My car is overheating. What should I do?' },
    { label: 'Strange Noises', prompt: 'My car is making strange noises. What could it be?' },
  ],
  motorcycle: [
    { label: 'Change Wheels', prompt: 'How to change motorcycle wheels? Step by step.' },
    { label: 'Flat Tire', prompt: 'Motorcycle flat tire. How to fix or replace?' },
    { label: 'Battery Issues', prompt: 'Motorcycle battery problems. How to fix?' },
    { label: 'Chain Problems', prompt: 'Motorcycle chain issues. How to maintain or fix?' },
    { label: 'Won\'t Start', prompt: 'My motorcycle won\'t start. Troubleshooting guide.' },
    { label: 'Brake Problems', prompt: 'Motorcycle brake issues. What to check?' },
  ],
  scooter: [
    { label: 'Change Wheels', prompt: 'How to change scooter wheels?' },
    { label: 'Battery Dead', prompt: 'Scooter battery is dead. How to charge or replace?' },
    { label: 'Won\'t Start', prompt: 'My scooter won\'t start. What to check?' },
    { label: 'Tire Problems', prompt: 'Scooter tire issues. How to fix flat tire?' },
    { label: 'Brake Issues', prompt: 'Scooter brake problems. How to fix?' },
  ],
  truck: [
    { label: 'Change Wheels', prompt: 'How to change truck wheels? Heavy vehicle guide.' },
    { label: 'Flat Tire', prompt: 'Truck flat tire. Emergency procedures.' },
    { label: 'Battery Problems', prompt: 'Truck battery issues. How to handle?' },
    { label: 'Engine Troubles', prompt: 'Truck engine problems. Common issues and fixes.' },
  ],
};

export default function AIPage({ token, onLogin }: AIPageProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant specialized in vehicle problems and road incidents. I can help you with cars, motorcycles, scooters, and light vehicles. How can I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState<keyof typeof COMMON_PROBLEMS>('car');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !token) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.askAI(token, userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Auto-send the prompt
    setTimeout(() => {
      const userMessage = prompt;
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setIsLoading(true);

      api.askAI(token!, userMessage)
        .then((response) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }]);
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` 
          }]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 100);
  };

  // Show login prompt if not authenticated
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <Bot size={48} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">AI Assistant</h2>
        <p className="text-gray-500 text-center mb-8">
          Sign in to chat with our AI assistant about vehicle problems and road incidents
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-2xl hover:bg-blue-600 transition-colors shadow-lg flex items-center gap-2"
        >
          <LogIn size={20} />
          <span>Sign In</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-700">AI Assistant</h2>
            <p className="text-xs text-gray-500">Vehicle problems & road incidents expert</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ 
          paddingBottom: showQuickActions ? '280px' : '120px' 
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <Loader2 size={20} className="text-gray-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Widget */}
      {showQuickActions && (
        <div className="sticky bg-white border-t border-gray-200 p-4 space-y-3" style={{ bottom: '100px' }}>
          {/* Vehicle Type Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedVehicleType('car')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                selectedVehicleType === 'car'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Car size={18} />
              <span className="text-sm font-medium">Car</span>
            </button>
            <button
              onClick={() => setSelectedVehicleType('motorcycle')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                selectedVehicleType === 'motorcycle'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bike size={18} />
              <span className="text-sm font-medium">Motorcycle</span>
            </button>
            <button
              onClick={() => setSelectedVehicleType('scooter')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                selectedVehicleType === 'scooter'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap size={18} />
              <span className="text-sm font-medium">Scooter</span>
            </button>
            <button
              onClick={() => setSelectedVehicleType('truck')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                selectedVehicleType === 'truck'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Car size={18} />
              <span className="text-sm font-medium">Truck</span>
            </button>
          </div>

          {/* Common Problems Buttons */}
          <div className="flex flex-wrap gap-2">
            {COMMON_PROBLEMS[selectedVehicleType].map((problem, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(problem.prompt)}
                disabled={isLoading}
                className="px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {problem.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        {/* Toggle Quick Actions */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showQuickActions ? (
              <>
                <ChevronDown size={14} />
                <span>Hide Quick Actions</span>
              </>
            ) : (
              <>
                <ChevronUp size={14} />
                <span>Show Quick Actions</span>
              </>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder:text-gray-500"
            rows={1}
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
