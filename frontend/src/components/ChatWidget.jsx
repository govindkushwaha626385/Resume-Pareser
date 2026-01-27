import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, User } from 'lucide-react';

const ChatWidget = ({ candidateId, candidateName }) => {
    // --- State Management ---
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Persistent Chat History for the specific candidate
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(`chat_${candidateId}`);
        return saved ? JSON.parse(saved) : [
            {
                role: 'assistant',
                text: `Hi! I've analyzed ${candidateName}'s resume. Ask me anything about their skills, experience, or potential fit for the role!`
            }
        ];
    });

    const messagesEndRef = useRef(null);

    const suggestedQuestions = [
        // --- General Analysis ---
        "Summarize their career progression.",
        "What are their core technical skills?",
        "List their most significant projects.",

        // --- Professional Fit ---
        "Is this candidate suitable for a Senior role?",
        "What are the potential red flags in this resume?",
        "What specific interview questions should I ask them?",
        "How does their experience align with a Frontend Lead position?"
    ];

    // --- Effects ---
    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // Save chat history to local storage
        localStorage.setItem(`chat_${candidateId}`, JSON.stringify(messages));
    }, [messages, isOpen, candidateId]);

    // --- Handlers ---
    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        const userMessage = { role: 'user', text: userText };

        // Optimistic UI update
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            // This hits your backend /chat endpoint which uses LangChain/Ollama
            const response = await axios.post('http://localhost:8080/hr/resume/chat', {
                candidateId: candidateId, // Matches your 'text' ID in Supabase
                question: userText
            });

            const botMessage = {
                role: 'assistant',
                text: response.data.answer || "I've processed the profile but couldn't generate a specific answer. Could you rephrase?"
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage = error.response?.data?.error || "I'm having trouble connecting to the intelligence engine. Please try again in a moment.";
            setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end font-sans no-print">

            {/* --- Chat Window --- */}
            <div className={`
                transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) origin-bottom-right
                ${isOpen
                    ? 'scale-100 opacity-100 translate-y-0'
                    : 'scale-90 opacity-0 translate-y-12 pointer-events-none'
                }
                mb-4 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-500/20 border border-slate-200 overflow-hidden flex flex-col
                w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[80vh]
            `}>

                {/* 1. Header */}
                <div className="bg-slate-900 p-5 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full -mr-10 -mt-10 blur-3xl"></div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">AI Resume Insights</h3>
                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Context: {candidateName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="hover:bg-white/10 p-2 rounded-xl transition-all group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all" />
                    </button>
                </div>

                {/* 2. Messages Area */}
                <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-6">

                    <div className="flex flex-wrap gap-2 mb-4 px-2 no-print">
                        {suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setInputValue(q);
                                    // Optional: Automatically send it
                                    // sendMessage(); 
                                }}
                                className="text-[10px] font-bold py-1.5 px-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-500`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                                    ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-slate-200'}
                                `}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div className={`
                                    px-4 py-3 text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none'
                                    }
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzing Intelligence...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 3. Input Area */}
                <div className="p-5 bg-white border-t border-slate-100">
                    <div className="flex gap-2 items-center bg-slate-100 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <input
                            type="text"
                            placeholder="Ask about skills or fit..."
                            className="flex-1 px-4 py-2 bg-transparent border-none text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 flex items-center justify-center"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Floating Toggle Button --- */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-500 group
                    ${isOpen
                        ? 'bg-slate-900 text-white scale-90'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-500/40'
                    }
                `}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <div className="relative">
                            <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>
                        <span className="font-bold text-sm">Review Intelligence</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;