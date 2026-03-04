/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import MapPage from './pages/Map';
import Community from './pages/Community';
import AIHealth from './pages/AIHealth';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Payment from './pages/Payment';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppContext();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Toast 全域通知元件
 * 顯示於畫面底部，自動消失
 */
function ToastContainer() {
  const { toasts } = useAppContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`animate-toast-in pointer-events-auto px-5 py-3 rounded-2xl shadow-lg text-sm font-medium backdrop-blur-sm max-w-xs text-center ${toast.type === 'success'
            ? 'bg-green-600/90 text-white'
            : toast.type === 'error'
              ? 'bg-red-600/90 text-white'
              : 'bg-gray-800/90 text-white dark:bg-gray-200/90 dark:text-gray-900'
            }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* 公開頁面：隱私權政策與服務條款（App Store 要求） */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="map" element={<MapPage />} />
          <Route path="community" element={<Community />} />
          <Route path="ai-health" element={<AIHealth />} />
          <Route path="profile" element={<Profile />} />
          <Route path="payment" element={<Payment />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
