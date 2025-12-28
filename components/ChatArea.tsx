
import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, ChartDataPoint, UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ChatAreaProps {
  messages: Message[];
  userProfile: UserProfile;
  theme: 'light' | 'dark';
  onSendMessage: (text: string, mode: 'chat' | 'image' | 'analysis', attachments?: string[]) => void;
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void;
  onToggleTheme: () => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  isProcessing: boolean;
  showProfileModal: boolean;
  onCloseProfileModal: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TEMPLATES = {
  chat: [
    { label: 'Explain Quantum Computing', text: 'Explain quantum computing to me like I am five years old.' },
    { label: 'Summarize Text', text: 'Please summarize the following text for me: [Paste text here]' },
  ],
  image: [
    { label: 'Cyberpunk City', text: 'A cinematic shot of a neon-drenched cyberpunk city in the rain, 8k resolution.' },
    { label: 'Ghibli Style', text: 'A peaceful cottage in the mountains, Studio Ghibli art style, high detail.' },
  ],
  analysis: [
    { label: 'Tech Stocks', text: 'Compare the stock growth of Apple, Microsoft, and NVIDIA over the last 5 years.' },
    { label: 'Global Warming', text: 'Visualize the average global temperature rise from 1900 to 2024.' },
  ]
};

const ProfileModal: React.FC<{ 
  userProfile: UserProfile; 
  onClose: () => void; 
  onUpdate: (p: Partial<UserProfile>) => void;
}> = ({ userProfile, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onUpdate({ avatarUrl: dataUrl });
        stopCamera();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Settings</h2>
            <button onClick={() => { stopCamera(); onClose(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                  {userProfile.displayName.charAt(0)}
                </div>
              )}
              <button 
                onClick={startCamera}
                className="absolute bottom-0 right-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform shadow-lg"
              >
                <i className="fa-solid fa-camera text-xs"></i>
              </button>
            </div>

            {isCapturing && (
              <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                <video ref={videoRef} className="w-full rounded-xl bg-black aspect-video object-cover" />
                <div className="flex gap-2">
                  <button onClick={capturePhoto} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Capture</button>
                  <button onClick={stopCamera} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancel</button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <div className="w-full space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => onUpdate({ displayName })}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button onClick={() => { stopCamera(); onClose(); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20">Done</button>
        </div>
      </div>
    </div>
  );
};

const ThinkingAnimation: React.FC = () => {
  const [status, setStatus] = useState("Parsing request...");
  
  useEffect(() => {
    const statuses = [
      "Parsing request...",
      "Analyzing intent...",
      "Gathering relevant insights...",
      "Synthesizing response...",
      "Formatting findings..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % statuses.length;
      setStatus(statuses[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 py-2 w-full max-w-sm">
      <div className="flex items-center gap-2">
        <div className="relative w-5 h-5">
           <div className="absolute inset-0 border-2 border-blue-200 dark:border-slate-800 rounded-full"></div>
           <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">{status}</span>
      </div>
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 thinking-progress rounded-full"></div>
      </div>
    </div>
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  userProfile,
  theme,
  onSendMessage, 
  onFeedback, 
  onToggleTheme,
  onUpdateProfile,
  isProcessing,
  showProfileModal,
  onCloseProfileModal
}) => {
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'chat' | 'image' | 'analysis'>('chat');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const scrollToBottom = useCallback((force = false) => {
    if (scrollRef.current && (force || !userHasScrolledUp)) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [userHasScrolledUp]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing, scrollToBottom]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserHasScrolledUp(!atBottom);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue, mode, attachments);
      setInputValue('');
      setAttachments([]);
      setUserHasScrolledUp(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + ' ' + transcript);
    };
    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAttachments(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    });
  };

  const renderChart = (data: ChartDataPoint[], type: string) => {
    const chartColor = theme === 'dark' ? '#3b82f6' : '#3b82f6';
    const axisColor = theme === 'dark' ? '#475569' : '#94a3b8';

    if (type === 'pie') {
      return (
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name }) => name}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'line') {
      return (
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={{ r: 4, fill: chartColor }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return (
      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
            <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 dark:bg-blue-900 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 dark:bg-purple-900 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 glass-effect flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <i className="fa-solid fa-sparkles text-sm"></i>
          </div>
          <h1 className="font-bold text-slate-800 dark:text-white tracking-tight">Gemini Nexus</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['chat', 'image', 'analysis'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  mode === m 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button 
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            {theme === 'light' ? <i className="fa-solid fa-moon"></i> : <i className="fa-solid fa-sun"></i>}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 z-10"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 animate-pulse">
              <i className="fa-solid fa-wand-magic-sparkles text-4xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome, {userProfile.displayName}</h2>
              <p className="text-slate-500 dark:text-slate-400">How can I assist you in your journey today?</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] sm:max-w-[70%] group`}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-500 text-right w-full' : 'text-slate-400 dark:text-slate-500'}`}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              
              <div className={`p-5 rounded-2xl shadow-sm relative ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}>
                {msg.content.text && (
                  <div className={`whitespace-pre-wrap leading-relaxed text-sm markdown-content ${msg.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content.text}</ReactMarkdown>
                    ) : (
                      msg.content.text
                    )}
                  </div>
                )}
                
                {msg.content.attachments && msg.content.attachments.length > 0 && (
                   <div className="flex gap-2 mt-3 flex-wrap">
                      {msg.content.attachments.map((att, i) => (
                        <img key={i} src={att} className="w-16 h-16 object-cover rounded-lg border border-white/20 shadow-md" alt="Attachment" />
                      ))}
                   </div>
                )}

                {msg.content.image && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <img src={msg.content.image} alt="Generated" className="w-full h-auto object-cover max-h-[400px]" />
                    <div className="p-3 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Generated Artwork</span>
                      <a href={msg.content.image} download="gemini-nexus-art.png" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold">
                        <i className="fa-solid fa-download mr-1"></i> Save
                      </a>
                    </div>
                  </div>
                )}

                {msg.content.chartData && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Insights</span>
                      <i className="fa-solid fa-chart-simple text-blue-500"></i>
                    </div>
                    {renderChart(msg.content.chartData, msg.content.chartType || 'bar')}
                  </div>
                )}

                {msg.isLoading && (
                  <ThinkingAnimation />
                )}

                {/* Feedback Icons & Copy */}
                {msg.role === 'assistant' && !msg.isLoading && (
                  <div className="absolute -bottom-7 left-0 flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onFeedback(msg.id, 'up')}
                        className={`text-xs hover:text-blue-600 transition-colors ${msg.feedback === 'up' ? 'text-blue-600' : 'text-slate-400'}`}
                        title="Good Response"
                      >
                        <i className="fa-regular fa-thumbs-up"></i>
                      </button>
                      <button 
                        onClick={() => onFeedback(msg.id, 'down')}
                        className={`text-xs hover:text-red-600 transition-colors ${msg.feedback === 'down' ? 'text-red-600' : 'text-slate-400'}`}
                        title="Bad Response"
                      >
                        <i className="fa-regular fa-thumbs-down"></i>
                      </button>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                    <button 
                      onClick={() => copyToClipboard(msg.content.text || '')}
                      className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                      title="Copy to Clipboard"
                    >
                      <i className="fa-regular fa-copy"></i>
                      <span className="text-[10px] font-medium uppercase tracking-tight">Copy</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-1 px-1 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}

        {userHasScrolledUp && (
          <button 
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all animate-bounce flex items-center gap-2 z-[60] text-sm font-medium"
          >
            <i className="fa-solid fa-arrow-down"></i>
            New Messages
          </button>
        )}
      </div>

      {/* Input Section */}
      <div className="p-6 pt-2 shrink-0 z-10">
        <div className="max-w-4xl mx-auto">
          {/* Templates */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {TEMPLATES[mode].map((tpl, i) => (
              <button
                key={i}
                onClick={() => setInputValue(tpl.text)}
                className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <div className="relative glass-effect border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
                {attachments.map((att, i) => (
                  <div key={i} className="relative group w-12 h-12 shrink-0">
                    <img src={att} className="w-full h-full object-cover rounded-lg shadow-sm" alt="Attachment Preview" />
                    <button 
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyPress}
              placeholder={
                mode === 'image' ? "Describe the image you want to create..." :
                mode === 'analysis' ? "Ask for data visualization..." :
                "Send a message..."
              }
              className="w-full py-4 pl-12 pr-28 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none max-h-[200px]"
            />
            
            <div className="absolute left-4 top-4 text-slate-400 dark:text-slate-600">
              {mode === 'chat' && <i className="fa-regular fa-message"></i>}
              {mode === 'image' && <i className="fa-regular fa-image"></i>}
              {mode === 'analysis' && <i className="fa-solid fa-chart-line"></i>}
            </div>

            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Attach Images"
              >
                <i className="fa-solid fa-paperclip"></i>
              </button>
              <button 
                onClick={startVoiceInput}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isListening ? 'bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse' : 'text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Voice Input"
              >
                <i className="fa-solid fa-microphone"></i>
              </button>
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                {isProcessing ? (
                  <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                ) : (
                  <i className="fa-solid fa-arrow-up text-xs"></i>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-3 text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-widest">
             <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-green-500 rounded-full"></div> Gemini 3 Flash</div>
             <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Smart Visualization</div>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal 
          userProfile={userProfile}
          onClose={onCloseProfileModal}
          onUpdate={onUpdateProfile}
        />
      )}
    </div>
  );
};

export default ChatArea;
