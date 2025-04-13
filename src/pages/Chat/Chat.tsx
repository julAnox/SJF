import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MoreVertical,
  Trash2,
  Share2,
  XCircle,
  Ban,
  Send,
  FileText,
  Briefcase,
  Download
} from 'lucide-react';
import ShareContactModal from '../../components/Modals/ShareContactModal';
import { Message } from '../../types/chat';

interface Chat {
  id: string;
  companyId: string;
  companyName: string;
  jobTitle: string;
  messages: Message[];
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'closed' | 'blocked';
}

const Chat = () => {
  const { t } = useTranslation();
  const { id: chatId } = useParams();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [chatStatus, setChatStatus] = useState<'active' | 'closed' | 'blocked'>('active');
  const [chats, setChats] = useState<{ [key: string]: Chat }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats from localStorage
  useEffect(() => {
    const loadedChats = localStorage.getItem('chats');
    if (loadedChats) {
      const parsedChats = JSON.parse(loadedChats);
      setChats(parsedChats);
      
      // If we have a chatId from URL params, load its messages
      if (chatId && parsedChats[chatId]) {
        setSelectedChat(chatId);
        setMessages(parsedChats[chatId].messages);
        setChatStatus(parsedChats[chatId].status);
      }
    }
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'currentUser',
      content: newMessage,
      type: 'text',
      timestamp: new Date().toISOString()
    };

    // Update messages in state
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);

    // Update chats in localStorage
    const updatedChats = { ...chats };
    if (updatedChats[selectedChat]) {
      updatedChats[selectedChat].messages = updatedMessages;
      updatedChats[selectedChat].lastMessage = newMessage;
      updatedChats[selectedChat].timestamp = new Date().toISOString();
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }

    setNewMessage('');
  };

  const handleChatAction = (action: 'delete' | 'clear' | 'share' | 'close' | 'block') => {
    if (!selectedChat) return;

    const updatedChats = { ...chats };

    switch (action) {
      case 'delete':
        if (window.confirm(t('chat.settings.confirmDelete'))) {
          delete updatedChats[selectedChat];
          localStorage.setItem('chats', JSON.stringify(updatedChats));
          setChats(updatedChats);
          setSelectedChat(null);
          setMessages([]);
        }
        break;
      case 'clear':
        if (window.confirm(t('chat.settings.confirmClear'))) {
          updatedChats[selectedChat].messages = [];
          localStorage.setItem('chats', JSON.stringify(updatedChats));
          setChats(updatedChats);
          setMessages([]);
        }
        break;
      case 'block':
        if (window.confirm(t('chat.settings.confirmBlock'))) {
          updatedChats[selectedChat].status = 'blocked';
          localStorage.setItem('chats', JSON.stringify(updatedChats));
          setChats(updatedChats);
          setChatStatus('blocked');
        }
        break;
      case 'share':
        setShowShareModal(true);
        break;
      case 'close':
        updatedChats[selectedChat].status = 'closed';
        localStorage.setItem('chats', JSON.stringify(updatedChats));
        setChats(updatedChats);
        setChatStatus('closed');
        break;
    }
    setShowSettings(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleDownloadResume = (message: Message) => {
    if (message.type !== 'resume' || !message.metadata?.resumeId) return;

    // Get resume data from localStorage
    const resumes = localStorage.getItem('resumes');
    if (!resumes) return;

    const parsedResumes = JSON.parse(resumes);
    const resume = parsedResumes.find((r: any) => r.id === message.metadata.resumeId);
    if (!resume) return;

    // Create resume content
    const content = `
Resume: ${resume.title}

Personal Information:
-------------------
Name: ${resume.name}
Email: ${resume.email}
Phone: ${resume.phone}

Skills:
-------
${resume.skills.join(', ')}

Experience:
----------
Current: ${resume.experience.current}
Previous Positions:
${resume.experience.previous.map((pos: string) => `- ${pos}`).join('\n')}

Education:
---------
Degree: ${resume.education.degree}
University: ${resume.education.university}
Graduation Year: ${resume.education.graduationYear}

Languages:
---------
${resume.languages.join('\n')}
    `.trim();

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.name.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Convert chats object to array for rendering
  const chatsList = Object.values(chats).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="fixed inset-0 pt-20 bg-gray-900 flex">
      {/* Chat List */}
      <div className="w-96 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder={t('chat.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatsList
            .filter(chat => 
              chat.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat.id);
                  setMessages(chat.messages);
                  setChatStatus(chat.status);
                }}
                className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedChat === chat.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    {chat.companyName.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-white">{chat.companyName}</h3>
                      <span className="text-xs text-gray-400">
                        {formatTime(chat.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{chat.jobTitle}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                {chats[selectedChat].companyName.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-white">
                  {chats[selectedChat].companyName}
                </h2>
                <p className="text-sm text-gray-400">{chats[selectedChat].jobTitle}</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-6 h-6" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                  <button
                    onClick={() => handleChatAction('delete')}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('chat.settings.delete')}
                  </button>
                  <button
                    onClick={() => handleChatAction('clear')}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('chat.settings.clear')}
                  </button>
                  <button
                    onClick={() => handleChatAction('share')}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('chat.settings.share')}
                  </button>
                  <button
                    onClick={() => handleChatAction('block')}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    {t('chat.settings.block')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.senderId === 'currentUser'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {message.type === 'resume' && (
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <span>{t('chat.messages.resume')}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadResume(message)}
                        className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
                        title="Download Resume"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {message.type === 'coverLetter' && (
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5" />
                      <span>{t('chat.messages.coverLetter')}</span>
                    </div>
                  )}
                  {message.type === 'jobOffer' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5" />
                      <span>{t('chat.messages.jobOffer')}</span>
                    </div>
                  )}
                  <p>{message.content}</p>
                  <span className="text-xs opacity-75 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {chatStatus === 'blocked' ? (
            <div className="p-4 border-t border-gray-700 bg-gray-800 text-center">
              <p className="text-gray-400">{t('chat.blocked')}</p>
              <button
                onClick={() => {
                  const updatedChats = { ...chats };
                  updatedChats[selectedChat].status = 'active';
                  localStorage.setItem('chats', JSON.stringify(updatedChats));
                  setChats(updatedChats);
                  setChatStatus('active');
                }}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                {t('chat.unblock')}
              </button>
            </div>
          ) : chatStatus === 'closed' ? (
            <div className="p-4 border-t border-gray-700 bg-gray-800 text-center">
              <p className="text-gray-400">{t('chat.closed')}</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('chat.input.placeholder')}
                  className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t('chat.input.send')}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          {t('chat.empty')}
        </div>
      )}

      {/* Share Contact Modal */}
      <ShareContactModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={(chatId) => {
          // Handle sharing contact to selected chat
          console.log('Share contact to chat:', chatId);
        }}
        chats={chatsList.map(chat => ({
          id: chat.id,
          userName: chat.companyName,
          userAvatar: chat.companyName.charAt(0)
        }))}
      />
    </div>
  );
};

export default Chat;