import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Copy, Check, User, MessageSquare, Plus, Trash2, History, Share2, Pencil } from 'lucide-react';
import { polyGlobalService } from '../services/polyllm';
import { SqlEditor } from './SqlEditor';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

interface AIAssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'model';
    content: string; // DB uses content, PolyLLM uses text (we'll map)
}

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
    const { user, targetSessionId, setTargetSessionId, showToast, incrementSharedSessionVersion } = useAppStore();

    // Session State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // UI State
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Load Sessions on Mount / User Change
    useEffect(() => {
        if (isOpen && user?.email) {
            loadSessions();
        }
    }, [isOpen, user?.email]);

    const loadSessions = async () => {
        if (!user?.email) return;
        try {
            const data = await api.getSessions(user.email);
            setSessions(data);
        } catch (error) {
            console.error("Failed to load sessions:", error);
        }
    };

    // Watch External Target Session
    useEffect(() => {
        if (targetSessionId) {
            setCurrentSessionId(targetSessionId);
            setTargetSessionId(null);
        }
    }, [targetSessionId, setTargetSessionId]);

    const handleEditTitle = async (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
        e.stopPropagation();
        const newTitle = prompt("Edit Chat Title:", currentTitle);
        if (!newTitle || newTitle === currentTitle) return;

        try {
            await api.updateSessionTitle(sessionId, newTitle);
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
            incrementSharedSessionVersion();
        } catch (error) {
            console.error(error);
            showToast("Failed to update title", "error");
        }
    };

    const handleShare = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm('Share this chat to the main dashboard?')) return;
        try {
            await api.shareSession(sessionId);
            incrementSharedSessionVersion();
            showToast('Chat shared successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to share chat.', 'error');
        }
    };

    // 2. Load Messages when Session Changes
    useEffect(() => {
        async function loadMessages() {
            if (!currentSessionId) {
                setMessages([]);
                setIsReadOnly(false);
                return;
            }
            try {
                const [msgs, sessionData] = await Promise.all([
                    api.getChatMessages(currentSessionId),
                    api.getSession(currentSessionId)
                ]);
                setMessages(msgs);

                if (sessionData && user?.email && sessionData.user_email !== user.email) {
                    setIsReadOnly(true);
                } else {
                    setIsReadOnly(false);
                }
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        }
        loadMessages();
    }, [currentSessionId, user?.email]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isLoading]);

    // Handlers
    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setInput('');
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            await api.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        if (!user?.email) return;

        const userInput = input;
        const userMsg: ChatMessage = { role: 'user', content: userInput };

        setInput('');
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            let sessionId = currentSessionId;
            let isNew = false;

            // 1. Create Session if needed
            if (!sessionId) {
                const title = userInput.slice(0, 30) + (userInput.length > 30 ? '...' : '');
                const session = await api.createSession(user.email, title);
                sessionId = session.id;
                setCurrentSessionId(sessionId);
                isNew = true;
            }

            // 2. Save User Message
            await api.addChatMessage(sessionId!, 'user', userInput);

            // 3. Update Session List
            if (isNew) {
                loadSessions();
            }

            // 4. Call AI
            // Map messages for service (needs 'text' property)
            // Service expects { role: 'user'|'model', text: string }
            const historyForAi = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : m.role,
                text: m.content
            }));

            const replyText = await polyGlobalService.generateResponse(userInput, historyForAi as any[]);

            // 5. Save AI Message
            await api.addChatMessage(sessionId!, 'assistant', replyText);

            // 6. Update UI
            setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);

        } catch (error: any) {
            console.error("PolyLLM Error:", error);
            const errorMessage = error?.message || "Unknown error occurred.";
            setMessages(prev => [...prev, { role: 'assistant', content: `Connection Failed: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (text: string) => {
        if (!text) return null;
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
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[1000px] bg-[#1a1b26] border-l border-slate-700 shadow-2xl transform transition-transform duration-300 z-[60] flex ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Chat Area (Left/Main) */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-slate-700">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-700 flex items-center justify-between px-4 bg-[#16161e] flex-shrink-0">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-bold tracking-wide">AI Query Assistant</span>
                        </div>

                        {/* Mobile close button could go here */}
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#1a1b26]">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-50 select-none">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Bot className="w-8 h-8 text-cyan-400" />
                                </div>
                                <p className="text-sm text-center">
                                    Ask me anything about your data.<br />PolyLLM is ready to help!
                                </p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-emerald-600'}`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                </div>
                                <div className={`max-w-[85%] rounded-lg px-4 py-3 text-slate-200 ${msg.role === 'user' ? 'bg-cyan-900/30 border border-cyan-800/50' : 'bg-slate-800 border border-slate-700'}`}>
                                    {renderMessageContent(msg.content)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-600/50 flex items-center justify-center animate-pulse">
                                    <Bot className="w-5 h-5 text-white/50" />
                                </div>
                                <div className="bg-slate-800/50 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-slate-400">
                                    <span>Thinking...</span>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-[#16161e] border-t border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-[#0f1016] border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-cyan-500 transition-all">
                            <textarea
                                rows={1}
                                disabled={isReadOnly}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        if (e.nativeEvent.isComposing) return;
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isReadOnly ? "Read Only Mode (Shared)" : "Describe the query you need..."}
                                className="flex-1 bg-transparent border-none text-sm text-slate-200 focus:ring-0 focus:outline-none resize-none max-h-32 min-h-[40px] py-2.5 custom-scrollbar placeholder:text-slate-500"
                                style={{ lineHeight: '1.5' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim() || isReadOnly}
                                className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md transition-colors flex-shrink-0 shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right/History) */}
                <div className="w-80 bg-[#13141f] flex flex-col flex-shrink-0">
                    <div className="h-16 border-b border-slate-700 flex items-center justify-between px-4 bg-[#0f1016] flex-shrink-0">
                        <span className="text-slate-400 font-medium text-sm flex items-center gap-2">
                            <History className="w-4 h-4" /> History
                        </span>
                        <button onClick={onClose} className="sm:hidden p-1 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="hidden sm:block p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-3">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Chat
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setCurrentSessionId(session.id)}
                                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id
                                    ? 'bg-slate-800 text-cyan-400'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate leading-tight">
                                        {session.title || 'Untitled Chat'}
                                    </p>
                                    <p className="text-[10px] opacity-50 truncate">
                                        {new Date(session.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleEditTitle(e, session.id, session.title)}
                                    className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                                    title="Edit Title"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => handleShare(e, session.id)}
                                    className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                                    title="Share to Dashboard"
                                >
                                    <Share2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center py-8 text-slate-600 text-xs">
                                No history yet
                            </div>
                        )}
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
