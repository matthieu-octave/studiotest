import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Sparkles, AlertCircle, Copy, Check, FileCode, Cpu, Lightbulb, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';

const INITIAL_CONVERSATION: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: "Hello! I am your Express-powered **Gemini Engineering Co-Pilot**. I am connected directly to **gemini-3.5-flash** on the server. Select one of the presets below to jumpstart an engineering brainstorm, or type your custom instruction directly.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
];

const PROMPT_PRESETS = [
  {
    label: "Draft System Design",
    icon: Cpu,
    prompt: "Draft a modern system architectural design document for a high-traffic, real-time message board using Node.js, WebSockets, and Firestore. Include database schema, backend flow, scalability bottlenecks, and data hydration strategies.",
  },
  {
    label: "Refactor TS Hook",
    icon: FileCode,
    prompt: "Write a complete custom React TypeScript hook 'useLocalStorage' that supports type safety, SSR window checks, event-synchronized tabs (so multiple tabs update the same state synchronously), and error boundaries.",
  },
  {
    label: "Creative Mock JSON",
    icon: Lightbulb,
    prompt: "Generate a mocked, deeply nested JSON structure for a complex project management board. Include cards, projects, sprint metadata, tag colors, historical task logs, and a realistic team mapping.",
  }
];

interface GeminiBrainstormProps {
  injectedPrompt?: string;
  onClearInjection?: () => void;
}

export default function GeminiBrainstorm({ injectedPrompt, onClearInjection }: GeminiBrainstormProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CONVERSATION);
  const [inputValue, setInputValue] = useState('');

  // Handle cross-module prompts injection
  useEffect(() => {
    if (injectedPrompt) {
      setInputValue(injectedPrompt);
      if (onClearInjection) {
        onClearInjection();
      }
    }
  }, [injectedPrompt]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelType, setModelType] = useState<string>('gemini-3.5-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    setErrorMessage(null);
    const userMessageId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    // Create container message for the incoming assistant response
    const assistantMessageId = `msg-assistant-${Date.now()}`;
    const assistantMsgPlaceholder: ChatMessage = {
      id: assistantMessageId,
      sender: 'assistant',
      text: '', // start with blank, or loading status
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          model: modelType,
          systemInstruction: "You are a professional, helpful, system-architect and senior engineering mentor. Always respond with highly scannable formatting, using markdown code blocks with correct syntax tags, elegant bold subheadings, and clear bullet points. Keep it authoritative yet humble and direct. Avoid starting responses with polite fillers."
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      // Update the placeholder with real generated response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: data.text }
            : msg
        )
      );
    } catch (error: any) {
      console.error("Co-Pilot generation failure:", error);
      const errorText = error.message || "Endpoint error occurred.";
      setErrorMessage(errorText);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMessageId)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages(INITIAL_CONVERSATION);
    setErrorMessage(null);
  };

  // Basic regex markdown syntax renderer to keep our app incredibly reliable
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // Split text by triple code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // extract language and code code block
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : 'code';
        const code = match ? match[2] : part.slice(3, -3);
        
        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-zinc-200">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center justify-between text-[11px] font-mono font-medium text-zinc-500">
              <span className="uppercase">{language || 'code'}</span>
              <button
                onClick={() => handleCopyText(code, `${index}-code`)}
                className="hover:text-zinc-950 flex items-center space-x-1 cursor-pointer"
              >
                {copiedId === `${index}-code` ? (
                  <>
                    <Check size={11} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto leading-relaxed select-text">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }

      // Inline strong tag rendering (`**foo**`), line breaks
      const paragraphs = part.split('\n');
      return paragraphs.map((para, pIdx) => {
        if (!para.trim()) return <div key={`p-${pIdx}`} className="h-2" />;
        
        // Highlight bullet list lines
        const isBullet = para.trim().startsWith('-') || para.trim().startsWith('*');
        const listText = isBullet ? para.trim().substring(1).trim() : para;

        // Simple renderer for bold annotations
        const renderInlineStyles = (txt: string) => {
          const boldParts = txt.split(/(\*\*.*?\*\*)/g);
          return boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return <strong key={bIdx} className="font-semibold text-zinc-900">{bPart.slice(2, -2)}</strong>;
            }
            return bPart;
          });
        };

        if (isBullet) {
          return (
            <li key={`li-${pIdx}`} className="ml-4 list-disc text-sm text-zinc-700 leading-relaxed mb-1 font-sans">
              {renderInlineStyles(listText)}
            </li>
          );
        }

        return (
          <p key={`p-${pIdx}`} className="text-sm text-zinc-700 leading-relaxed mb-3 font-sans">
            {renderInlineStyles(para)}
          </p>
        );
      });
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-zinc-100 flex flex-col h-full shadow-xs">
      {/* Header Segment */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-50">
        <div className="flex items-center space-x-2.5">
          <div className="bg-zinc-950 p-2 rounded-xl text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-sm text-zinc-900 leading-none flex items-center">
              Gemini Co-Pilot Sandbox
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 mt-1 block">
              MODEL: {modelType}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Clear */}
          <button
            id="btn-clear-chat"
            onClick={handleClearChat}
            className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-hidden"
            title="Clear Chat Logs"
          >
            <RefreshCw size={14} />
          </button>
          
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            Secure Server-Side Proxied
          </span>
        </div>
      </div>

      {/* Preset Prompts Block */}
      <div className="mb-4">
        <span className="font-sans font-medium text-[10px] text-zinc-400 uppercase tracking-wider block mb-2">
          Preset Brainstorm Templates
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {PROMPT_PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                id={`btn-preset-prompt-${idx}`}
                onClick={() => handleSendMessage(preset.prompt)}
                disabled={isGenerating}
                className="flex items-center space-x-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 text-left rounded-xl transition-all cursor-pointer border border-transparent hover:border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-hidden"
              >
                <div className="bg-white p-1.5 rounded-lg border border-zinc-100 text-zinc-700 group-hover:text-zinc-950 shadow-2xs">
                  <Icon size={13} />
                </div>
                <span className="text-xs font-sans font-medium text-zinc-700 leading-tight">
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Output Thread */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-100 max-h-[360px] min-h-[160px] bg-zinc-50 rounded-2xl p-4 border border-zinc-100/50">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${
                message.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-2xs relative select-text ${
                  message.sender === 'user'
                    ? 'bg-zinc-900 text-white rounded-br-xs'
                    : 'bg-white text-zinc-800 border border-zinc-100 rounded-bl-xs'
                }`}
              >
                {/* Copy complete message option */}
                {message.sender === 'assistant' && message.text && (
                  <button
                    onClick={() => handleCopyText(message.text, message.id)}
                    className="absolute top-2 right-2 text-zinc-300 hover:text-zinc-600 transition-colors focus:outline-hidden"
                    title="Copy full response"
                  >
                    {copiedId === message.id ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}

                <div className={`whitespace-pre-wrap select-text pr-4 ${message.sender === 'user' ? 'text-zinc-200 text-sm' : ''}`}>
                  {message.sender === 'user' ? (
                    message.text
                  ) : message.text ? (
                    renderMarkdown(message.text)
                  ) : (
                    <div className="flex items-center space-x-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce delay-150" />
                    </div>
                  )}
                </div>

                <div
                  className={`text-[9px] mt-1.5 block ${
                    message.sender === 'user' ? 'text-zinc-400 text-right' : 'text-zinc-400'
                  }`}
                >
                  {message.timestamp}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Error notification display */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start space-x-2 text-red-800 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold block">Co-Pilot Call Failed</span>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Input controls form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="flex items-center space-x-2"
      >
        <input
          id="input-copilot-prompt"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isGenerating ? "Co-Pilot is typing..." : "Type custom engineering prompt or idea brainstorm..."}
          disabled={isGenerating}
          className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-300 focus:bg-white transition-all focus:ring-1 focus:ring-zinc-200"
        />
        <button
          id="btn-send-prompt"
          type="submit"
          disabled={!inputValue.trim() || isGenerating}
          className="bg-zinc-950 hover:bg-zinc-805 text-white p-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-hidden"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
