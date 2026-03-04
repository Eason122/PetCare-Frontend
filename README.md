# PetCare 前端專案 (PetCare Frontend)

這是一個基於 **React + TypeScript + Vite** 開發的寵物健康與社群管理應用程式前端專案。目前已將前端與後端正式分離，並準備支援 Capacitor 進行 iOS App 打包。

## 🛠 技術棧 (Tech Stack)

### 核心框架與語言
- **React (v19)**: 用於建構使用者介面的核心框架
- **TypeScript (v5.8)**: 增加靜態型別檢查，提高程式碼可靠性
- **Vite (v6.2)**: 提供極速的本地端開發與建置體驗

### 樣式與動畫
- **Tailwind CSS (v4)**: Utility-first CSS 框架，用於快速刻畫 UI (結合 `@tailwindcss/vite`)
- **Framer Motion**: 提供流暢的 React 介面動畫與過場效果
- **Lucide React**: 簡約且高度可自訂的 SVG 圖示庫
- **clsx & tailwind-merge**: 用於動態合併與處理 Tailwind CSS class 名稱

### 核心功能套件
- **react-router-dom (v7)**: 處理前端路由與頁面導航
- **react-hook-form**: 高效能的表單狀態與驗證管理
- **i18next & react-i18next**: 實現核心的國際化 (i18n) 多國語言支援
- **i18next-browser-languagedetector**: 自動偵測使用者系統/瀏覽器語言
- **Recharts**: 用於渲染數據圖表（如寵物健康數據統計）
- **PapaParse**: 用於解析 CSV 或相關資料表格式
- **date-fns**: 輕量級的日期處理工具庫

---

## ✨ 目前已實作功能 (Implemented Features)

### 1. 國際化多國語言支援 (i18n)
- 支援四種語言：**繁體中文 (zh)**、**英文 (en)**、**日文 (ja)**、**韓文 (ko)**。
- 整合 `i18next-browser-languagedetector`，**自動偵測並套用系統語言**。若偵測到不支援的語言，則預設退回使用中文 (zh)。
- 支援透過設定頁面手動切換語系。
- 各元件（如 `Layout`, `Login`, `Profile` 等）皆已完成翻譯字串的抽離與綁定。

### 2. 系統級深色模式 (Dark Mode)
- 移除舊版手動切換按鈕，改為**全自動深色模式偵測**。
- 自動抓取使用者系統（或瀏覽器）的外觀偏好，即時同步切換 Light / Dark 佈景主題。
- 結合 Tailwind 的 `dark:` class 實現全站樣態的無縫切換。

### 3. 第三方社群登入與綁定 (OAuth Integration)
- 已規劃並建置第三方登入流程，支援：
  - **Google 登入**
  - **Apple 登入**
  - **Facebook 登入**
- 包含登入後的回呼 (Callback) 處理與帳號綁定 (Account Binding) 邏輯。

### 4. 社群與互動功能 (Community Module)
- **貼文串與互動**：使用者可以瀏覽、發佈社群貼文。
- **檢舉與封鎖**：針對不當內容提供貼文檢舉 (Report) 功能；支援針對特定用戶進行封鎖管理 (Blocklist)。
- 支援WebSocket 即時連線，優化社群互動體驗。

### 5. 架構分離與部署準備
- **前後端分離**：前端已從原有架構獨立為純 React + Vite 專案。
- **動態環境變數**：支援 `.env.development` 與 `.env.production`，包含動態 API URL 設定以及安全的 API Key 管理與 CORS 處理。
- **Capacitor 就緒**：已針對打包為 iOS PWA / Native App 進行準備與架構優化。
- **其它工具**：包含本地端的圖片壓縮處理上傳機制 (`/utils/compressImage.ts`) 等最佳化。

---

## 🚀 執行指令 (Scripts)

在專案目錄下，您可以使用以下指令：

- **啟動開發伺服器** (會讀取 `.env.development`)
  ```bash
  npm run dev
  ```
- **建立生產環境靜態檔案**
  ```bash
  npm run build
  ```
- **預覽生產環境建置結果**
  ```bash
  npm run preview
  ```

---

## 📁 專案重點目錄結構 (Directory Structure)

```text
frontend/
├── src/
│   ├── context/     # 全域狀態管理 (如 AppContext)
│   ├── locales/     # 存放各國語系檔 (zh.json, en.json, ja.json, ko.json)
│   ├── pages/       # 各獨立頁面元件 (如 Login.tsx 等)
│   ├── utils/       # 共用工具函式 (如 compressImage.ts)
│   └── ...
├── .env.development # 開發環境變數
├── .env.production  # 生產環境變數
├── vite.config.ts   # Vite 預設設定檔
└── package.json     # 專案依賴與腳本設定
```

## 📝 開發規範與約定
- **組件開發**：全面採用 Functional Component + Hooks，不再使用 Class Component。
- **類型定義**：Props 與 State 全面使用 TypeScript Interface / Type 進行強型別定義。
- **註解規範**：以標註設計原因為主 (Why)，複雜邏輯需附上詳細註解，未來可能擴充功能請標記 `// TODO:` 或以 `/** JS Doc */` 格式提供提示說明。
