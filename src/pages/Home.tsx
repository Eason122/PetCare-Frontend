import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Bell, Activity, Scale, Calendar as CalendarIcon, Lightbulb, Clock, MapPin } from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/**
 * 根據目前時段回傳對應問候語
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚安';
}

export default function Home() {
  const { user, pets, selectedPetId, setSelectedPetId, token, healthRecords, appointments } = useAppContext();
  const navigate = useNavigate();
  const [trivia, setTrivia] = useState<string>('載入中...');
  const [dailySummary, setDailySummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

  /**
   * AI 每日照護建議（透過後端 API 代理，不暴露 API Key）
   */
  useEffect(() => {
    const fetchDailySummary = async () => {
      if (!selectedPet) {
        setDailySummary('');
        setIsSummaryLoading(false);
        return;
      }

      setIsSummaryLoading(true);
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/ai/daily-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ petId: selectedPet.id }),
        });

        if (res.ok) {
          const data = await res.json();
          setDailySummary(data.summary);
        } else {
          throw new Error('Failed to fetch summary');
        }
      } catch (error) {
        console.error('Failed to fetch daily summary:', error);
        // HACK: 後端不可用時使用靜態 fallback
        const fallbackMessages = [
          `記得定期檢查 ${selectedPet.name} 的健康狀況。可前往 AI 分析上傳照片進行健康評估。`,
          `${selectedPet.name} 體重 ${selectedPet.weight}kg。建議維持規律飲食與運動習慣，定期量測體重追蹤變化。`,
          `保持 ${selectedPet.name} 的飲水充足很重要。每公斤體重約需 50ml 水分攝取量。`,
        ];
        setDailySummary(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
      } finally {
        setIsSummaryLoading(false);
      }
    };

    fetchDailySummary();
  }, [selectedPet?.id, token]);

  /**
   * AI 寵物小知識（透過後端 API 代理）
   */
  useEffect(() => {
    const fetchTrivia = async () => {
      if (!selectedPet) return;

      try {
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/ai/trivia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ species: selectedPet.species }),
        });

        if (res.ok) {
          const data = await res.json();
          setTrivia(data.trivia);
        } else {
          setTrivia('你知道嗎？定期帶寵物健康檢查能有效預防疾病喔！');
        }
      } catch (error) {
        console.error('Failed to fetch trivia:', error);
        setTrivia('你知道嗎？定期帶寵物健康檢查能有效預防疾病喔！');
      }
    };

    fetchTrivia();
  }, [selectedPet?.species, token]);

  // NOTE: 使用真實 healthRecords 資料繪製體重圖表，若無紀錄則顯示當前體重
  const petHealthRecords = healthRecords
    .filter(r => r.petId === selectedPetId && r.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  const weightData = petHealthRecords.length > 0
    ? petHealthRecords.map(r => ({
      name: format(new Date(r.date), 'MM/dd'),
      weight: r.weight!
    }))
    : selectedPet?.weight
      ? [{ name: '目前', weight: selectedPet.weight }]
      : [];

  // 即將到來的預約（未來 7 天內）
  const upcomingAppointments = appointments
    .filter(a => {
      if (selectedPetId && a.petId !== selectedPetId) return false;
      const appointmentDate = new Date(a.date);
      const now = new Date();
      const nextWeek = addDays(now, 7);
      return appointmentDate >= now && appointmentDate <= nextWeek;
    })
    .slice(0, 3);

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
          <Plus className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">歡迎來到 PetCare Pro</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">您還沒有新增任何寵物，請先建立寵物檔案開始使用。</p>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 transition-colors"
        >
          新增寵物
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header & Pet Selector */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm rounded-b-3xl z-10 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {user?.name}</h1>
          <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 relative">
            <Bell className="w-5 h-5" />
            {upcomingAppointments.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`flex flex-col items-center min-w-[72px] space-y-2 transition-transform ${selectedPetId === pet.id ? 'scale-110' : 'opacity-70'}`}
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${selectedPetId === pet.id ? 'border-indigo-600 dark:border-indigo-400' : 'border-transparent'}`}>
                {pet.avatar ? (
                  <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                    {pet.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium ${selectedPetId === pet.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {pet.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center min-w-[72px] space-y-2 opacity-70 hover:opacity-100"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">新增</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Daily Summary — AI 根據寵物真實資料動態生成 */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              今日照護建議
            </h2>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{format(new Date(), 'MM/dd')}</span>
          </div>
          {isSummaryLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              <span className="text-indigo-100 text-sm">根據 {selectedPet?.name} 的資料分析中...</span>
            </div>
          ) : (
            <p className="text-indigo-50 text-sm leading-relaxed">
              {dailySummary}
            </p>
          )}
        </div>

        {/* Pet Trivia */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/50 rounded-3xl p-5 shadow-sm flex items-start">
          <div className="bg-yellow-100 dark:bg-yellow-800/50 p-2 rounded-full mr-3 flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1">寵物小知識</h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">{trivia}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-colors">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-blue-500 dark:text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">體重</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedPet?.weight} kg</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-colors">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-2 text-orange-500 dark:text-orange-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">年齡</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedPet?.birthday ?
                Math.floor((new Date().getTime() - new Date(selectedPet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365))
                : '?'} 歲
            </span>
          </div>
        </div>

        {/* Weight Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">體重變化趨勢</h3>
          {weightData.length > 1 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500 dark:text-gray-400">
              <Scale className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">新增健康紀錄以追蹤體重變化</p>
              <p className="text-xs mt-1">前往「個人檔案」新增健康紀錄</p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" />
              即將到來的預約
            </h3>
            <div className="space-y-3">
              {upcomingAppointments.map(apt => (
                <div key={apt.id} className="flex items-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                  <div className="w-2 h-10 rounded-full mr-3 bg-indigo-500"></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{apt.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                      <CalendarIcon className="w-3 h-3 mr-1" />{apt.date} {apt.time}
                      {apt.location && (
                        <span className="ml-2 flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{apt.location}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminders */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">近期提醒</h3>
          <div className="space-y-3">
            {selectedPet?.vaccines?.map(vaccine => {
              if (!vaccine.nextDueDate) return null;
              const isUrgent = isBefore(new Date(vaccine.nextDueDate), addDays(new Date(), 14));
              return (
                <div key={vaccine.id} className="flex items-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                  <div className={`w-2 h-10 rounded-full mr-3 ${isUrgent ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{vaccine.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">下次施打: {vaccine.nextDueDate}</p>
                  </div>
                  {isUrgent && <span className="text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg">即將到期</span>}
                </div>
              );
            })}
            {(!selectedPet?.vaccines || selectedPet.vaccines.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">目前沒有即將到期的提醒</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
