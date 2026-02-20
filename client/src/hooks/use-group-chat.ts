import { useState, useEffect, useRef, useCallback } from "react";
import { useMemberAuth } from "./use-member-auth";

export interface ChatMessage {
  id: string;
  groupId: string;
  memberId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
}

export function useGroupChat(groupId: string | null) {
  const { accessToken } = useMemberAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const setInitialMessages = useCallback((msgs: ChatMessage[]) => {
    seenIdsRef.current = new Set(msgs.map((m) => m.id));
    setMessages(msgs);
  }, []);

  useEffect(() => {
    if (!groupId || !accessToken) return;

    // Reset messages on group change
    setMessages([]);
    seenIdsRef.current.clear();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "join_group", groupId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && data.message) {
          const msg = data.message as ChatMessage;
          if (!seenIdsRef.current.has(msg.id)) {
            seenIdsRef.current.add(msg.id);
            setMessages((prev) => [...prev, msg]);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [groupId, accessToken]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !groupId) return;
      wsRef.current.send(
        JSON.stringify({ type: "send_message", groupId, content })
      );
    },
    [groupId]
  );

  return { messages, sendMessage, isConnected, setInitialMessages };
}
