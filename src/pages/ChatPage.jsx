import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from '../supabaseClient'; // Asegúrate de que esta ruta sea correcta

// Importa los componentes modulares
import ChatListSidebar from "@/components/chat/ChatListSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessageArea from "@/components/chat/ChatMessageArea";
import ChatInput from "@/components/chat/ChatInput";
import ChatWelcomeScreen from "@/components/chat/ChatWelcomeScreen";
// Importa EmojiPicker directamente si no es un componente de tu UI library
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
  const chatParticipantsSubscriptionRef = useRef(null);
  const chatsSubscriptionRef = useRef(null); // Nueva referencia para la suscripción de chats
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchTimeoutRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  // Nuevo estado para controlar la vista en móvil
  const [showChatList, setShowChatList] = useState(true);

  // Determinar si estamos en vista de chat activo en móvil
  useEffect(() => {
    const handleMobileView = () => {
      // Definimos un breakpoint 'md' de 768px para Tailwind por defecto
      const isMobile = window.innerWidth < 768;
      if (chatId && isMobile) {
        setShowChatList(false); // Si hay un chat ID y es móvil, ocultar la lista
      } else {
        setShowChatList(true); // En cualquier otro caso, mostrar la lista
      }
    };

    handleMobileView(); // Ejecutar al montar

    window.addEventListener('resize', handleMobileView); // Añadir listener para redimensionamiento
    return () => window.removeEventListener('resize', handleMobileView); // Limpiar listener
  }, [chatId]);


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
    if (!myProfileId) {
      console.log("FetchUserChats: myProfileId no disponible, saltando.");
      return;
    }

    console.log("FetchUserChats: Iniciando la carga de chats para el perfil:", myProfileId);
    try {
      const { data: participations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('chat_id, chats(id, type, updated_at), profile_id')
        .eq('profile_id', myProfileId);

      if (participationsError) throw participationsError;
      console.log("FetchUserChats: Participations fetched:", participations);

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
            // console.log(`Chat ${chatData.id} is direct. Name: ${chatName}, Other ID: ${otherParticipantId}`); // Demasiado verboso
          } else {
            console.warn(`Direct chat ${chatData.id} found, but no other participant was resolved.`);
            chatName = 'Usuario desconocido';
          }
        } else {
          chatName = `Grupo: ${chatData.id.substring(0, 8)}`; // Asume nombre de grupo genérico si no hay un campo 'name'
          // console.log(`Chat ${chatData.id} is group. Name: ${chatName}`); // Demasiado verboso
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

        if (lastReadError) {
          console.error(`Error al obtener last_read_at para chat ${chatData.id}:`, lastReadError.message);
        }

        if (!lastReadError && lastReadData?.last_read_at) {
          console.log(`Chat ${chatData.id}: Mi last_read_at es ${lastReadData.last_read_at}`); // Log clave

          // Consulta para contar mensajes no leídos:
          // 1. sent_at DEBE ser mayor que last_read_at.
          // 2. sender_id NO DEBE ser tu propio profileId.
          const { count, error: unreadError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatData.id)
            .gt('sent_at', lastReadData.last_read_at)
            .neq('sender_id', myProfileId); // <-- ¡Esta es la adición clave!

          if (!unreadError && count !== null) {
            unreadCount = count;
            console.log(`Chat ${chatData.id}: Mensajes no leídos calculados: ${unreadCount}`);
          } else if (unreadError) {
            console.error(`Error al contar mensajes no leídos para chat ${chatData.id}:`, unreadError.message);
          }
        } else {
          // Si no hay last_read_at (chat nuevo para el usuario, por ejemplo), contamos solo los de otros
          const { count, error: totalMessagesError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatData.id)
            .neq('sender_id', myProfileId); // <-- También añadir aquí
          if (!totalMessagesError && count !== null) { // Usar 'count' en lugar de 'totalMessagesError' para el valor
            unreadCount = count;
            console.log(`Chat ${chatData.id}: No last_read_at. Total mensajes de otros: ${unreadCount}`);
          } else if (totalMessagesError) {
            console.error(`Error al contar todos los mensajes de otros para chat ${chatData.id}:`, totalMessagesError.message);
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
      console.log("FetchUserChats: Chats resueltos ANTES de ordenar:", resolvedChats); // Nuevo log
      setChats(resolvedChats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
      console.log("FetchUserChats: Chats actualizados y ordenados en el estado."); // Nuevo log
    } catch (error) {
      console.error("FetchUserChats: Error al cargar chats:", error.message);
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
      if (chatParticipantsSubscriptionRef.current) {
        supabase.removeChannel(chatParticipantsSubscriptionRef.current);
        chatParticipantsSubscriptionRef.current = null;
      }
      if (chatsSubscriptionRef.current) { // Limpia también esta suscripción al resetear la vista
        supabase.removeChannel(chatsSubscriptionRef.current);
        chatsSubscriptionRef.current = null;
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
          // MODIFICADO: Formato de hora en la zona horaria LOCAL del usuario.
          // 'es-ES' para asegurar el formato de 24 horas y convenciones españolas.
          time: new Date(msg.sent_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Asegura formato 24h
            // La zona horaria local del usuario se usará automáticamente.
          }),
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
          console.log("last_read_at actualizado al cargar el chat. Recargando chats...");
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
                // MODIFICADO: Formato de hora en la zona horaria LOCAL del usuario.
                time: new Date(payload.new.sent_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false, // Asegura formato 24h
                  // La zona horaria local del usuario se usará automáticamente.
                }),
              }]);
              console.log("New message received via realtime.");

              // Si el mensaje no es mío, actualizo last_read_at y fuerzo la recarga de chats
              if (payload.new.sender_id !== myProfileId) {
                console.log("Mensaje de OTRO recibido. Actualizando last_read_at y recargando chats...");
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
            fetchUserChats();
          }
        )
        .subscribe();

      chatParticipantsSubscriptionRef.current = channel;
    };

    // NUEVA FUNCIÓN: Suscribirse a cambios en la tabla 'chats' para reordenamiento
    const subscribeToChatUpdates = () => {
      console.log("Subscribing to chat updates for general reordering.");

      if (chatsSubscriptionRef.current) {
        supabase.removeChannel(chatsSubscriptionRef.current);
      }

      // Supabase Realtime Channel para la tabla 'chats'
      const channel = supabase
        .channel('public:chats') // Nombre del canal para la tabla chats
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // Solo nos interesan los UPDATES para updated_at
            schema: 'public',
            table: 'chats'
          },
          (payload) => {
            // Este payload contendrá el chat_id y el nuevo updated_at
            console.log("Chat update received via realtime:", payload.new);

            // Forzamos la recarga de todos los chats para que el orden se actualice
            // Esto es crucial para reflejar el cambio de updated_at
            fetchUserChats();
          }
        )
        .subscribe();

      chatsSubscriptionRef.current = channel;
    };


    loadCurrentChatDetails();
    loadMessages();
    subscribeToNewMessages();
    setupPresence();
    subscribeToChatParticipantsChanges();
    subscribeToChatUpdates(); // ¡Llama a la nueva suscripción aquí!

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
      if (chatParticipantsSubscriptionRef.current) {
        supabase.removeChannel(chatParticipantsSubscriptionRef.current);
        chatParticipantsSubscriptionRef.current = null;
      }
      if (chatsSubscriptionRef.current) { // Limpia también esta suscripción
        supabase.removeChannel(chatsSubscriptionRef.current);
        chatsSubscriptionRef.current = null;
      }
    };
  }, [chatId, myProfileId, fetchUserChats]);

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
      setShowEmojiPicker(false); // Ocultar el selector de emojis después de enviar

      // DESPUÉS de enviar mi propio mensaje, marcar el chat como leído para mí.
      // Ya no necesitamos capturar el timestamp exacto del mensaje si la lógica de conteo
      // de no leídos ignora mis propios mensajes.
      const nowIso = new Date().toISOString();
      console.log("handleSendMessage: Intentando actualizar last_read_at a:", nowIso, "para chat:", chatId, "y perfil:", myProfileId);
      const { error: updateReadError } = await supabase
        .from('chat_participants')
        .update({ last_read_at: nowIso })
        .eq('chat_id', chatId)
        .eq('profile_id', myProfileId);

      if (updateReadError) {
        console.error("handleSendMessage: Error al actualizar last_read_at después de enviar mi propio mensaje:", updateReadError.message);
      } else {
        console.log("handleSendMessage: last_read_at actualizado con éxito después de enviar mi mensaje. Recargando chats...");
        // Recargar los chats para que la sidebar actualice los contadores.
        fetchUserChats();
      }

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
      // 1. Buscar en la tabla 'chat_participants' todas las entradas que involucran a cualquiera de los dos perfiles.
      const { data: existingChatParticipants, error: existingChatParticipantsError } = await supabase
        .from('chat_participants')
        .select('chat_id, profile_id')
        .in('profile_id', [myProfileId, otherProfileId]);

      if (existingChatParticipantsError) throw existingChatParticipantsError;

      let foundChatId = null;
      if (existingChatParticipants && existingChatParticipants.length > 0) {
        // Agrupar los participantes encontrados por su 'chat_id' para verificar quién está en cada chat.
        const chatsWithParticipants = existingChatParticipants.reduce((acc, current) => {
          if (!acc[current.chat_id]) {
            acc[current.chat_id] = [];
          }
          acc[current.chat_id].push(current.profile_id);
          return acc;
        }, {});

        // Iterar sobre los chats agrupados para encontrar uno que contenga EXACTAMENTE a ambos perfiles
        for (const chatIdToCheck in chatsWithParticipants) {
          const participantsInChat = chatsWithParticipants[chatIdToCheck];

          // Verificamos que el chat_id tiene exactamente 2 participantes
          // Y que esos 2 participantes son myProfileId y otherProfileId.
          if (participantsInChat.length === 2 &&
            participantsInChat.includes(myProfileId) &&
            participantsInChat.includes(otherProfileId)) {

            // Finalmente, para estar seguros, confirmamos que el 'type' de este chat es 'direct'
            const { data: chatTypeData, error: chatTypeError } = await supabase
              .from('chats')
              .select('type')
              .eq('id', chatIdToCheck)
              .single();

            if (!chatTypeError && chatTypeData?.type === 'direct') {
              foundChatId = chatIdToCheck;
              break; // Encontramos el chat, salimos del bucle
            }
          }
        }
      }

      if (foundChatId) {
        console.log("Chat existente encontrado:", foundChatId);
        navigate(`/chat/${foundChatId}`);
        return;
      }

      // Si no se encuentra un chat existente, crea uno nuevo
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
      console.log("DEBUG: Término de búsqueda vacío, reseteando resultados.");
      return;
    }

    try {
      console.log("DEBUG: Buscando usuarios con término:", term); // <-- Log de depuración
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${term}%`)
        .neq('id', myProfileId)
        .limit(10);

      if (error) {
        console.error("DEBUG: Error al buscar usuarios en Supabase:", error.message); // <-- Log de depuración
        throw error;
      }

      console.log("DEBUG: Resultados de búsqueda obtenidos:", data); // <-- Log de depuración
      setSearchResults(data);

    } catch (error) {
      console.error("DEBUG: Error capturado en handleSearchUsers:", error.message); // <-- Log de depuración
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
    setShowChatList(false); // Ocultar lista de chats al iniciar un chat directo en móvil
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
    <div className="container mx-auto h-[calc(100vh-128px)] flex border rounded-lg shadow-xl my-4 overflow-visible">
      {/* Sidebar de Chats */}
      {/* Las clases 'w-full md:w-1/3' y 'hidden/flex md:flex' ahora controlan la visibilidad de ChatListSidebar */}
      <div className={`
        ${showChatList ? 'flex' : 'hidden'}
        flex-col w-full md:w-1/3 border-r bg-muted/50
        md:flex
      `}>
        <ChatListSidebar
          chats={chats}
          chatId={chatId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchResults={searchResults}
          handleUserClick={handleUserClick}
          handleDeleteChat={handleDeleteChat}
          onlineUsers={onlineUsers}
          setShowChatList={setShowChatList} // Pasa setShowChatList al sidebar para el clic
        />
      </div>

      {/* Área de Mensajes */}
      {/* Mostrar solo si hay un chat seleccionado O si la lista de chats está oculta (en móvil) */}
      <main className={`
        ${currentChat || !showChatList ? 'flex' : 'hidden'}
        flex-col w-full md:w-2/3 bg-background
        md:flex
      `}>
        {currentChat ? (
          <>
            <ChatHeader
              currentChat={currentChat}
              onlineUsers={onlineUsers}
              setShowChatList={setShowChatList} // Pasa setShowChatList al header
            />
            <ChatMessageArea
              messages={messages}
              messagesEndRef={messagesEndRef}
            />
            <ChatInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              showEmojiPicker={showEmojiPicker}
              toggleEmojiPicker={toggleEmojiPicker}
              onEmojiClick={onEmojiClick}
              inputRef={inputRef}
            />
          </>
        ) : (
          <ChatWelcomeScreen />
        )}
      </main>
    </div>
  );
};

export default ChatPage;