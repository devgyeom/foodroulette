import { CategoryInfo, FoodMenuData } from '../types';

export const CATEGORY_DEFINITIONS: CategoryInfo[] = [
  {
    key: '양식',
    name: '양식',
    icon: '🍝',
    color: '#52BE6A', // Fresh green (top-right in screenshot)
    textColor: '#FFFFFF',
  },
  {
    key: '한식',
    name: '한식',
    icon: '🍚',
    color: '#FF6464', // Coral red (bottom-right in screenshot)
    textColor: '#FFFFFF',
  },
  {
    key: '일식',
    name: '일식',
    icon: '🍣',
    color: '#3B82F6', // Blue (bottom-left in screenshot)
    textColor: '#FFFFFF',
  },
  {
    key: '중식',
    name: '중식',
    icon: '🥟',
    color: '#F5C12E', // Golden yellow (top-left in screenshot)
    textColor: '#FFFFFF',
  },
];

export const DEFAULT_FOOD_DATA: FoodMenuData = {
  '한식': [
    '김치찌개', '비빔밥', '불고기', '삼겹살',
    '냉면', '떡볶이', '된장찌개', '칼국수',
    '제육볶음', '국밥', '닭갈비', '보쌈',
    '갈비탕', '순두부찌개', '감자탕', '찜닭'
  ],
  '일식': [
    '초밥', '라멘', '돈카츠', '우동',
    '규동', '카레', '오코노미야키', '소바',
    '가츠동', '텐동', '사케동', '야키토리',
    '타코야키', '스키야키', '멘치카츠', '나베'
  ],
  '중식': [
    '짜장면', '짬뽕', '탕수육', '마라탕',
    '볶음밥', '딤섬', '마파두부', '양꼬치',
    '꿔바로우', '깐풍기', '마라샹궈', '유산슬',
    '멘보샤', '크림새우', '칠리새우', '동파육'
  ],
  '양식': [
    '파스타', '피자', '스테이크', '햄버거',
    '리조또', '샐러드', '샌드위치', '그라탱',
    '라자냐', '바베큐폭립', '에그베네딕트', '감바스',
    '뇨끼', '클램차우더', '필라프', '파니니'
  ]
};

// 16 distinct cheerful harmonious colors for the 16 menu slices in step 2
export const MENU_SLICE_COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1',
  '#48DBFB', '#54A0FF', '#9B59B6', '#FF78C4',
  '#EE5253', '#FFA07A', '#FFD32A', '#10AC84',
  '#00D2D3', '#2E86DE', '#8854D0', '#FF6B81'
];
