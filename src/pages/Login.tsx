import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { PawPrint, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [error, setError] = useState('');

  /**
   * 表單驗證：密碼至少 6 字元、Email 格式、帳戶 ID 必填
   */
  const validate = (): string | null => {
    if (isRegister) {
      if (!email.trim()) return t('login.err_email_req');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('login.err_email_fmt');
      if (!accountId.trim()) return t('login.err_id_req');
    } else {
      if (!loginId.trim()) return t('login.err_login_id_req');
    }
    if (password.length < 6) return t('login.err_pwd_len');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

      let body: any = { password };
      if (isRegister) {
        body.email = email;
        body.account_id = accountId;
      } else {
        if (loginId.includes('@')) {
          body.email = loginId;
        } else {
          body.account_id = loginId;
        }
      }

      const res = await fetch(import.meta.env.VITE_API_BASE_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error || t('login.err_login_fail'));
      }
    } catch (e) {
      setError(t('login.err_network'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 max-w-md mx-auto shadow-xl transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-4">
          <PawPrint className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          PetCare Pro
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-indigo-100 dark:border-gray-700 transition-colors">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            {isRegister ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder={t('login.email_placeholder')}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    帳戶 ID (唯一值，用於加好友)
                  </label>
                  <div className="mt-1">
                    <input
                      id="accountId"
                      name="accountId"
                      type="text"
                      autoComplete="username"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="例如: my_pet_id_123"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email 或 帳戶 ID
                </label>
                <div className="mt-1">
                  <input
                    id="loginId"
                    name="loginId"
                    type="text"
                    autoComplete="username"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder={t('login.email_placeholder')}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('login.password_placeholder')}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">密碼至少需要 6 個字元</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('login.processing')}
                  </>
                ) : (
                  isRegister ? t('login.register_btn') : t('login.login_btn')
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                  {t('login.social_login')}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => window.location.href = import.meta.env.VITE_OAUTH_FACEBOOK_URL || '#'}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm bg-[#1877F2] hover:bg-[#166FE5] transition-colors"
                aria-label="使用 Facebook 登入"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => window.location.href = import.meta.env.VITE_OAUTH_GOOGLE_URL || '#'}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                aria-label="使用 Google 登入"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => window.location.href = import.meta.env.VITE_OAUTH_APPLE_URL || '#'}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm bg-black hover:bg-gray-900 transition-colors"
                aria-label="使用 Apple 登入"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16.365 7.043c-.889.043-2.143-.473-2.87-1.124-.658-.616-1.156-1.57-.966-2.529.98.055 2.126.657 2.768 1.282.607.593 1.155 1.545.968 2.371h.1zm.55 1.346c-1.372 0-2.536.878-3.167.878-.631 0-1.631-.795-2.738-.77-1.455.02-2.8.84-3.551 2.143-1.521 2.637-.389 6.536 1.096 8.683.722 1.047 1.572 2.212 2.71 2.168 1.094-.044 1.52-.708 2.842-.708 1.32 0 1.708.708 2.862.686 1.178-.02 1.908-1.071 2.608-2.095.81-1.179 1.144-2.324 1.166-2.383-.024-.01-2.227-.852-2.251-3.398-.02-2.115 1.731-3.15 1.776-3.176-1.002-1.474-2.56-1.66-3.123-1.7zm1.141-5.115C19.124.966 21 0 21 0M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12z" clipRule="evenodd" fillRule="evenodd" />
                  <path d="M12.152 20.155c-1.153.022-1.542-.686-2.862-.686-1.32 0-1.748.664-2.841.708-1.139.044-1.989-1.121-2.71-2.168-1.485-2.147-2.617-6.046-1.096-8.683.751-1.303 2.096-2.123 3.55-2.143 1.108-.025 2.108.77 2.739.77.63 0 1.794-.878 3.166-.878.563.01 2.121.196 3.123 1.7-.045.026-1.795 1.06-1.776 3.176.024 2.546 2.227 3.388 2.252 3.398-.023.059-.356 1.204-1.167 2.383-.7 1.024-1.43 2.075-2.608 2.095" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                  {isRegister ? '已經有帳號了？' : '還沒有帳號？'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  if (!isRegister) {
                    if (loginId.includes('@')) {
                      setEmail(loginId);
                    } else if (loginId.trim()) {
                      setAccountId(loginId);
                    }
                  } else {
                    setLoginId(email || accountId);
                  }
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="w-full flex justify-center py-3 px-4 border border-indigo-200 dark:border-gray-600 rounded-xl shadow-sm text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                aria-label={isRegister ? t('login.back_to_login') : t('login.create_account')}
              >
                {isRegister ? t('login.back_to_login') : t('login.create_account')}
              </button>
            </div>
          </div>

          {/* 隱私權政策與服務條款連結 */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
            <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline">隱私權政策</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline">服務條款</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
