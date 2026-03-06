export interface Category {
  id: number;
  name: string;
  businessId: number;
  shortCode?: string;
  parentId?: number;
  parent?: Category;
  subcategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: number;
  name: string;
  businessId: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: number;
  actualName: string;
  shortName: string;
  businessId: number;
  allowDecimal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  type: 'single' | 'variable';
  unitId: number;
  unit?: Unit;
  brandId?: number;
  brand?: Brand;
  categoryId?: number;
  category?: Category;
  subCategoryId?: number;
  subCategory?: Category;
  sku: string;
  barcodeType: string;
  enableStock: boolean;
  alertQuantity: number;
  imageUrl?: string | null;
  businessId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  type?: 'single' | 'variable';
  unitId: number;
  brandId?: number;
  categoryId?: number;
  subCategoryId?: number;
  sku: string;
  barcodeType?: string;
  enableStock?: boolean;
  alertQuantity?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface CreateCategoryDto {
  name: string;
  shortCode?: string;
  parentId?: number;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
}

export interface CreateUnitDto {
  actualName: string;
  shortName: string;
  allowDecimal?: boolean;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}
