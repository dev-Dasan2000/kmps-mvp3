import React, { useState, useRef, useEffect, FC, MouseEvent, ChangeEvent, KeyboardEvent, useContext } from 'react';
import {
  MessageCircle,
  Send,
  Mic,
  Camera,
  Paperclip,
  X,
  Phone,
  Video,
  MoreVertical,
  Smile,
  MicOff,
  Play,
  Pause,
  Loader
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '@/context/auth-context';
import socket from '@/hooks/socket';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data for demonstration
const mockUsers: { [key: string]: User } = {
  admin: { id: 'admin', name: 'Admin User', role: 'Admin', avatar: '👤', color: 'bg-blue-500' },
  dentist: { id: 'dentist', name: 'Dr. Smith', role: 'Dentist', avatar: '🦷', color: 'bg-green-500' },
  radiologist: { id: 'radiologist', name: 'Dr. Johnson', role: 'Radiologist', avatar: '🩺', color: 'bg-purple-500' }
};

const mockMessages: Message[] = [
  {
    id: 1,
    userId: 'dentist',
    message: 'Hi there, I need a consultation on the MRI scan for patient Jayathilaka 2',
    timestamp: '2025-01-22T10:30:00Z',
    type: 'text'
  },
  {
    id: 2,
    userId: 'radiologist',
    message: 'Sure, I can review that. Let me check the images.',
    timestamp: '2025-01-22T10:32:00Z',
    type: 'text'
  },
  {
    id: 3,
    userId: 'admin',
    message: 'Both doctors are now connected to this study discussion.',
    timestamp: '2025-01-22T10:35:00Z',
    type: 'text'
  }
];

interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  profile_picture?: string;
}

interface Message {
  id: number;
  userId: string;
  message: string;
  timestamp: string;
  type: 'text' | 'voice' | 'file';
  audioUrl?: string;
  duration?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface NoteType {
  note_id: number;
  note: string;
  dentist: { name: string, email: string, dentist_id: string },
  radiologist: { name: string, email: string, radiologist_id: string },
  created_at: string;
  study: { study_id: number };
}

interface ChatActionButtonProps {
  unreadCount?: number;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export const ChatActionButton: FC<ChatActionButtonProps> = ({ unreadCount = 0, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Open Chat"
    >
      <MessageCircle size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

interface VoiceMessageProps {
  message: Message;
  isOwn: boolean;
}

const VoiceMessage: FC<VoiceMessageProps> = ({ message, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-2`}>
      <button onClick={togglePlay} className="p-1 rounded-full bg-white bg-opacity-20">
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="flex-1">
        <div className="w-16 h-1 bg-white bg-opacity-30 rounded">
          <div
            className="h-1 bg-white rounded"
            style={{ width: `${(currentTime / (message.duration || 30)) * 100}%` }}
          ></div>
        </div>
      </div>
      <span className="text-xs opacity-70">{formatRecordingTime(message.duration || 0)}</span>
      <audio
        ref={audioRef}
        src={message.audioUrl}
        onTimeUpdate={(e: React.SyntheticEvent<HTMLAudioElement>) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyId: number | null;
  participants?: User[];
  currentUser?: string;
  onSendMessage?: (msg: Message) => void;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatModal: FC<ChatModalProps> = ({
  isOpen,
  onClose,
  studyId,
  participants = [],
  currentUser = 'admin',
  onSendMessage,
  onTyping
}) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [gettingNotes, setGettingNotes] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [note, setNote] = useState<NoteType[] | null>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user, apiClient } = useContext(AuthContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [note]);

  useEffect(() => {
    socket.on("note_created", (newNote) => {
      setNote(prev => [...(prev || []), newNote]);
    });
    if (studyId) {
      fetchNote(studyId);
    }

    socket.on("note_updated", (updatedNote) => {

    });

    return () => {
      socket.off("note_created");
      socket.off("note_updated");
      socket.off("note_deleted");
    };
  }, [studyId]);

  const fetchNote = async (study_id: number) => {
    setGettingNotes(true);
    try {
      const res = await apiClient.get(
        `/notes/bystudy/${study_id}`,
      );
      if (res.status == 500) {
        throw new Error("Internal Server Error");
      }
      setNote(res.data);
    }
    catch (err: any) {
      toast.error("Failed to fetch notes: " + (err.response?.data?.message || err.message));
    }
    finally {
      setGettingNotes(false);
    }
  }

  useEffect(() => {
    if (studyId) {
      fetchNote(studyId);
    }
  }, [studyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => interval && clearInterval(interval);
  }, [isRecording]);

  // Handle typing indicator
  useEffect(() => {
    if (newMessage && !isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping?.(false);
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [newMessage, isTyping, onTyping]);

  const handleSendMessage = async () => {
    setSending(true);
    try {
      const payload: any = {
        note: newMessage,
        study_id: studyId,
        dentist_id: null,
        radiologist_id: null,
        created_at: new Date().toISOString()
      };

      if (user.role === 'dentist') {
        payload.dentist_id = user.id;
      } else if (user.role === 'radiologist') {
        payload.radiologist_id = user.id;
      }

      const response = await apiClient.post(
        `/notes`, {
        note: payload.note,
        radiologist_id: payload.radiologist_id,
        dentist_id: payload.dentist_id,
        created_at: payload.created_at,
        study_id: payload.study_id
      },
        {
          headers: {
            "content-type": "application/json"
          }
        }
      );

      if (response.status !== 201) {
        throw new Error("Failed to send message");
      }
      setNewMessage('');
    } catch (err: any) {
      toast.error("Failed to send message: " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);

          const voiceMessage: Message = {
            id: Date.now(),
            userId: currentUser,
            message: 'Voice message',
            timestamp: new Date().toISOString(),
            type: 'voice',
            audioUrl,
            duration: recordingTime
          };
          setMessages(prev => [...prev, voiceMessage]);
          onSendMessage?.(voiceMessage);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Here you would implement camera functionality
      console.log('Camera accessed');
      stream.getTracks().forEach(track => track.stop());
      alert('Camera access granted! Implement photo capture functionality.');
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileMessage: Message = {
        id: Date.now(),
        userId: currentUser,
        message: file.name,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size
      };
      setMessages(prev => [...prev, fileMessage]);
      onSendMessage?.(fileMessage);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-md sm:w-[380px] sm:bottom-4 sm:right-4 shadow-2xl px-0 sm:px-0">
      <div className="bg-white text-gray-900 rounded-t-lg sm:rounded-lg flex flex-col h-[60vh] max-h-[600px] sm:h-[600px] border border-gray-200 w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Study Discussion</h3>
              {/*<p className="text-xs opacity-90">
                {note && note.length > 0
                  ? note.map(p => p.dentist.name || p.role).join(', ')
                  : 'Admin, Dr. Smith, Dr. Johnson'
                }
              </p>*/}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/*<button className="p-2 hover:bg-emerald-500 hover:bg-opacity-10 rounded-full">
              <Phone size={18} />
            </button>
            <button className="p-2 hover:bg-emerald-500 hover:bg-opacity-10 rounded-full">
              <Video size={18} />
            </button>
            <button className="p-2 hover:bg-emerald-500 hover:bg-opacity-10 rounded-full">
              <MoreVertical size={18} />
            </button>*/}
            <button
              onClick={onClose}
              className="p-2 hover:bg-emerald-500 hover:bg-opacity-10 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50">
          {note?.map((message) => {
            const userInside = {
              name: message.radiologist?.name || message.dentist?.name || 'Unknown',
              email: message.radiologist?.email || message.dentist?.email || 'unknown@example.com',
              color: 'bg-purple-500',
              avatar: ''
            };

            const isOwn =
              (user.role === 'radiologist' && message.radiologist?.radiologist_id === user.id) ||
              (user.role === 'dentist' && message.dentist?.dentist_id === user.id);


            return (
              <div key={message.note_id} className={`mb-3 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[80vw] sm:max-w-xs`}>
                  {!isOwn && (
                    <Avatar className={`w-8 h-8 flex-shrink-0`}>
                      <AvatarImage 
                        src={message.radiologist?.profile_picture || message.dentist?.profile_picture 
                          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${message.radiologist?.profile_picture || message.dentist?.profile_picture}`
                          : undefined
                        }
                        alt={userInside?.name || 'User'}
                        onError={(e) => {
                          // If image fails to load, this will trigger the fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className={`${userInside?.color || 'bg-gray-500'} text-white text-sm`}>
                        {userInside?.name
                          ? userInside.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)
                          : '👤'
                        }
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`${isOwn ? 'ml-2' : 'mr-2'} flex flex-col`}>
                    {!isOwn && (
                      <span className="text-xs text-gray-600 mb-1 px-2">{userInside?.name || 'Unknown User'}</span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg text-sm sm:text-base ${isOwn
                        ? 'bg-emerald-100 text-emerald-700 rounded-br-none'
                        : 'bg-gray-100 text-gray-900 shadow-sm rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm sm:text-base">{message.note}</p>

                      <span className={`text-xs ${isOwn ? 'text-emerald-700/80' : 'text-gray-500'} block mt-1`}> {formatTime(message.created_at)} </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">{typingUsers.join(', ')} typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Recording Overlay */}
        {isRecording && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
            <div className="bg-white text-gray-900 rounded-lg p-6 text-center border border-gray-200">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Mic className="text-white" size={24} />
              </div>
              <p className="text-lg font-semibold mb-2">Recording...</p>
              <p className="text-2xl font-mono text-red-500">{formatRecordingTime(recordingTime)}</p>
              <button
                onClick={handleVoiceRecord}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop Recording
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-2 sm:p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/*<button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <Paperclip size={20} />
            </button>*/}

            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-3 py-2 sm:px-4 sm:py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-gray-50 text-gray-900 border-gray-200 text-sm sm:text-base"
              />

              {/*<button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Smile size={20} />
              </button>*/}
            </div>

            {/*<button
              onClick={handleCameraAccess}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <Camera size={20} />
            </button>*/}

            <button
              onClick={handleSendMessage}
              className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-500"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? <Loader size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
      />
    </div>
  );
};        