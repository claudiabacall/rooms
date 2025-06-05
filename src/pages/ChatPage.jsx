import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Smile, Search, MessageSquare, Trash2 } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { supabase } from '../supabaseClient';
import EmojiPicker from 'emoji-picker-react';

const ChatPage = () => {
  const { chatId } = useParams();
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [myProfileId, setMyProfileId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatSubscriptionRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const chatParticipantsSubscriptionRef = useRef(null); // NUEVA REF para la suscripción de participantes
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchTimeoutRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const getMyProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyProfileId(user.id);
      } else {
        console.warn("Usuario no autenticado en ChatPage.");
        navigate('/login');
      }
    };
    getMyProfile();
  }, [navigate]);

  const fetchUserChats = useCallback(async () => {
    if (!myProfileId) return;

    console.log("Fetching user chats...");
    try {
      const { data: participations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('chat_id, chats(id, type, updated_at), profile_id')
        .eq('profile_id', myProfileId);

      if (participationsError) throw participationsError;
      console.log("Participations fetched:", participations);

      const chatListPromises = participations.map(async (p) => {
        const chatData = p.chats;
        let chatName = `Chat ID: ${chatData.id.substring(0, 8)}`;
        let otherParticipantId = null;
        let avatar_url = null;

        if (chatData.type === 'direct') {
          const { data: otherParticipants, error: otherParticipantsError } = await supabase
            .from('chat_participants')
            .select('profile_id, profiles(full_name, avatar_url)')
            .eq('chat_id', chatData.id)
            .neq('profile_id', myProfileId);

          if (otherParticipantsError) throw otherParticipantsError;

          if (otherParticipants && otherParticipants.length > 0) {
            chatName = otherParticipants[0].profiles?.full_name || 'Usuario desconocido';
            otherParticipantId = otherParticipants[0].profile_id;
            avatar_url = otherParticipants[0].profiles?.avatar_url;
            console.log(`Chat ${chatData.id} is direct. Name: ${chatName}, Other ID: ${otherParticipantId}`);
          } else {
            console.warn(`Direct chat ${chatData.id} found, but no other participant was resolved.`);
            chatName = 'Usuario desconocido';
          }
        } else {
          chatName = `Grupo: ${chatData.id.substring(0, 8)}`;
          console.log(`Chat ${chatData.id} is group. Name: ${chatName}`);
        }

        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('messages')
          .select('content, sent_at, sender_id')
          .eq('chat_id', chatData.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();
        let lastMessage = lastMessageData ? lastMessageData.content : "No hay mensajes";

        let unreadCount = 0;
        const { data: lastReadData, error: lastReadError } = await supabase
          .from('chat_participants')
          .select('last_read_at')
          .eq('chat_id', chatData.id)
          .eq('profile_id', myProfileId)
          .single();

        if (!lastReadError && lastReadData?.last_read_at) {
          const { count, error: unreadError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatData.id)
            .gt('sent_at', lastReadData.last_read_at);

          if (!unreadError && count) {
            unreadCount = count;
          }
        }

        return {
          id: chatData.id,
          name: chatName,
          avatar_url: avatar_url,
          lastMessage: lastMessage,
          unread: unreadCount,
          otherParticipantId: otherParticipantId,
          type: chatData.type,
          updated_at: chatData.updated_at
        };
      });

      const resolvedChats = await Promise.all(chatListPromises);
      console.log("Resolved chats for sidebar:", resolvedChats);
      setChats(resolvedChats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    } catch (error) {
      console.error("Error al cargar chats:", error.message);
      setChats([]);
    }
  }, [myProfileId]);

  useEffect(() => {
    if (!myProfileId) return;
    fetchUserChats();
  }, [myProfileId, fetchUserChats]);


  const handleDeleteChat = useCallback(async (e, chatToDeleteId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("¿Estás seguro de que quieres borrar este chat? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatToDeleteId);

      if (error) throw error;

      console.log(`Chat ${chatToDeleteId} borrado exitosamente.`);

      setChats(prevChats => prevChats.filter(chat => chat.id !== chatToDeleteId));

      if (chatId === chatToDeleteId) {
        navigate('/chat');
        setCurrentChat(null);
      }

    } catch (error) {
      console.error("Error al borrar chat:", error.message);
      alert("Error al borrar chat: " + error.message);
    }
  }, [chatId, navigate]);


  useEffect(() => {
    if (!chatId || !myProfileId) {
      setMessages([]);
      setCurrentChat(null);
      if (chatSubscriptionRef.current) {
        supabase.removeChannel(chatSubscriptionRef.current);
        chatSubscriptionRef.current = null;
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
        setOnlineUsers(new Set());
      }
      // Asegurarse de limpiar también la suscripción de participantes al cambiar de chat o al salir
      if (chatParticipantsSubscriptionRef.current) {
        supabase.removeChannel(chatParticipantsSubscriptionRef.current);
        chatParticipantsSubscriptionRef.current = null;
      }
      console.log("No chatId or myProfileId, resetting chat view.");
      return;
    }

    const loadCurrentChatDetails = async () => {
      console.log(`Loading details for chat ID: ${chatId}`);
      try {
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('id, type, chat_participants(profile_id, profiles(full_name, avatar_url))')
          .eq('id', chatId)
          .single();

        if (chatError) throw chatError;

        if (chatData) {
          let chatName = `Chat ID: ${chatData.id.substring(0, 8)}`;
          let otherParticipantId = null;
          let avatar_url = null;

          if (chatData.type === 'direct') {
            const otherParticipant = chatData.chat_participants.find(p => p.profile_id !== myProfileId);
            if (otherParticipant) {
              chatName = otherParticipant.profiles?.full_name || 'Usuario desconocido';
              otherParticipantId = otherParticipant.profile_id;
              avatar_url = otherParticipant.profiles?.avatar_url;
              console.log(`Current chat (${chatId}) is direct. Name: ${chatName}, Other ID: ${otherParticipantId}`);
            } else {
              console.warn(`Direct chat ${chatId} has no other participant resolved.`);
              chatName = 'Usuario desconocido';
            }
          } else {
            chatName = `Grupo: ${chatData.id.substring(0, 8)}`;
            console.log(`Current chat (${chatId}) is group. Name: ${chatName}`);
          }

          const selectedChatDetails = {
            id: chatData.id,
            name: chatName,
            avatar_url: avatar_url,
            otherParticipantId: otherParticipantId,
            type: chatData.type,
          };
          setCurrentChat(selectedChatDetails);
          console.log("Current chat details set:", selectedChatDetails);
        }
      } catch (error) {
        console.error(`Error al cargar los detalles del chat ${chatId}:`, error.message);
        setCurrentChat(null);
      }
    };

    const loadMessages = async () => {
      console.log(`Loading messages for chat ID: ${chatId}`);
      try {
        const { data: fetchedMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id, content, sent_at, sender_id, profiles(full_name)')
          .eq('chat_id', chatId)
          .order('sent_at', { ascending: true });

        if (messagesError) throw messagesError;

        setMessages(fetchedMessages.map(msg => ({
          sender: msg.sender_id === myProfileId ? "me" : "other",
          user: msg.profiles?.full_name || 'Desconocido',
          text: msg.content,
          time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
        console.log("Messages loaded:", fetchedMessages.length);

        // Actualiza last_read_at cuando se cargan los mensajes (es decir, el usuario abre el chat)
        const { error: updateReadError } = await supabase
          .from('chat_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('chat_id', chatId)
          .eq('profile_id', myProfileId);

        if (updateReadError) console.error("Error al actualizar last_read_at:", updateReadError.message);
        else {
          // Una vez actualizado en la DB, dispara la recarga de chats para que la sidebar se actualice
          fetchUserChats();
        }
      } catch (error) {
        console.error(`Error al cargar mensajes para el chat ${chatId}:`, error.message);
        setMessages([]);
      }
    };


    const subscribeToNewMessages = () => {
      console.log(`Subscribing to new messages for chat ID: ${chatId}`);
      if (chatSubscriptionRef.current) {
        supabase.removeChannel(chatSubscriptionRef.current);
      }

      const channel = supabase
        .channel(`chat_${chatId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          async (payload) => {
            if (payload.new.chat_id === chatId) {
              const { data: senderProfile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', payload.new.sender_id)
                .single();

              setMessages((prevMessages) => [...prevMessages, {
                sender: payload.new.sender_id === myProfileId ? "me" : "other",
                user: senderProfile?.full_name || 'Desconocido',
                text: payload.new.content,
                time: new Date(payload.new.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }]);
              console.log("New message received via realtime.");

              // Si el mensaje no es mío, actualizo last_read_at y fuerzo la recarga de chats
              if (payload.new.sender_id !== myProfileId) {
                const { error: updateReadError } = await supabase
                  .from('chat_participants')
                  .update({ last_read_at: new Date().toISOString() })
                  .eq('chat_id', chatId)
                  .eq('profile_id', myProfileId);
                if (updateReadError) console.error("Error al actualizar last_read_at desde realtime:", updateReadError.message);
                else {
                  fetchUserChats(); // Recarga los chats para actualizar el contador
                }
              }
            }
          }
        )
        .subscribe();

      chatSubscriptionRef.current = channel;
    };

    const setupPresence = async () => {
      console.log(`Setting up presence for user: ${myProfileId}`);
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }

      const presenceChannel = supabase.channel('global_presence', {
        config: { presence: { key: myProfileId } }
      });

      presenceChannel.on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const currentlyOnline = new Set();
        for (const userId in newState) {
          currentlyOnline.add(userId);
        }
        setOnlineUsers(currentlyOnline);
        console.log("Online Users (SYNC):", Array.from(currentlyOnline));
      });

      presenceChannel.on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          newPresences.forEach(p => updated.add(p.key));
          return updated;
        });
        console.log('User joined:', newPresences.map(p => p.key));
      });

      presenceChannel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          leftPresences.forEach(p => updated.delete(p.key));
          return updated;
        });
        console.log('User left:', leftPresences.map(p => p.key));
      });

      await presenceChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          presenceChannel.track({ user_id: myProfileId, status: 'online' });
          console.log('Subscribed to presence channel and tracking self.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Error subscribing to presence channel:", status);
        }
      });

      presenceChannelRef.current = presenceChannel;
    };

    // --- NUEVA FUNCIÓN DE SUSCRIPCIÓN PARA CHAT_PARTICIPANTS ---
    const subscribeToChatParticipantsChanges = () => {
      console.log("Subscribing to chat_participants changes for current user.");

      if (chatParticipantsSubscriptionRef.current) {
        supabase.removeChannel(chatParticipantsSubscriptionRef.current);
      }

      const channel = supabase
        .channel(`chat_participants_updates_${myProfileId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_participants',
            filter: `profile_id=eq.${myProfileId}`
          },
          (payload) => {
            console.log("Chat participant update received:", payload);
            // Cuando hay un update en mi participación (especialmente last_read_at),
            // volvemos a cargar los chats para recalcular los no leídos.
            fetchUserChats();
          }
        )
        .subscribe();

      chatParticipantsSubscriptionRef.current = channel;
    };
    // -------------------------------------------------------------

    loadCurrentChatDetails();
    loadMessages();
    subscribeToNewMessages();
    setupPresence();
    subscribeToChatParticipantsChanges(); // Llamar a la nueva suscripción

    return () => {
      console.log(`Cleaning up subscriptions for chat ID: ${chatId}`);
      if (chatSubscriptionRef.current) {
        supabase.removeChannel(chatSubscriptionRef.current);
        chatSubscriptionRef.current = null;
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
        setOnlineUsers(new Set());
      }
      // Limpiar la nueva suscripción también
      if (chatParticipantsSubscriptionRef.current) {
        supabase.removeChannel(chatParticipantsSubscriptionRef.current);
        chatParticipantsSubscriptionRef.current = null;
      }
    };
  }, [chatId, myProfileId, fetchUserChats]); // Añadir fetchUserChats a las dependencias

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !chatId || !myProfileId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: myProfileId,
          content: newMessage.trim(),
        });

      if (error) {
        throw error;
      }
      setNewMessage("");

    } catch (error) {
      console.error("Error al enviar mensaje:", error.message);
    }
  };

  const startNewDirectChat = useCallback(async (otherProfileId) => {
    if (!myProfileId || !otherProfileId || myProfileId === otherProfileId) {
      console.warn("Invalid attempt to start chat: myProfileId or otherProfileId missing/same.");
      return;
    }

    try {
      const { data: existingParticipations, error: existingParticipationsError } = await supabase
        .from('chat_participants')
        .select('chat_id, profile_id')
        .in('profile_id', [myProfileId, otherProfileId]);

      if (existingParticipationsError) throw existingParticipationsError;

      let existingChatId = null;
      if (existingParticipations && existingParticipations.length > 0) {
        const potentialChatIds = {};
        existingParticipations.forEach(p => {
          if (!potentialChatIds[p.chat_id]) {
            potentialChatIds[p.chat_id] = new Set();
          }
          potentialChatIds[p.chat_id].add(p.profile_id);
        });

        for (const cId in potentialChatIds) {
          if (potentialChatIds[cId].has(myProfileId) && potentialChatIds[cId].has(otherProfileId)) {
            existingChatId = cId;
            break;
          }
        }
      }

      if (existingChatId) {
        console.log("Chat existente encontrado:", existingChatId);
        navigate(`/chat/${existingChatId}`);
        return;
      }

      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (newChatError) throw newChatError;

      const newChatId = newChat.id;

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChatId, profile_id: myProfileId },
          { chat_id: newChatId, profile_id: otherProfileId }
        ]);

      if (participantsError) throw participantsError;

      console.log("Nuevo chat creado:", newChatId);
      navigate(`/chat/${newChatId}`);

    } catch (error) {
      console.error("Error al iniciar chat:", error.message);
      alert("Error al iniciar chat: " + error.message);
    }
  }, [myProfileId, navigate]);

  const handleSearchUsers = useCallback(async (term) => {
    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${term}%`)
        .neq('id', myProfileId)
        .limit(10);

      if (error) throw error;

      setSearchResults(data);

    } catch (error) {
      console.error("Error al buscar usuarios:", error.message);
      setSearchResults([]);
    }
  }, [myProfileId]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchUsers(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, handleSearchUsers]);

  const handleUserClick = (profileId) => {
    setSearchTerm("");
    setSearchResults([]);
    startNewDirectChat(profileId);
  };

  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    setNewMessage((prevMessage) => {
      const inputElement = inputRef.current?.querySelector('input');
      if (inputElement) {
        const start = inputElement.selectionStart;
        const end = inputElement.selectionEnd;
        const newText = prevMessage.substring(0, start) + emoji + prevMessage.substring(end);

        setTimeout(() => {
          inputElement.selectionStart = start + emoji.length;
          inputElement.selectionEnd = start + emoji.length;
          inputElement.focus();
        }, 0);
        return newText;
      }
      return prevMessage + emoji;
    });
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };


  return (
    <div className="container mx-auto h-[calc(100vh-128px)] flex border rounded-lg shadow-xl my-4 overflow-hidden">
      {/* Sidebar de Chats */}
      <aside className="w-1/3 border-r bg-muted/50 flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Input
              placeholder="Buscar chats o personas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {/* Resultados de la búsqueda */}
          {searchTerm.length > 0 && searchResults.length > 0 && (
            <div className="absolute z-10 w-[calc(33.33%-2rem)] bg-popover border rounded-md shadow-lg mt-2 overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer"
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url || "https://images.unsplash.com/photo-1694388001616-1176f534d72f"} alt={user.full_name} />
                    <AvatarFallback>{user.full_name ? user.full_name.substring(0, 1) : '?'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.full_name}</span>
                </div>
              ))}
            </div>
          )}
          {searchTerm.length > 0 && searchResults.length === 0 && (
            <div className="p-3 text-center text-muted-foreground text-sm">
              No se encontraron usuarios.
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto">
          {chats.length > 0 ? (
            chats.map(chat => (
              <div key={chat.id} className="relative group">
                <Link to={`/chat/${chat.id}`} className="block">
                  <motion.div
                    className={`p-4 flex items-center space-x-3 hover:bg-accent cursor-pointer border-b ${chatId === chat.id ? 'bg-accent' : ''}`}
                    whileHover={{ backgroundColor: "var(--accent)" }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar_url || "https://images.unsplash.com/photo-1694388001616-1176f534d72f"} alt={chat.name} />
                      <AvatarFallback>{chat.name ? chat.name.substring(0, 1) : '?'}</AvatarFallback>
                      {chat.type === 'direct' && chat.otherParticipantId && onlineUsers.has(chat.otherParticipantId) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{chat.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {chat.unread}
                      </div>
                    )}
                  </motion.div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  title="Eliminar chat"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No tienes chats activos.
              <Link to="/comunidades" className="mt-6">
                <Button>Explorar Comunidades</Button>
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Área de Mensajes */}
      <main className="w-2/3 flex flex-col bg-background">
        {currentChat ? (
          <>
            <header className="p-4 border-b flex justify-between items-center bg-muted/20">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentChat.avatar_url || "https://images.unsplash.com/photo-1694388001616-1176f594d72f"} alt={currentChat.name} />
                  <AvatarFallback>{currentChat.name ? currentChat.name.substring(0, 1) : '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{currentChat.name}</h2>
                  {currentChat.type === 'direct' && currentChat.otherParticipantId && onlineUsers.has(currentChat.otherParticipantId) ? (
                    <p className="text-xs text-green-500">En línea</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Desconectado</p>
                  )}
                </div>
              </div>
            </header>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-primary-light">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`max-w-xs lg:max-w-md p-3 rounded-xl shadow ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t bg-muted/20 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-20">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" type="button" onClick={toggleEmojiPicker}>
                  <Smile className="h-5 w-5" />
                </Button>
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="h-24 w-24 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-foreground">Bienvenido a Rooms Chat</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">Selecciona una conversación para empezar a chatear o explora comunidades para conectar con gente nueva.</p>
            <Link to="/comunidades" className="mt-6">
              <Button>Explorar Comunidades</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;