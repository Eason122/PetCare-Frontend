import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, LogOut, Crown, Plus, Edit2, Trash2, ChevronRight, Settings, X, Shield, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pet } from '../types';

export default function Profile() {
  const { user, logout, updateUser, deleteAccount, pets, addPet, updatePet, deletePet, setSelectedPetId, friends, removeFriend } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isEditingPet, setIsEditingPet] = useState<string | null>(null);
  const [isAddingPet, setIsAddingPet] = useState(false);

  // 帳號設定狀態
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [petForm, setPetForm] = useState<Partial<Pet>>({
    name: '',
    species: 'dog',
    breed: '',
    birthday: '',
    weight: 0,
    vaccines: []
  });

  // 寵物表單驗證
  const [petFormErrors, setPetFormErrors] = useState<Record<string, string>>({});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * 驗證寵物表單：名稱必填、體重需為正數
   */
  const validatePetForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!petForm.name?.trim()) {
      errors.name = '請輸入寵物名稱';
    }
    if (petForm.weight !== undefined && petForm.weight < 0) {
      errors.weight = '體重不能為負數';
    }
    if (!petForm.breed?.trim()) {
      errors.breed = '請輸入品種';
    }
    setPetFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePet = () => {
    if (!validatePetForm()) return;

    if (isEditingPet) {
      updatePet(isEditingPet, petForm);
      setIsEditingPet(null);
    } else {
      addPet(petForm as Omit<Pet, 'id' | 'userId'>);
      setIsAddingPet(false);
    }
    setPetForm({ name: '', species: 'dog', breed: '', birthday: '', weight: 0, vaccines: [] });
    setPetFormErrors({});
  };

  const handleEditPet = (pet: Pet) => {
    setPetForm(pet);
    setIsEditingPet(pet.id);
    setPetFormErrors({});
  };

  const handleDeletePet = (id: string) => {
    if (window.confirm('確定要刪除這隻寵物嗎？')) {
      deletePet(id);
    }
  };



  const handleSaveName = async () => {
    if (editName.trim() && editName.trim() !== user?.name) {
      await updateUser(editName.trim());
    }
  };

  /**
   * 帳號刪除流程：需輸入「刪除帳號」確認文字
   * Apple / Google App Store 合規要求
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirmText === '刪除帳號') {
      await deleteAccount();
      navigate('/login');
    }
  };

  if (isAddingPet || isEditingPet) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditingPet ? '編輯寵物' : '新增寵物'}</h1>
          <button
            onClick={() => { setIsAddingPet(false); setIsEditingPet(null); setPetFormErrors({}); }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            取消
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 overflow-hidden cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              {petForm.avatar ? (
                <img src={petForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Plus className="w-6 h-6 text-indigo-400 dark:text-indigo-500 mx-auto mb-1" />
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">上傳照片</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPetForm({ ...petForm, avatar: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名字 *</label>
            <input
              type="text"
              value={petForm.name}
              onChange={e => { setPetForm({ ...petForm, name: e.target.value }); setPetFormErrors({ ...petFormErrors, name: '' }); }}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white ${petFormErrors.name ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
            />
            {petFormErrors.name && <p className="text-xs text-red-500 mt-1">{petFormErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">種類</label>
              <select
                value={petForm.species}
                onChange={e => setPetForm({ ...petForm, species: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white"
              >
                <option value="dog">狗</option>
                <option value="cat">貓</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">品種 *</label>
              <input
                type="text"
                value={petForm.breed}
                onChange={e => { setPetForm({ ...petForm, breed: e.target.value }); setPetFormErrors({ ...petFormErrors, breed: '' }); }}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white ${petFormErrors.breed ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
              />
              {petFormErrors.breed && <p className="text-xs text-red-500 mt-1">{petFormErrors.breed}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">生日</label>
              <input
                type="date"
                value={petForm.birthday}
                onChange={e => setPetForm({ ...petForm, birthday: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">體重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={petForm.weight || ''}
                onChange={e => { setPetForm({ ...petForm, weight: parseFloat(e.target.value) || 0 }); setPetFormErrors({ ...petFormErrors, weight: '' }); }}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white ${petFormErrors.weight ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
              />
              {petFormErrors.weight && <p className="text-xs text-red-500 mt-1">{petFormErrors.weight}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">疫苗與驅蟲紀錄</label>
              <button
                type="button"
                onClick={() => setPetForm({
                  ...petForm,
                  vaccines: [...(petForm.vaccines || []), { id: Date.now().toString(), name: '', date: '', nextDueDate: '' }]
                })}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" /> 新增紀錄
              </button>
            </div>

            <div className="space-y-3">
              {(petForm.vaccines || []).map((vaccine, index) => (
                <div key={vaccine.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 relative transition-colors">
                  <button
                    type="button"
                    onClick={() => setPetForm({
                      ...petForm,
                      vaccines: petForm.vaccines?.filter((_, i) => i !== index)
                    })}
                    className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="項目名稱 (例如: 狂犬病疫苗)"
                    value={vaccine.name}
                    onChange={e => {
                      const newVaccines = [...(petForm.vaccines || [])];
                      newVaccines[index].name = e.target.value;
                      setPetForm({ ...petForm, vaccines: newVaccines });
                    }}
                    className="w-full px-3 py-2 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">施打日期</span>
                      <input
                        type="date"
                        value={vaccine.date}
                        onChange={e => {
                          const newVaccines = [...(petForm.vaccines || [])];
                          newVaccines[index].date = e.target.value;
                          setPetForm({ ...petForm, vaccines: newVaccines });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">下次到期日</span>
                      <input
                        type="date"
                        value={vaccine.nextDueDate || ''}
                        onChange={e => {
                          const newVaccines = [...(petForm.vaccines || [])];
                          newVaccines[index].nextDueDate = e.target.value;
                          setPetForm({ ...petForm, vaccines: newVaccines });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSavePet}
            className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            儲存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-6 shadow-sm z-10 rounded-b-3xl transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
          <button
            onClick={() => { setIsAccountSettingsOpen(!isAccountSettingsOpen); setEditName(user?.name || ''); }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white dark:border-gray-800">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              {user?.name}
              {user?.isVip && <Crown className="w-5 h-5 ml-2 text-yellow-500" />}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            {user?.account_id && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">帳戶 ID:</span> {user.account_id}
              </p>
            )}
            {!user?.isVip && (
              <button
                onClick={() => navigate('/payment')}
                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                升級 VIP 享受無限 AI 分析
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Account Settings Panel */}
        {isAccountSettingsOpen && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-500" />
              帳號設定
            </h3>

            {/* 修改名稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">顯示名稱</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleSaveName}
                  disabled={!editName.trim() || editName.trim() === user?.name}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                >
                  儲存
                </button>
              </div>
            </div>

            {/* 刪除帳號（App Store 合規要求） */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full flex items-center justify-center py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                刪除帳號
              </button>
            </div>
          </div>
        )}

        {/* Pets List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.my_pets')}</h3>
            <button
              onClick={() => setIsAddingPet(true)}
              className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <Plus className="w-4 h-4 mr-1" /> 新增
            </button>
          </div>

          <div className="space-y-3">
            {pets.map(pet => (
              <div key={pet.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group transition-colors">
                <div className="flex items-center space-x-4 flex-1 cursor-pointer" onClick={() => setSelectedPetId(pet.id)}>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border-2 border-indigo-100 dark:border-indigo-800/50">
                    {pet.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">{pet.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pet.breed} • {pet.weight} kg</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPet(pet)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePet(pet.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {pets.length === 0 && (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                <p className="text-gray-500 dark:text-gray-400 mb-2">尚未新增寵物</p>
                <button
                  onClick={() => setIsAddingPet(true)}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  立即新增
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.my_friends')}</h3>
          </div>
          <div className="space-y-3">
            {friends && friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {friend.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
                        {friend.name}
                        {friend.isVip && <Crown className="w-4 h-4 ml-1 text-yellow-500" />}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('確定要解除好友關係嗎？')) {
                        removeFriend(friend.id);
                      }
                    }}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                <p className="text-gray-500 dark:text-gray-400 mb-2">尚未新增好友</p>
                <button
                  onClick={() => navigate('/community')}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  前往社群尋找好友
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settings Menu */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <Link to="/privacy" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Shield className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{t('profile.privacy')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>
          <Link to="/terms" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FileText className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{t('profile.terms')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">{t('profile.logout')}</span>
            </div>
          </button>
        </div>
      </div>



      {/* Delete Account Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">刪除帳號</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">此操作無法撤銷</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              刪除帳號後，所有個人資料、寵物資料、貼文、聊天記錄等將被<strong>永久刪除</strong>且無法恢復。
              請輸入「<strong>刪除帳號</strong>」以確認。
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="輸入「刪除帳號」以確認"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white text-sm mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => { setIsDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '刪除帳號'}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
