import React, { useState } from 'react';
import { FoodMenuData, CategoryKey } from '../types';
import { CATEGORY_DEFINITIONS, DEFAULT_FOOD_DATA } from '../data/defaultFood';
import { X, Plus, RotateCcw, Trash2, Check, Sparkles } from 'lucide-react';

interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodData: FoodMenuData;
  onUpdateFoodData: (newData: FoodMenuData) => void;
  initialCategory?: CategoryKey;
}

export const MenuEditorModal: React.FC<MenuEditorModalProps> = ({
  isOpen,
  onClose,
  foodData,
  onUpdateFoodData,
  initialCategory = '한식',
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(initialCategory);
  const [newItemName, setNewItemName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentList = foodData[activeCategory] || [];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) return;

    if (currentList.includes(trimmed)) {
      setErrorMessage('이미 등록된 메뉴입니다.');
      return;
    }

    if (currentList.length >= 24) {
      setErrorMessage('한 카테고리당 최대 24개까지 등록 가능합니다.');
      return;
    }

    const updated = {
      ...foodData,
      [activeCategory]: [...currentList, trimmed],
    };
    onUpdateFoodData(updated);
    setNewItemName('');
    setErrorMessage('');
  };

  const handleDeleteItem = (itemToDelete: string) => {
    if (currentList.length <= 4) {
      setErrorMessage('룰렛을 위해 최소 4개 이상의 메뉴가 필요합니다.');
      return;
    }
    const updated = {
      ...foodData,
      [activeCategory]: currentList.filter(item => item !== itemToDelete),
    };
    onUpdateFoodData(updated);
    setErrorMessage('');
  };

  const handleResetCategory = () => {
    const updated = {
      ...foodData,
      [activeCategory]: [...DEFAULT_FOOD_DATA[activeCategory]],
    };
    onUpdateFoodData(updated);
    setErrorMessage('');
  };

  const handleResetAll = () => {
    if (window.confirm('모든 카테고리 메뉴를 기본값(16종)으로 초기화할까요?')) {
      onUpdateFoodData({ ...DEFAULT_FOOD_DATA });
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-orange-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#FFFBF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#FF5E3A]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-snug">메뉴 커스텀 관리</h3>
              <p className="text-xs text-gray-500">나만의 최애 메뉴를 추가하거나 안 먹는 메뉴를 제외해보세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {CATEGORY_DEFINITIONS.map(cat => {
            const count = (foodData[cat.key] || []).length;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setErrorMessage('');
                }}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#FF5E3A] text-white shadow-sm shadow-orange-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Add Form */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              placeholder={`새 ${activeCategory} 메뉴 이름 입력 (예: 치킨, 포케 등)`}
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value);
                setErrorMessage('');
              }}
              maxLength={12}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF5E3A] focus:ring-2 focus:ring-orange-100 text-sm font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#FF5E3A] text-white font-bold text-sm hover:bg-[#E04826] active:scale-95 transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </form>

          {errorMessage && (
            <p className="text-xs font-semibold text-rose-500 animate-in fade-in">
              ⚠️ {errorMessage}
            </p>
          )}

          {/* Menu Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                현재 등록된 메뉴 ({currentList.length}개)
              </span>
              <button
                onClick={handleResetCategory}
                className="text-xs text-gray-500 hover:text-orange-600 font-semibold flex items-center gap-1 transition"
                title={`${activeCategory} 기본 메뉴 16종으로 되돌리기`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                기본 16종 복구
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentList.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="group flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-orange-50/60 rounded-xl border border-gray-100 hover:border-orange-200 transition"
                >
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {item}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="opacity-40 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded-lg transition"
                    title="메뉴 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handleResetAll}
            className="text-xs text-gray-400 hover:text-red-500 font-medium transition"
          >
            전체 초기화
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
