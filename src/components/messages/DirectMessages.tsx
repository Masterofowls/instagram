'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  FaceSmileIcon,
  PhotoIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { uploadImage } from '@/lib/supabase-storage';
import {
  Conversation,
  Message,
  getConversations,
  sendMessage as sendMessageApi,
  markConversationAsRead,
  subscribeToMessages,
  searchUsers,
} from '@/lib/message-service';
import { ExtendedUserProfile } from '@/types/custom.types';

export default function DirectMessages() {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExtendedUserProfile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations when component mounts
  useEffect(() => {
    if (!userId) return;
    
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data, error } = await getConversations(userId);
        if (error) throw error;
        
        if (data) {
          setConversations(data);
          // Set first conversation as active if available
          if (data.length > 0 && !activeConversation) {
            setActiveConversation(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages
    const subscription = subscribeToMessages(userId, fetchConversations);

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (userId && activeConversation) {
      markConversationAsRead(userId, activeConversation.id);
    }
  }, [userId, activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation]);

  // Handle searching for users
  useEffect(() => {
    if (!searchQuery.trim() || !userId) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        const { data, error } = await searchUsers(searchQuery, userId);
        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, userId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !activeConversation || !userId) return;

    try {
      let attachmentUrl = undefined;
      
      // Upload image if selected
      if (selectedFile) {
        setUploading(true);
        const { url, error } = await uploadImage(selectedFile, 'messages');
        if (error) throw error;
        attachmentUrl = url;
      }

      // Send message to API
      const { data, error } = await sendMessageApi(
        userId,
        activeConversation.id,
        message.trim(),
        attachmentUrl
      );

      if (error) throw error;

      // Reset state
      setMessage('');
      setSelectedFile(null);
      
      // Refresh conversations to include the new message
      const { data: updatedConversations } = await getConversations(userId);
      if (updatedConversations) {
        setConversations(updatedConversations);
        // Update active conversation
        const updatedActiveConv = updatedConversations.find(
          (conv) => conv.id === activeConversation.id
        );
        if (updatedActiveConv) {
          setActiveConversation(updatedActiveConv);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  // Start a new conversation with selected user
  const handleStartConversation = async (user: ExtendedUserProfile) => {
    if (!userId) return;
    
    // Check if conversation already exists
    const existingConversation = conversations.find(conv => conv.id === user.id);
    
    if (existingConversation) {
      setActiveConversation(existingConversation);
    } else {
      // Send initial message to create the conversation
      await sendMessageApi(userId, user.id, "Hello!");
      
      // Refresh conversations
      const { data } = await getConversations(userId);
      if (data) {
        setConversations(data);
        const newConversation = data.find(conv => conv.id === user.id);
        if (newConversation) {
          setActiveConversation(newConversation);
        }
      }
    }
    
    // Reset search
    setSearchQuery('');
    setShowSearch(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen md:ml-20 lg:ml-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-20 lg:ml-64 flex flex-col md:flex-row">
      {/* Conversations list (sidebar) */}
      <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold">Messages</h2>
            {conversations.length > 0 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {conversations.length}
              </span>
            )}
          </div>
          <button 
            className="text-gray-600 dark:text-gray-400"
            onClick={() => setShowSearch(!showSearch)}
          >
            <PlusCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {showSearch && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people..."
                className="pl-10 w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-none focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full p-2 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                    onClick={() => handleStartConversation(user)}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={user.avatar_url || 'https://i.pravatar.cc/150?img=1'}
                        alt={user.username || 'User'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.username || 'Anonymous User'}</p>
                      <p className="text-xs text-gray-500">{user.full_name || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div className="mt-2 p-4 text-center text-gray-500 dark:text-gray-400">
                No users found
              </div>
            )}
          </div>
        )}

        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                activeConversation?.id === conversation.id
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : ''
              }`}
              onClick={() => setActiveConversation(conversation)}
            >
              <div className="relative">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={conversation.otherUser.avatar_url || 'https://i.pravatar.cc/150?img=1'}
                    alt={conversation.otherUser.username || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Online indicator logic would go here */}
              </div>
              <div className="flex-1 flex flex-col items-start overflow-hidden">
                <span className="font-medium text-sm">{conversation.otherUser.username || 'Anonymous User'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-left">
                  {conversation.lastMessage?.text || 'No messages yet'}
                </span>
              </div>
              {conversation.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {conversation.unreadCount}
                </div>
              )}
            </button>
          ))}

          {conversations.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Search for people to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Active conversation */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col h-screen">
          {/* Conversation header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
            <Link href={`/profile/${activeConversation.id}`} className="flex items-center space-x-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={activeConversation.otherUser.avatar_url || 'https://i.pravatar.cc/150?img=1'}
                  alt={activeConversation.otherUser.username || 'User'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{activeConversation.otherUser.username || 'Anonymous User'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activeConversation.otherUser.last_seen ? 
                    `Last seen ${new Date(activeConversation.otherUser.last_seen).toLocaleDateString()}` : 
                    'Online status unavailable'}
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 dark:text-gray-400">
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button className="text-gray-600 dark:text-gray-400">
                <VideoCameraIcon className="h-5 w-5" />
              </button>
              <button className="text-gray-600 dark:text-gray-400">
                <InformationCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
            <div className="space-y-4">
              {activeConversation.messages.map((msg) => {
                const isOwnMessage = msg.sender_id === userId;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-[75%]">
                      {!isOwnMessage && (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 self-end">
                          <Image
                            src={activeConversation.otherUser.avatar_url || 'https://i.pravatar.cc/150?img=1'}
                            alt={activeConversation.otherUser.username || 'User'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        {msg.attachment_url && (
                          <div className="relative rounded-xl overflow-hidden mb-1">
                            <Image
                              src={msg.attachment_url}
                              alt="Attachment"
                              width={200}
                              height={200}
                              className="object-cover max-w-xs"
                            />
                          </div>
                        )}
                        <div className="flex items-center">
                          <div
                            className={`p-3 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          {/* Like functionality removed */}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <FaceSmileIcon className="h-6 w-6" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-none focus:ring-0 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <button 
                className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => fileInputRef.current?.click()}
              >
                <PhotoIcon className="h-6 w-6" />
              </button>
              <button
                className={`p-2 ${
                  (message.trim() || selectedFile) && !uploading
                    ? 'text-blue-500 hover:text-blue-600'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleSendMessage}
                disabled={(!message.trim() && !selectedFile) || uploading}
              >
                {uploading ? (
                  <div className="h-6 w-6 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="h-6 w-6 rotate-90" />
                )}
              </button>
            </div>
            {selectedFile && (
              <div className="mt-2 relative inline-block">
                <div className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={URL.createObjectURL(selectedFile)}
                    alt="Selected file"
                    fill
                    className="object-cover"
                  />
                  <button
                    className="absolute top-0 right-0 bg-gray-800 bg-opacity-70 rounded-full p-0.5"
                    onClick={() => setSelectedFile(null)}
                  >
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          {conversations.length > 0 ? (
            <div className="text-center">
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <div className="text-center">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Use the + button to search for people and start chatting</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
