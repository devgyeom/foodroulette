export type CategoryKey = '한식' | '일식' | '중식' | '양식';

export interface CategoryInfo {
  key: CategoryKey;
  name: string;
  icon: string;
  color: string;
  textColor: string;
}

export interface FoodMenuData {
  [category: string]: string[];
}
