import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(url: string, onMessage?: (data: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>| null>(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            // Silent connection - no console logs
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (onMessage && isMounted) {
              onMessage(data);
            }
          } catch (error) {
            // Silent error handling
          }
        };

        ws.onerror = (error) => {
          // Silent error handling - connection will retry automatically
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsConnected(false);
            // Silent reconnection - no console logs
            
            // Reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                connect();
              }
            }, 3000);
          }
        };
      } catch (error) {
        // Silent error handling - will retry connection
      }
    };

    connect();

    // Cleanup
    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onMessage]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, sendMessage };
}
