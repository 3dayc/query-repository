import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Copy, Check, User } from 'lucide-react';
import { geminiService, type ChatMessage } from '../services/gemini';
import { SqlEditor } from './SqlEditor';

interface AIAssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Pass recent history to the service
            const replyText = await geminiService.generateResponse(userMsg.text, messages);

            const aiMsg: ChatMessage = { role: 'model', text: replyText };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error("Gemini Error:", error);
            const errorMessage = error?.message || "Unknown error occurred.";
            setMessages(prev => [...prev, { role: 'model', text: `Connection Failed: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (text: string) => {
        // Simple parser for ```sql blocks
        const parts = text.split(/(```sql[\s\S]*?```)/g);

        return parts.map((part, idx) => {
            if (part.startsWith('```sql')) {
                const code = part.replace(/^```sql\s*/, '').replace(/```$/, '').trim();
                return (
                    <div key={idx} className="my-3 relative group">
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <CopyButton code={code} />
                        </div>
                        <div className="rounded-md overflow-hidden border border-slate-700 bg-[#1e1e1e]">
                            <SqlEditor code={code} onChange={() => { }} readOnly={true} minimal={true} />
                        </div>
                    </div>
                );
            } else {
                if (!part.trim()) return null;
                return <p key={idx} className="whitespace-pre-wrap break-words mb-2 text-sm leading-relaxed">{part}</p>;
            }
        });
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 right-0 w-full sm:w-[700px] bg-[#1a1b26] border-l border-slate-700 shadow-2xl transform transition-transform duration-300 z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="h-16 border-b border-slate-700 flex items-center justify-between px-4 bg-[#16161e] flex-shrink-0">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-bold tracking-wide">AI Query Assistant</span>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#1a1b26]">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-50 select-none">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                <Bot className="w-8 h-8 text-cyan-400" />
                            </div>
                            <p className="text-sm text-center">
                                Ask me anything about your data.<br />I can write queries for you!
                            </p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-emerald-600'}`}>
                                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-slate-200 ${msg.role === 'user' ? 'bg-cyan-900/30 border border-cyan-800/50' : 'bg-slate-800 border border-slate-700'}`}>
                                {renderMessageContent(msg.text)}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600/50 flex items-center justify-center animate-pulse">
                                <Bot className="w-5 h-5 text-white/50" />
                            </div>
                            <div className="bg-slate-800/50 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-slate-400">
                                <span>Gemini is generating SQL...</span>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#16161e] border-t border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-[#0f1016] border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    if (e.nativeEvent.isComposing) return;
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Describe the query you need..."
                            className="flex-1 bg-transparent border-none text-sm text-slate-200 focus:ring-0 focus:outline-none resize-none max-h-32 min-h-[40px] py-2.5 custom-scrollbar placeholder:text-slate-500"
                            style={{ lineHeight: '1.5' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md transition-colors flex-shrink-0 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function CopyButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded backdrop-blur-sm transition-all border border-white/10"
            title="Copy Query"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}
