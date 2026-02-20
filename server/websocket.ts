import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifyToken } from "./jwt";
import { storage } from "./storage";

interface AuthenticatedSocket extends WebSocket {
  memberId?: string;
  memberRole?: string;
  subscribedGroups: Set<string>;
  isAlive: boolean;
}

// Map of groupId -> Set of connected sockets
const groupSubscriptions = new Map<string, Set<AuthenticatedSocket>>();

export function broadcastToGroup(groupId: string, data: unknown) {
  const sockets = groupSubscriptions.get(groupId);
  if (!sockets) return;
  const payload = JSON.stringify(data);
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Heartbeat to clean up dead connections
  const interval = setInterval(() => {
    (wss.clients as Set<AuthenticatedSocket>).forEach((ws) => {
      if (!ws.isAlive) {
        cleanupSocket(ws);
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  wss.on("connection", (ws: AuthenticatedSocket, req) => {
    ws.subscribedGroups = new Set();
    ws.isAlive = true;

    // Auth via query param
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(4001, "Authentication required");
      return;
    }

    try {
      const payload = verifyToken(token);
      ws.memberId = payload.memberId;
      ws.memberRole = payload.role;
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        await handleMessage(ws, msg);
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      cleanupSocket(ws);
    });
  });
}

function cleanupSocket(ws: AuthenticatedSocket) {
  Array.from(ws.subscribedGroups).forEach((groupId) => {
    const sockets = groupSubscriptions.get(groupId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        groupSubscriptions.delete(groupId);
      }
    }
  });
  ws.subscribedGroups.clear();
}

async function handleMessage(ws: AuthenticatedSocket, msg: { type: string; groupId?: string; content?: string }) {
  if (!ws.memberId) return;

  switch (msg.type) {
    case "join_group": {
      if (!msg.groupId) return;
      const isMember = await storage.isGroupMember(msg.groupId, ws.memberId);
      if (!isMember) {
        ws.send(JSON.stringify({ type: "error", message: "Not a member of this group" }));
        return;
      }
      ws.subscribedGroups.add(msg.groupId);
      if (!groupSubscriptions.has(msg.groupId)) {
        groupSubscriptions.set(msg.groupId, new Set());
      }
      groupSubscriptions.get(msg.groupId)!.add(ws);
      ws.send(JSON.stringify({ type: "joined_group", groupId: msg.groupId }));
      break;
    }

    case "leave_group": {
      if (!msg.groupId) return;
      ws.subscribedGroups.delete(msg.groupId);
      const sockets = groupSubscriptions.get(msg.groupId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) groupSubscriptions.delete(msg.groupId);
      }
      break;
    }

    case "send_message": {
      if (!msg.groupId || !msg.content?.trim()) return;

      const isMember = await storage.isGroupMember(msg.groupId, ws.memberId);
      if (!isMember) {
        ws.send(JSON.stringify({ type: "error", message: "Not a member of this group" }));
        return;
      }

      const group = await storage.getGroup(msg.groupId);
      if (!group) return;

      if (group.type === "announcement" && ws.memberRole !== "admin") {
        ws.send(JSON.stringify({ type: "error", message: "Only admins can post in announcement groups" }));
        return;
      }

      const message = await storage.createMessage({
        groupId: msg.groupId,
        memberId: ws.memberId,
        content: msg.content.trim(),
      });

      broadcastToGroup(msg.groupId, {
        type: "new_message",
        message,
      });
      break;
    }
  }
}
