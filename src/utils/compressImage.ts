/**
 * 圖片壓縮工具
 * 使用 Canvas API 將圖片壓縮至指定尺寸與品質
 */

const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.8;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 壓縮圖片檔案
 * @param file 原始圖片檔案
 * @returns 壓縮後的 Base64 字串
 */
export async function compressImage(file: File): Promise<string> {
    // 檔案大小檢查
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('圖片大小不得超過 5MB');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // NOTE: 等比縮放至最大寬度
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context unavailable'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // 轉為 JPEG 並壓縮品質
                const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                resolve(compressedDataUrl);
            };
            img.onerror = () => reject(new Error('圖片載入失敗'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('檔案讀取失敗'));
        reader.readAsDataURL(file);
    });
}
