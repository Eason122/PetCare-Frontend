import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 偵測是否為 Capacitor 原生環境
 * NOTE: 當 Capacitor 安裝並初始化後，`window.Capacitor` 會自動存在
 */
function isNativePlatform(): boolean {
    return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * 偵測目前裝置是否支援 Torch（閃光燈/手電筒）
 * 此功能依賴 MediaStream + track constraints
 */
async function checkTorchSupport(): Promise<boolean> {
    try {
        if (!navigator.mediaDevices?.getUserMedia) return false;
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        const supported = !!capabilities?.torch;
        // 立即釋放相機資源
        stream.getTracks().forEach(t => t.stop());
        return supported;
    } catch {
        return false;
    }
}

interface UseCameraResult {
    /** 是否支援閃光燈 */
    isTorchSupported: boolean;
    /** 閃光燈目前開啟狀態 */
    isTorchOn: boolean;
    /** 切換閃光燈 */
    toggleTorch: () => Promise<void>;
    /** 釋放相機資源（元件卸載時呼叫） */
    cleanup: () => void;
}

/**
 * 相機相關功能 Hook
 * 支援 Capacitor 原生 / Web 兩種模式
 * - Web: 使用 MediaStream Torch API（Android Chrome 支援）
 * - Capacitor: 使用 @capacitor/camera 外掛（待安裝後自動切換）
 */
export function useCamera(): UseCameraResult {
    const [isTorchSupported, setIsTorchSupported] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    // 元件掛載時偵測 Torch 支援狀態
    useEffect(() => {
        // Capacitor 原生環境下，閃光燈由 Camera plugin 的 flash option 控制
        if (isNativePlatform()) {
            setIsTorchSupported(true);
            return;
        }

        // Web 環境下偵測 MediaStream Torch
        checkTorchSupport().then(setIsTorchSupported);
    }, []);

    /**
     * 切換閃光燈開關
     * NOTE: Web 環境使用 track.applyConstraints 控制 Torch
     */
    const toggleTorch = useCallback(async () => {
        if (isNativePlatform()) {
            // Capacitor 環境：切換狀態即可，拍照時由 Camera plugin flash option 使用
            setIsTorchOn(prev => !prev);
            return;
        }

        try {
            if (isTorchOn && streamRef.current) {
                // 關閉 Torch：釋放串流
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
                setIsTorchOn(false);
                return;
            }

            // 開啟 Torch
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            const track = stream.getVideoTracks()[0];

            await track.applyConstraints({
                advanced: [{ torch: true } as any]
            });

            streamRef.current = stream;
            setIsTorchOn(true);
        } catch (error) {
            console.error('Torch toggle failed:', error);
        }
    }, [isTorchOn]);

    /**
     * 清理相機資源
     */
    const cleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsTorchOn(false);
    }, []);

    // 元件卸載自動清理
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return {
        isTorchSupported,
        isTorchOn,
        toggleTorch,
        cleanup,
    };
}
