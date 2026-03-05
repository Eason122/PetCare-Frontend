import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Bell, Activity, Scale, Calendar as CalendarIcon, Lightbulb, Clock, MapPin } from 'lucide-react';
import { format, addDays, isBefore, differenceInYears, differenceInMonths, differenceInDays, subYears, subMonths } from 'date-fns';
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

/**
 * 根據生日精確計算寵物年齡（歲、月、日）
 * @param birthday ISO 日期字串（例如 '2020-06-15'）
 * @returns 包含 years, months, days 的物件
 */
function calculatePetAge(birthday: string): { years: number; months: number; days: number } {
  const birthDate = new Date(birthday);
  const today = new Date();

  const years = differenceInYears(today, birthDate);
  const afterYears = subYears(today, years);
  const months = differenceInMonths(afterYears, birthDate);
  const afterMonths = subMonths(afterYears, months);
  const days = differenceInDays(afterMonths, birthDate);

  return { years, months, days };
}

export default function Home() {
  const { user, pets, selectedPetId, setSelectedPetId, token, healthRecords, appointments } = useAppContext();
  const navigate = useNavigate();
  const [trivia, setTrivia] = useState<string>('載入中...');
  const [dailySummary, setDailySummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

  /**
   * AI 每日照護建議
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
        const fallbackMessages = [
          `記得定期檢查 ${selectedPet.name} 的健康狀況，維持規律飲食與運動習慣。`,
          `${selectedPet.name} 目前體重 ${selectedPet.weight}kg，這是一個很棒的狀態！`,
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
   * AI 寵物小知識
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

  const upcomingAppointments = appointments
    .filter(a => {
      if (selectedPetId && a.petId !== selectedPetId) return false;
      const appointmentDate = new Date(a.date);
      const now = new Date();
      const nextWeek = addDays(now, 7);
      return appointmentDate >= now && appointmentDate <= nextWeek;
    })
    .slice(0, 3);

  // === 無寵物狀態 ===
  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#FFF7ED] dark:bg-gray-900 transition-colors">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-[32px] flex items-center justify-center mb-6 animate-fade-in-up">
          <Plus className="w-12 h-12 text-orange-500 dark:text-orange-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3 animate-fade-in-up delay-100">歡迎來到 PetCare</h2>
        <p className="text-slate-500 dark:text-gray-400 mb-10 text-lg leading-relaxed animate-fade-in-up delay-200">陪伴每一個微小而珍貴的生命。請先建立您專屬的毛孩檔案。</p>
        <button
          onClick={() => navigate('/profile')}
          className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:bg-orange-600 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up delay-300"
        >
          新增寵物
        </button>
      </div>
    );
  }

  // === 溫馨首頁 (Nature Distilled + Motion Driven) ===
  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-gray-900 transition-colors font-sans">

      {/* 頂部 Hero 區塊與寵物輪播 */}
      <div className="bg-[#FFF7ED] dark:bg-slate-800 px-5 pt-10 pb-6 rounded-b-[40px] shadow-sm z-10 transition-colors relative overflow-hidden">
        {/* 背景裝飾光暈 */}
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-orange-200/50 dark:bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">{format(new Date(), 'yyyy/MM/dd')}</p>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{getGreeting()}, {user?.name}</h1>
          </div>
          <button className="w-12 h-12 flex items-center justify-center bg-white/60 dark:bg-slate-700/60 backdrop-blur-md rounded-2xl text-slate-600 dark:text-slate-300 shadow-sm hover:bg-white dark:hover:bg-slate-600 transition-all cursor-pointer relative">
            <Bell className="w-6 h-6" />
            {upcomingAppointments.length > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            )}
          </button>
        </div>

        {/* 動態寵物卡片 (Motion-Driven) */}
        <div className="flex space-x-5 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x relative z-10">
          {pets.map((pet, index) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`flex flex-col items-center min-w-[80px] snap-center transition-all duration-300 ease-out animate-fade-in-up opacity-0`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-20 h-20 rounded-[28px] overflow-hidden shadow-sm transition-all duration-300 ${selectedPetId === pet.id
                    ? 'ring-4 ring-orange-500 dark:ring-orange-400 ring-offset-2 dark:ring-offset-slate-800 scale-105 shadow-md shadow-orange-500/20'
                    : 'border-2 border-transparent scale-95 opacity-80 hover:scale-100 hover:opacity-100'
                  }`}
              >
                {pet.avatar ? (
                  <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-orange-600 dark:text-orange-300 font-bold text-2xl">
                    {pet.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className={`mt-3 text-sm font-bold transition-colors ${selectedPetId === pet.id ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {pet.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center min-w-[80px] snap-center opacity-0 animate-fade-in-up group"
            style={{ animationDelay: `${pets.length * 100}ms` }}
          >
            <div className="w-20 h-20 rounded-[28px] border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all duration-300 scale-95 group-hover:scale-100">
              <Plus className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 transition-colors" />
            </div>
            <span className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-orange-500 transition-colors">新增</span>
          </button>
        </div>
      </div>

      {/* 溫馨 Bento Box 內容區 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* === AI 每日建議 (Bento Card 1) === */}
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-[32px] p-6 text-white shadow-[0_10px_30px_rgb(37,99,235,0.2)] animate-fade-in-up opacity-0 delay-200 cursor-pointer hover:shadow-[0_15px_40px_rgb(37,99,235,0.3)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-200" />
              今日照護建議
            </h2>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xs font-bold text-white">AI</span>
            </div>
          </div>
          {isSummaryLoading ? (
            <div className="flex items-center space-x-3 py-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-blue-100 text-sm font-medium">守護精靈分析中...</span>
            </div>
          ) : (
            <p className="text-blue-50 text-[15px] leading-relaxed font-medium">
              {dailySummary}
            </p>
          )}
        </div>

        {/* === 小知識 (Bento Card 2) === */}
        <div className="bg-[#FEF3C7] dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 rounded-[32px] p-5 shadow-sm flex items-start animate-fade-in-up opacity-0 delay-300 hover:shadow-md transition-shadow">
          <div className="bg-amber-100 dark:bg-amber-800/50 p-3 rounded-2xl mr-4 flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="pt-0.5">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-500 mb-1.5 flex items-center">
              寵物小知識
            </h3>
            <p className="text-[13px] text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">{trivia}</p>
          </div>
        </div>

        {/* === Grid Stats (Bento Row) === */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up opacity-0 delay-400">
          {/* 體重卡 */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-[18px] flex items-center justify-center mb-3 text-blue-500 dark:text-blue-400">
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">體重</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{selectedPet?.weight} <span className="text-sm font-bold text-slate-400">kg</span></span>
          </div>

          {/* 年齡卡 */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50 transition-all duration-300">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-[18px] flex items-center justify-center mb-3 text-orange-500 dark:text-orange-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">年齡</span>
            {selectedPet?.birthday ? (() => {
              const age = calculatePetAge(selectedPet.birthday);
              return (
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{age.years} <span className="text-sm font-bold text-slate-400">歲</span></span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium mt-0.5">
                    {age.months}個月 {age.days}天
                  </span>
                </div>
              );
            })() : (
              <span className="text-2xl font-black text-slate-800 dark:text-white">? <span className="text-sm font-bold text-slate-400">歲</span></span>
            )}
          </div>
        </div>

        {/* === 體重趨勢圖 (Bento Card 3) === */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/50 transition-all duration-300 hover:shadow-md animate-fade-in-up opacity-0" style={{ animationDelay: '500ms' }}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center">
            體重變化趨勢
          </h3>
          {weightData.length > 1 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '12px' }}
                    itemStyle={{ color: '#2563EB' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#2563EB" strokeWidth={4} dot={{ r: 5, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#F97316' }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
              <Scale className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">尚無足夠紀錄可繪製圖表</p>
              <p className="text-xs mt-1.5 font-medium">記錄超過兩筆體重將自動生成趨勢分析</p>
            </div>
          )}
        </div>

        {/* === 預約與提醒 (Bento Row) === */}
        <div className="space-y-4 animate-fade-in-up opacity-0 pb-6" style={{ animationDelay: '600ms' }}>
          {/* 即將到來的預約 */}
          {upcomingAppointments.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                近期預約
              </h3>
              <div className="space-y-3">
                {upcomingAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center p-4 rounded-[24px] bg-[#FFF7ED] dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 group cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                    <div className="w-1.5 h-12 rounded-full mr-4 bg-orange-500 group-hover:scale-y-110 transition-transform"></div>
                    <div className="flex-1">
                      <h4 className="text-[15px] font-bold text-slate-800 dark:text-white mb-0.5">{apt.title}</h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center">
                        <CalendarIcon className="w-3.5 h-3.5 mr-1 text-orange-400" />{apt.date} {apt.time}
                        {apt.location && (
                          <span className="ml-3 flex items-center"><MapPin className="w-3.5 h-3.5 mr-0.5 text-orange-400" />{apt.location}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 疫苗/待辦提醒 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">待辦提醒</h3>
            <div className="space-y-3">
              {selectedPet?.vaccines?.map(vaccine => {
                if (!vaccine.nextDueDate) return null;
                const isUrgent = isBefore(new Date(vaccine.nextDueDate), addDays(new Date(), 14));
                return (
                  <div key={vaccine.id} className="flex items-center p-4 rounded-[24px] bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                    <div className={`w-1.5 h-12 rounded-full mr-4 ${isUrgent ? 'bg-red-500' : 'bg-[#10B981]'}`}></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{vaccine.name}</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">下次施打: {vaccine.nextDueDate}</p>
                    </div>
                    {isUrgent && <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-800">即將到期</span>}
                  </div>
                );
              })}
              {(!selectedPet?.vaccines || selectedPet.vaccines.length === 0) && (
                <div className="flex items-center justify-center py-4 text-sm font-medium text-slate-400 dark:text-slate-500">
                  目前沒有即將到期的提醒 ✅
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
