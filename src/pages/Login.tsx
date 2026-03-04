import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const [error, setError] = useState('');

  /**
   * 表單驗證：密碼至少 6 字元、Email 格式、帳戶 ID 必填
   */
  const validate = (): string | null => {
    if (isRegister) {
      if (!email.trim()) return '請輸入 Email';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email 格式不正確';
      if (!accountId.trim()) return '請輸入帳戶 ID';
    } else {
      if (!loginId.trim()) return '請輸入 Email 或帳戶 ID';
    }
    if (password.length < 6) return '密碼至少需要 6 個字元';
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

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error || '登入失敗');
      }
    } catch (e) {
      setError('網路錯誤，請稍後再試');
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
          全方位寵物管理與AI健康分析平台
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
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="your@email.com"
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
                      required
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
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="輸入 Email 或帳戶 ID"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密碼
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
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
                    處理中...
                  </>
                ) : (
                  isRegister ? '註冊' : '登入'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
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
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {isRegister ? '返回登入' : '建立新帳號'}
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
