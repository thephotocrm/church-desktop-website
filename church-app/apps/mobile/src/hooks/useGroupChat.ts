import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessageResponse } from '../types/groups';

const WS_URL = __DEV__
  ? 'ws://localhost:3000/ws'
  : 'wss://fpcd.life/ws';

const RECONNECT_DELAY = 3000;

interface UseGroupChatOptions {
  groupId: string;
  token: string;
  initialMessages?: ChatMessageResponse[];
}

export function useGroupChat({ groupId, token, initialMessages = [] }: UseGroupChatOptions) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);
  const groupIdRef = useRef(groupId);

  // Keep groupId ref current
  groupIdRef.current = groupId;

  // Seed seen IDs from initial messages
  useEffect(() => {
    const ids = new Set<string>();
    for (const msg of initialMessages) {
      ids.add(msg.id);
    }
    seenIdsRef.current = ids;
    setMessages(initialMessages);
  }, [groupId]); // Reset when group changes

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'join_group', groupId: groupIdRef.current }));
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.message) {
          const msg: ChatMessageResponse = data.message;
          // Only process messages for the current group
          if (msg.groupId !== groupIdRef.current) return;
          // Deduplicate
          if (seenIdsRef.current.has(msg.id)) return;
          seenIdsRef.current.add(msg.id);
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      // Reconnect after delay
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      // onclose will fire after onerror, which triggers reconnect
    };
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, groupId]);

  const sendMessage = useCallback(
    (content: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          type: 'send_message',
          groupId: groupIdRef.current,
          content,
        }),
      );
    },
    [],
  );

  return { messages, sendMessage, isConnected, setMessages };
}
