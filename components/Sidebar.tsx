
import React, { useState } from 'react';
import { Session, UserProfile } from '../types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  userProfile: UserProfile;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  userProfile,
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  onOpenProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => 
    (session.title || "Untitled Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
      <div className="p-4 space-y-3">
        <button 
          onClick={onNewChat}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
        >
          <i className="fa-solid fa-plus text-sm"></i>
          New Chat
        </button>
        
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
        <div className="text-xs font-semibold text-slate-500 uppercase px-3 py-2">
          {searchQuery ? "Search Results" : "Recent Chats"}
        </div>
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                activeSessionId === session.id 
                  ? 'bg-slate-800 text-white' 
                  : 'hover:bg-slate-800/50'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <i className="fa-regular fa-message text-slate-500"></i>
                <span className="truncate text-sm font-medium">{session.title || "Untitled Chat"}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-600 text-center py-4 px-3 italic">
            {searchQuery ? "No chats found" : "No recent chats"}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 px-2 py-2 hover:bg-slate-800 rounded-lg transition-colors group"
        >
          {userProfile.avatarUrl ? (
            <img src={userProfile.avatarUrl} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" alt="Avatar" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
              {userProfile.displayName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col items-start overflow-hidden flex-1">
            <span className="text-sm font-medium text-white truncate">{userProfile.displayName}</span>
            <span className="text-xs text-slate-500">View Settings</span>
          </div>
          <i className="fa-solid fa-gear text-slate-500 group-hover:text-white transition-colors"></i>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
