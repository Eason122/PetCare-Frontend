/**
 * 圖片壓縮工具
 * 使用 Canvas API 壓縮圖片，降低 AI Token 消耗與傳輸量
 */

/**
 * 將 base64 圖片壓縮至指定寬度與品質
 * @param base64 原始 base64 圖片字串（含 data: 前綴）
 * @param maxWidth 最大寬度（預設 800px）
 * @param quality JPEG 品質（0-1，預設 0.7）
 * @returns 壓縮後的 base64 字串
 */
export async function compressImage(
    base64: string,
    maxWidth: number = 800,
    quality: number = 0.7
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // NOTE: 等比例縮放，僅在超過 maxWidth 時壓縮
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // 輸出為 JPEG 格式以獲得最佳壓縮率
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64;
    });
}
