
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { Session, Message, UserProfile } from './types';
import { getGeminiResponse, getStructuredAnalysis, generateImage, generateChatTitle } from './services/geminiService';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('gemini_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gemini_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('gemini_profile');
    return saved ? JSON.parse(saved) : { displayName: 'Nexus Explorer' };
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('gemini_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('gemini_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gemini_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const handleNewChat = useCallback(() => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId('');
    }
  }, [activeSessionId]);

  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, feedback } : m)
        };
      }
      return s;
    }));
  };

  const handleToggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleUpdateProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleSendMessage = async (text: string, mode: 'chat' | 'image' | 'analysis', attachments?: string[]) => {
    let currentId = activeSessionId;
    
    if (!currentId) {
      const newId = Date.now().toString();
      const newSession: Session = {
        id: newId,
        title: text.slice(0, 30) + '...',
        messages: []
      };
      setSessions([newSession]);
      setActiveSessionId(newId);
      currentId = newId;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: { text, attachments },
      timestamp: Date.now()
    };

    const assistantLoadingId = (Date.now() + 1).toString();
    const assistantLoadingMessage: Message = {
      id: assistantLoadingId,
      role: 'assistant',
      content: {},
      timestamp: Date.now() + 1,
      isLoading: true
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentId) {
        const newMessages = [...s.messages, userMessage, assistantLoadingMessage];
        return { ...s, messages: newMessages };
      }
      return s;
    }));

    setIsProcessing(true);

    try {
      let assistantContent = {};

      if (mode === 'image') {
        const imageUrl = await generateImage(text);
        assistantContent = { 
          text: imageUrl ? "Here is the image I generated for you based on your prompt." : "I was unable to generate that image.",
          image: imageUrl || undefined
        };
      } else if (mode === 'analysis') {
        const analysis = await getStructuredAnalysis(text);
        assistantContent = {
          text: analysis.text,
          chartData: analysis.chartData,
          chartType: analysis.chartType
        };
      } else {
        const session = sessions.find(s => s.id === currentId);
        const history = (session?.messages || []).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content.text || '' }]
        }));
        const responseText = await getGeminiResponse(text, history, attachments);
        assistantContent = { text: responseText };
      }

      const finalAssistantMessage: Message = {
        id: assistantLoadingId,
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
        isLoading: false
      };

      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === currentId) {
            const updatedMessages = s.messages.map(m => m.id === assistantLoadingId ? finalAssistantMessage : m);
            return { ...s, messages: updatedMessages };
          }
          return s;
        });
        
        // Refined Title Generation Logic
        const session = updated.find(s => s.id === currentId);
        if (session && session.messages.length === 2) {
          generateChatTitle(session.messages.map(m => ({ role: m.role, text: m.content.text || '' }))).then(newTitle => {
            setSessions(p => p.map(sess => sess.id === currentId ? { ...sess, title: newTitle } : sess));
          });
        } else if (session && session.messages.length > 5 && (session.title === 'New Conversation' || session.title.endsWith('...'))) {
          // Periodically update if the title looks generic
          generateChatTitle(session.messages.slice(-6).map(m => ({ role: m.role, text: m.content.text || '' }))).then(newTitle => {
            setSessions(p => p.map(sess => sess.id === currentId ? { ...sess, title: newTitle } : sess));
          });
        }
        
        return updated;
      });

    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        id: assistantLoadingId,
        role: 'assistant',
        content: { text: "Sorry, I encountered an error while processing your request. Please check your network or try again." },
        timestamp: Date.now(),
        isLoading: false
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === assistantLoadingId ? errorMessage : m)
          };
        }
        return s;
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        userProfile={userProfile}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenProfile={() => setShowProfileModal(true)}
      />
      <div className="flex-1 min-w-0">
        <ChatArea 
          messages={activeSession?.messages || []}
          userProfile={userProfile}
          theme={theme}
          onSendMessage={handleSendMessage}
          onFeedback={handleFeedback}
          onToggleTheme={handleToggleTheme}
          onUpdateProfile={handleUpdateProfile}
          isProcessing={isProcessing}
          showProfileModal={showProfileModal}
          onCloseProfileModal={() => setShowProfileModal(false)}
        />
      </div>
    </div>
  );
};

export default App;
