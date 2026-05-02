"use client";

import { useEffect } from "react";
import { getToken } from "@/lib/auth";

export function useRealTime() {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // In a real app, you would pass the token to authenticate the WS connection if needed
    // The backend endpoint is ws://localhost:8000/ws/admin/realtime
    const wsUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace("http", "ws") + "/ws/admin/realtime"
      : "ws://localhost:8000/ws/admin/realtime";

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected for real-time updates");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Real-time update received:", data);
          
          // Dispatch a custom global event that hooks can listen to
          window.dispatchEvent(new CustomEvent("realtime-update", { detail: data }));
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.warn("WebSocket connection issue (reconnecting...)", error);
        ws?.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on unmount
        ws.close();
      }
    };
  }, []);
}
