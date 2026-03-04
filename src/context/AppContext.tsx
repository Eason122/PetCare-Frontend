import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Pet, AIAnalysis, Post, Appointment, HealthRecord, Toast } from '../types';

interface AppContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  upgradeToVip: () => Promise<void>;
  updateUser: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;

  pets: Pet[];
  selectedPetId: string | null;
  setSelectedPetId: (id: string) => void;
  addPet: (pet: Omit<Pet, 'id' | 'userId'>) => Promise<void>;
  updatePet: (id: string, pet: Partial<Pet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;

  aiHistory: AIAnalysis[];
  addAIAnalysis: (analysis: Omit<AIAnalysis, 'id' | 'userId' | 'date'>) => Promise<void>;
  getRemainingAILimit: () => number;

  posts: Post[];
  fetchPosts: () => Promise<void>;
  addPost: (post: { content: string, imageUrl?: string }) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  commentPost: (postId: string, content: string) => Promise<void>;

  appointments: Appointment[];
  fetchAppointments: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'userId'>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  healthRecords: HealthRecord[];
  fetchHealthRecords: () => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'userId'>) => Promise<void>;
  deleteHealthRecord: (id: string) => Promise<void>;

  friends: User[];
  fetchFriends: () => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;

  token: string | null;

  /** 全域 Toast 通知 */
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('petcare_token'));
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(localStorage.getItem('petcare_selected_pet'));
  const [aiHistory, setAiHistory] = useState<AIAnalysis[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  /**
   * 顯示 Toast 通知，3 秒後自動消失
   */
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    if (token) {
      fetch(import.meta.env.VITE_API_BASE_URL + '/api/auth/me', { headers: authHeaders })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then(data => setUser(data.user))
        .catch(() => logout());

      fetchPets();
      fetchAIHistory();
      fetchPosts();
      fetchAppointments();
      fetchHealthRecords();
      fetchFriends();
    }
  }, [token]);

  useEffect(() => {
    if (selectedPetId) {
      localStorage.setItem('petcare_selected_pet', selectedPetId);
    }
  }, [selectedPetId]);

  const fetchPets = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/pets', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPets(data);
        if (!selectedPetId && data.length > 0) {
          setSelectedPetId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAIHistory = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/ai/history', { headers: authHeaders });
      if (res.ok) {
        setAiHistory(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/posts', { headers: authHeaders });
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/appointments', { headers: authHeaders });
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/health_records', { headers: authHeaders });
      if (res.ok) {
        setHealthRecords(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/friends', { headers: authHeaders });
      if (res.ok) {
        setFriends(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('petcare_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('petcare_token');
    localStorage.removeItem('petcare_selected_pet');
    setToken(null);
    setUser(null);
    setPets([]);
    setSelectedPetId(null);
    setAiHistory([]);
    setPosts([]);
    setAppointments([]);
    setHealthRecords([]);
    setFriends([]);
  };

  const upgradeToVip = async () => {
    if (!user) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/auth/vip', { method: 'POST', headers: authHeaders });
      if (res.ok) {
        setUser({ ...user, isVip: true });
        showToast('升級 VIP 成功！', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('升級失敗，請稍後再試', 'error');
    }
  };

  /**
   * 修改使用者名稱
   */
  const updateUser = async (name: string) => {
    if (!user) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, name: data.name });
        showToast('名稱已更新', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('更新失敗，請稍後再試', 'error');
    }
  };

  /**
   * 刪除帳號及所有關聯資料（Apple / Google App Store 合規要求）
   */
  const deleteAccount = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/auth/account', {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        logout();
      }
    } catch (e) {
      console.error(e);
      showToast('刪除帳號失敗，請稍後再試', 'error');
    }
  };

  const addPet = async (petData: Omit<Pet, 'id' | 'userId'>) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/pets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(petData)
      });
      if (res.ok) {
        await fetchPets();
        showToast('寵物已新增', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('新增失敗', 'error');
    }
  };

  const updatePet = async (id: string, petData: Partial<Pet>) => {
    try {
      const res = await fetch(`/api/pets/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(petData)
      });
      if (res.ok) {
        await fetchPets();
        showToast('寵物資料已更新', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('更新失敗', 'error');
    }
  };

  const deletePet = async (id: string) => {
    try {
      const res = await fetch(`/api/pets/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setPets(pets.filter(p => p.id !== id));
        if (selectedPetId === id) {
          setSelectedPetId(pets.length > 1 ? pets.find(p => p.id !== id)?.id || null : null);
        }
        showToast('寵物已刪除', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addAIAnalysis = async (analysisData: Omit<AIAnalysis, 'id' | 'userId' | 'date'>) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/ai/analyze', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ petId: analysisData.petId, image: analysisData.imageUrl, result: analysisData.result })
      });
      if (res.ok) {
        await fetchAIHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRemainingAILimit = () => {
    if (!user) return 0;
    const limit = user.isVip ? 10 : 3;
    const today = new Date().toISOString().split('T')[0];
    const usedToday = aiHistory.filter(h => h.date.startsWith(today)).length;
    return Math.max(0, limit - usedToday);
  };

  const addPost = async (postData: { content: string, imageUrl?: string }) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/posts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(postData)
      });
      if (res.ok) {
        await fetchPosts();
        showToast('動態已發佈', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('發佈失敗', 'error');
    }
  };

  const likePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const commentPost = async (postId: string, content: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'userId'>) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/appointments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(appointment)
      });
      if (res.ok) {
        await fetchAppointments();
        showToast('預約已新增', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('新增預約失敗', 'error');
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        await fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'userId'>) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/health_records', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(record)
      });
      if (res.ok) {
        await fetchHealthRecords();
        showToast('健康紀錄已新增', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('新增紀錄失敗', 'error');
    }
  };

  const deleteHealthRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/health_records/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        await fetchHealthRecords();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/friends', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        await fetchFriends();
        showToast('好友已新增', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const res = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        await fetchFriends();
        showToast('已解除好友關係', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider value={{
      user, login, logout, upgradeToVip, updateUser, deleteAccount,
      pets, selectedPetId, setSelectedPetId, addPet, updatePet, deletePet,
      aiHistory, addAIAnalysis, getRemainingAILimit,
      posts, fetchPosts, addPost, likePost, commentPost,
      appointments, fetchAppointments, addAppointment, deleteAppointment,
      healthRecords, fetchHealthRecords, addHealthRecord, deleteHealthRecord,
      friends, fetchFriends, addFriend, removeFriend,
      token,
      toasts, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
