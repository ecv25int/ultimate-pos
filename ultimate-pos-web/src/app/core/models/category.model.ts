export interface Category {
  id: number;
  businessId: number;
  name: string;
  shortCode?: string;
  parentId?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  subcategories?: Category[];
}

export interface CreateCategoryDto {
  name: string;
  shortCode?: string;
  parentId?: number;
}
