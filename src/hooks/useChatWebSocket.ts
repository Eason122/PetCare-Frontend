import { useState, useRef, useCallback, useEffect } from 'react';

/** WebSocket 連線狀態 */
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/** 重連參數 */
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

interface UseChatWebSocketOptions {
    token: string | null;
    enabled: boolean;
    onMessage: (data: any) => void;
}

interface UseChatWebSocketReturn {
    /** 連線狀態 */
    connectionStatus: ConnectionStatus;
    /** 發送訊息 */
    sendMessage: (payload: object) => void;
    /** 手動重連 */
    reconnect: () => void;
}

/**
 * WebSocket 聊天連線 Hook
 * NOTE: 自動重連使用 exponential backoff，最多嘗試 MAX_RETRIES 次
 */
export function useChatWebSocket({
    token,
    enabled,
    onMessage,
}: UseChatWebSocketOptions): UseChatWebSocketReturn {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const wsRef = useRef<WebSocket | null>(null);
    const retriesRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onMessageRef = useRef(onMessage);

    // NOTE: 使用 ref 追蹤最新的 onMessage callback 以避免 effect 重新觸發
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    /**
     * 建立 WebSocket 連線
     */
    const connect = useCallback(() => {
        if (!token || !enabled) return;

        // 清理舊連線
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setConnectionStatus('connecting');

        // NOTE: 使用 VITE_API_BASE_URL 的 host 而非 window.location.host
        const apiUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        const url = new URL(apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${url.host}`;

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'auth', token }));
                setConnectionStatus('connected');
                retriesRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessageRef.current(data);
                } catch {
                    console.error('WebSocket: failed to parse message');
                }
            };

            ws.onerror = () => {
                console.warn('WebSocket: connection error');
            };

            ws.onclose = () => {
                setConnectionStatus('disconnected');
                wsRef.current = null;

                // NOTE: exponential backoff 重連
                if (enabled && retriesRef.current < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current);
                    retriesRef.current += 1;
                    console.info(`WebSocket: reconnecting in ${delay}ms (attempt ${retriesRef.current}/${MAX_RETRIES})`);
                    reconnectTimerRef.current = setTimeout(connect, delay);
                }
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('WebSocket: failed to create connection', err);
            setConnectionStatus('disconnected');
        }
    }, [token, enabled]);

    /**
     * 手動重連（重置重試次數）
     */
    const reconnect = useCallback(() => {
        retriesRef.current = 0;
        connect();
    }, [connect]);

    /**
     * 發送訊息
     */
    const sendMessage = useCallback((payload: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        }
    }, []);

    // 自動連線/斷線
    useEffect(() => {
        if (enabled && token) {
            connect();
        }

        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [enabled, token, connect]);

    return { connectionStatus, sendMessage, reconnect };
}
