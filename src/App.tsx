import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCw,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Compass,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { CategoryKey, FoodMenuData } from './types';
import {
  CATEGORY_DEFINITIONS,
  DEFAULT_FOOD_DATA,
  MENU_SLICE_COLORS,
} from './data/defaultFood';
import { RouletteWheel } from './components/RouletteWheel';
import { MenuEditorModal } from './components/MenuEditorModal';
import { soundManager } from './utils/audio';

const STORAGE_KEY = 'today_menu_food_data_v1';

export default function App() {
  // Step 1: 음식 종류 (카테고리), Step 2: 상세 메뉴
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  // Wheel state
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pendingResult, setPendingResult] = useState<string | null>(null);

  // Sound & Customization state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Food menus data
  const [foodData, setFoodData] = useState<FoodMenuData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_FOOD_DATA, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_FOOD_DATA;
  });

  // Save foodData to localStorage
  const handleUpdateFoodData = (newData: FoodMenuData) => {
    setFoodData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // ignore
    }
  };

  // Toggle sound
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.enabled = !next;
  };

  // Step 1 items & colors (matching screenshot quadrants: 양식 top-right, 한식 bottom-right, 일식 bottom-left, 중식 top-left)
  const step1Items = CATEGORY_DEFINITIONS.map((c) => c.key);
  const step1Colors = CATEGORY_DEFINITIONS.map((c) => c.color);

  // Step 2 items & colors for selected category
  const activeCategoryDishes = selectedCategory ? (foodData[selectedCategory] || []) : [];
  const step2Colors = MENU_SLICE_COLORS;

  // Spin to a specific item index
  const spinToIndex = (items: string[], targetIndex: number) => {
    if (isSpinning || items.length === 0) return;
    setIsSpinning(true);

    const numSlices = items.length;
    const sliceDeg = 360 / numSlices;

    // Angle of slice center relative to starting position
    // Formula derived for pointer at 12 o'clock (-90°):
    // targetMod = (360 - (targetIndex + 0.5) * sliceDeg) % 360
    const desiredMod = (360 - (targetIndex + 0.5) * sliceDeg + 3600) % 360;

    // Subtle natural offset inside the slice (±25% width to avoid boundaries)
    const randomOffset = (Math.random() - 0.5) * (sliceDeg * 0.5);
    const stopMod = (desiredMod + randomOffset + 360) % 360;

    // At least 5 full rotations (1800°) for exciting anticipation
    const extraTurns = 5 + Math.floor(Math.random() * 2);
    const baseIncrease = extraTurns * 360;

    const currentMod = (rotation % 360 + 360) % 360;
    let diff = stopMod - currentMod;
    if (diff <= 40) diff += 360;

    const finalRotation = rotation + baseIncrease + diff;
    setRotation(finalRotation);
    setPendingResult(items[targetIndex]);
  };

  // Trigger spin for Step 1
  const spinStep1 = () => {
    if (isSpinning) return;
    const randomIndex = Math.floor(Math.random() * step1Items.length);
    spinToIndex(step1Items, randomIndex);
  };

  // Trigger spin for Step 2
  const spinStep2 = () => {
    if (isSpinning || activeCategoryDishes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activeCategoryDishes.length);
    spinToIndex(activeCategoryDishes, randomIndex);
  };

  // Called when wheel finishes rotating
  const handleSpinEnd = () => {
    setIsSpinning(false);
    if (!pendingResult) return;

    if (currentStep === 1) {
      setSelectedCategory(pendingResult as CategoryKey);
      soundManager.playWin();
    } else {
      setSelectedMenu(pendingResult);
      soundManager.playWin();
      // Confetti celebratory effect on winning final dish!
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF5E3A', '#FFB800', '#10B981', '#3B82F6', '#FF78C4'],
        });
      } catch {
        // ignore
      }
    }
  };

  // Transition to Step 2 with the selected category
  const goToStep2 = (cat: CategoryKey) => {
    setCurrentStep(2);
    setSelectedCategory(cat);
    setSelectedMenu(null);
    setPendingResult(null);
    setRotation(0);
  };

  // Reset to Step 1
  const resetToStep1 = () => {
    setCurrentStep(1);
    setSelectedCategory(null);
    setSelectedMenu(null);
    setPendingResult(null);
    setRotation(0);
  };

  // Copy result text to clipboard
  const handleCopyResult = async () => {
    if (!selectedMenu) return;
    const text = `🎯 오늘 점심·저녁 추천 메뉴는 [${selectedCategory} > ${selectedMenu}] 입니다! 🍚 오늘 뭐 먹을지 고민 끝!`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast('추천 메뉴가 클립보드에 복사되었습니다!');
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col items-center justify-start px-4 py-6 sm:py-10 text-[#2D3142]">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-5 z-50 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Top Utility Bar (Sound, Customize) */}
        <div className="w-full flex justify-between items-center mb-2 px-1">
          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-orange-100 text-xs font-semibold text-gray-600 hover:text-orange-600 hover:bg-white shadow-xs transition cursor-pointer"
            title="메뉴 목록 관리 및 나만의 메뉴 추가"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5E3A]" />
            <span>메뉴 관리</span>
          </button>

          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded-full bg-white/80 border border-orange-100 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-white shadow-xs transition cursor-pointer"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#FF5E3A]" />
            )}
          </button>
        </div>

        {/* Header */}
        <header className="text-center mb-5 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 bg-[#FFE8E2] text-[#FF5E3A] px-3.5 py-1.5 rounded-full text-[13px] font-bold tracking-tight mb-2.5 shadow-xs">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
            </svg>
            <span>점심·저녁 고민 해결사</span>
          </div>

          <h1 className="font-jua text-[32px] sm:text-[34px] text-[#1F222E] leading-tight mb-1 drop-shadow-xs">
            오늘 뭐 먹지?
          </h1>
          <p className="text-[14px] text-[#6C757D] font-medium">
            결정하기 힘든 식사 메뉴, 2단계 룰렛으로 한 번에!
          </p>
        </header>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6 w-full">
          {/* Step 1 Pill */}
          <button
            onClick={() => {
              if (currentStep === 2 && !isSpinning) {
                resetToStep1();
              }
            }}
            disabled={isSpinning}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-xs ${
              currentStep === 1
                ? 'bg-[#FFF2EE] border-1.5 border-[#FF5E3A] text-[#FF5E3A] shadow-orange-500/15'
                : 'bg-white border-1.5 border-[#EFEFEF] text-gray-500 hover:text-gray-700'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                currentStep === 1
                  ? 'bg-[#FF5E3A] text-white'
                  : 'bg-[#EFEFEF] text-[#757575]'
              }`}
            >
              1
            </span>
            <span>음식 종류</span>
          </button>

          {/* Divider */}
          <div className="w-5 h-[2px] bg-[#E5E7EB] rounded-full" />

          {/* Step 2 Pill */}
          <button
            onClick={() => {
              if (currentStep === 1 && selectedCategory && !isSpinning) {
                goToStep2(selectedCategory);
              }
            }}
            disabled={!selectedCategory || isSpinning}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-xs ${
              currentStep === 2
                ? 'bg-[#FFF2EE] border-1.5 border-[#FF5E3A] text-[#FF5E3A] shadow-orange-500/15'
                : 'bg-white border-1.5 border-[#EFEFEF] text-[#9E9E9E]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                currentStep === 2
                  ? 'bg-[#FF5E3A] text-white'
                  : 'bg-[#EFEFEF] text-[#757575]'
              }`}
            >
              2
            </span>
            <span>상세 메뉴</span>
          </button>
        </div>

        {/* Roulette Card */}
        <div className="w-full bg-white rounded-[32px] px-5 py-6 sm:px-6 sm:py-7 flex flex-col items-center shadow-[0_10px_25px_rgba(255,94,58,0.12)] border border-[rgba(255,230,220,0.8)] relative">
          {/* Stage Prompt Badge */}
          <div className="text-[15px] font-bold text-[#4A4E69] bg-[#F3F4F8] px-4.5 py-2 rounded-[14px] mb-4 flex items-center gap-1.5 shadow-xs">
            {currentStep === 1 ? (
              <>
                <span>1단계:</span>
                <span className="text-[#FF5E3A] font-extrabold">음식 종류 뽑기</span>
              </>
            ) : (
              <>
                <span>2단계:</span>
                <span className="text-[#FF5E3A] font-extrabold">
                  {selectedCategory} 메뉴 고르기
                </span>
              </>
            )}
          </div>

          {/* Wheel Canvas Area */}
          <RouletteWheel
            items={currentStep === 1 ? step1Items : activeCategoryDishes}
            colors={currentStep === 1 ? step1Colors : step2Colors}
            rotation={rotation}
            isSpinning={isSpinning}
            onSpinEnd={handleSpinEnd}
          />

          {/* Result Information Box */}
          <div className="min-h-[84px] w-full flex flex-col items-center justify-center my-4 text-center">
            {isSpinning ? (
              <div className="text-[15px] font-bold text-[#FF5E3A] flex items-center gap-1.5 animate-pulse">
                <span>⏳</span> 두구두구... 과연 오늘의 메뉴는?
              </div>
            ) : currentStep === 1 ? (
              selectedCategory ? (
                <div className="w-full bg-[#FFF7F4] border-2 border-dashed border-[#FFCCBC] rounded-[20px] py-3.5 px-5 animate-in zoom-in-95 duration-200">
                  <div className="text-[13px] font-bold text-[#FF5E3A] uppercase tracking-wider mb-0.5">
                    1단계 결과
                  </div>
                  <div className="font-jua text-[26px] text-[#1A1C24]">
                    오늘은{' '}
                    <span className="text-[#FF5E3A] underline decoration-wavy decoration-[#FFB800] decoration-2 underline-offset-4">
                      {selectedCategory}
                    </span>
                    !
                  </div>
                </div>
              ) : (
                <div className="text-[15px] text-[#8C92A4] font-semibold flex items-center gap-1.5">
                  <span>👇</span> 아래 &quot;돌리기&quot; 버튼을 눌러주세요!
                </div>
              )
            ) : selectedMenu ? (
              <div className="w-full bg-[#FFF7F4] border-2 border-dashed border-[#FFCCBC] rounded-[20px] py-3.5 px-5 animate-in zoom-in-95 duration-200">
                <div className="text-[13px] font-bold text-[#FF5E3A] uppercase tracking-wider mb-0.5">
                  오늘의 추천 메뉴
                </div>
                <div className="font-jua text-[26px] text-[#1A1C24] mb-2">
                  오늘의 메뉴:{' '}
                  <span className="text-[#FF5E3A] underline decoration-wavy decoration-[#FFB800] decoration-2 underline-offset-4">
                    {selectedMenu}
                  </span>
                </div>

                {/* Helpful action pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-orange-100">
                  <a
                    href={`https://map.naver.com/p/search/${encodeURIComponent(
                      `${selectedMenu} 맛집`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition"
                  >
                    <span>네이버 지도 맛집</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={`https://map.kakao.com/?q=${encodeURIComponent(
                      `${selectedMenu} 맛집`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition"
                  >
                    <span>카카오 맵</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={handleCopyResult}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>복사</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[15px] text-[#8C92A4] font-semibold flex items-center gap-1.5">
                <span>🎯</span> {selectedCategory}{' '}
                {activeCategoryDishes.length}가지 메뉴 중 골라볼까요?
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            {currentStep === 1 ? (
              !selectedCategory ? (
                <button
                  onClick={spinStep1}
                  disabled={isSpinning}
                  className="w-full py-4 px-5 rounded-[16px] bg-gradient-to-r from-[#FF5E3A] to-[#FF3D12] text-white font-bold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,94,58,0.35)] active:translate-y-0.5 active:shadow-[0_4px_10px_rgba(255,94,58,0.3)] disabled:opacity-55 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <RotateCw
                    className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`}
                  />
                  <span>돌리기</span>
                </button>
              ) : (
                <div className="flex gap-2.5 w-full">
                  <button
                    onClick={spinStep1}
                    disabled={isSpinning}
                    className="flex-1 py-3.5 px-4 rounded-[16px] bg-[#F1F3F7] hover:bg-[#E8EBF0] text-[#4B5563] font-bold text-[15px] flex items-center justify-center gap-1.5 border border-[#E5E7EB] active:translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>다시 돌리기</span>
                  </button>

                  <button
                    onClick={() => goToStep2(selectedCategory)}
                    disabled={isSpinning}
                    className="flex-[1.4] py-3.5 px-4 rounded-[16px] bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-[15px] flex items-center justify-center gap-1.5 shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:translate-y-0.5 active:shadow-[0_4px_10px_rgba(16,185,129,0.25)] disabled:opacity-55 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <span>
                      {selectedCategory} ({activeCategoryDishes.length}종) 메뉴 뽑기
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )
            ) : !selectedMenu ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={spinStep2}
                  disabled={isSpinning}
                  className="w-full py-4 px-5 rounded-[16px] bg-gradient-to-r from-[#FF5E3A] to-[#FF3D12] text-white font-bold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,94,58,0.35)] active:translate-y-0.5 active:shadow-[0_4px_10px_rgba(255,94,58,0.3)] disabled:opacity-55 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <RotateCw
                    className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`}
                  />
                  <span>{selectedCategory} 메뉴 돌리기</span>
                </button>

                <button
                  onClick={resetToStep1}
                  disabled={isSpinning}
                  className="w-full py-2.5 px-4 text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>카테고리 다시 고르기 (1단계로)</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={resetToStep1}
                  disabled={isSpinning}
                  className="flex-1 py-3.5 px-4 rounded-[16px] bg-[#F1F3F7] hover:bg-[#E8EBF0] text-[#4B5563] font-bold text-[15px] flex items-center justify-center gap-1.5 border border-[#E5E7EB] active:translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>처음부터</span>
                </button>

                <button
                  onClick={spinStep2}
                  disabled={isSpinning}
                  className="flex-[1.3] py-3.5 px-4 rounded-[16px] bg-gradient-to-r from-[#FF5E3A] to-[#FF3D12] text-white font-bold text-[15px] flex items-center justify-center gap-1.5 shadow-[0_8px_20px_rgba(255,94,58,0.35)] active:translate-y-0.5 active:shadow-[0_4px_10px_rgba(255,94,58,0.3)] disabled:opacity-55 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>다시 뽑기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Preview Tag Bar */}
        <div className="flex flex-wrap gap-1.5 justify-center mt-6 px-2 w-full">
          {CATEGORY_DEFINITIONS.map((cat) => {
            const count = (foodData[cat.key] || []).length;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  if (!isSpinning) {
                    goToStep2(cat.key);
                  }
                }}
                disabled={isSpinning}
                className={`text-[12px] px-3 py-1.5 rounded-[10px] border font-semibold transition-all inline-flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFE8DF] text-[#FF5E3A] border-[#FFCCBC] font-bold -translate-y-0.5 shadow-[0_3px_8px_rgba(255,94,58,0.15)]'
                    : 'bg-white/80 text-[#717686] border-[#EDE8E3] hover:bg-white hover:border-orange-200'
                }`}
                title={`${cat.name} ${count}종 메뉴 바로 뽑기`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[11px] opacity-75">({count}종)</span>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <footer className="mt-8 text-center text-xs text-gray-400">
          <p>오늘의 맛있는 한 끼를 응원합니다 🍽️</p>
        </footer>
      </div>

      {/* Menu Customization Modal */}
      <MenuEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        foodData={foodData}
        onUpdateFoodData={handleUpdateFoodData}
        initialCategory={selectedCategory || '한식'}
      />
    </div>
  );
}
