import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  Category,
  CreateCategoryDto,
  Brand,
  CreateBrandDto,
  Unit,
  CreateUnitDto,
} from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== Products ====================

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: number, product: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  // ==================== Categories ====================

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: Partial<CreateCategoryDto>): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // ==================== Brands ====================

  getAllBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/brands`);
  }

  getBrandById(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/brands/${id}`);
  }

  createBrand(brand: CreateBrandDto): Observable<Brand> {
    return this.http.post<Brand>(`${this.apiUrl}/brands`, brand);
  }

  updateBrand(id: number, brand: Partial<CreateBrandDto>): Observable<Brand> {
    return this.http.patch<Brand>(`${this.apiUrl}/brands/${id}`, brand);
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/brands/${id}`);
  }

  // ==================== Units ====================

  getAllUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/units`);
  }

  getUnitById(id: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/units/${id}`);
  }

  createUnit(unit: CreateUnitDto): Observable<Unit> {
    return this.http.post<Unit>(`${this.apiUrl}/units`, unit);
  }

  updateUnit(id: number, unit: Partial<CreateUnitDto>): Observable<Unit> {
    return this.http.patch<Unit>(`${this.apiUrl}/units/${id}`, unit);
  }

  deleteUnit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/units/${id}`);
  }

  // ==================== Export / Import ====================

  /**
   * GET /api/products/export — downloads all products as CSV Blob
   */
  exportProducts(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
    });
  }

  /**
   * POST /api/products/import — uploads a CSV file (multipart/form-data, field "file")
   */
  importProducts(file: File): Observable<{ created: number; updated: number; skipped: number; errors: string[] }> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/import`, form);
  }

  // ==================== Advanced Search ====================

  searchProducts(filters: {
    q?: string;
    categoryId?: number;
    brandId?: number;
    type?: string;
    stockStatus?: string;
    page?: number;
    limit?: number;
  }): Observable<{ products: Product[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (filters.q)           params = params.set('q', filters.q);
    if (filters.categoryId)  params = params.set('categoryId', String(filters.categoryId));
    if (filters.brandId)     params = params.set('brandId', String(filters.brandId));
    if (filters.type)        params = params.set('type', filters.type);
    if (filters.stockStatus) params = params.set('stockStatus', filters.stockStatus);
    if (filters.page)        params = params.set('page', String(filters.page));
    if (filters.limit)       params = params.set('limit', String(filters.limit));
    return this.http.get<any>(`${this.apiUrl}/products/search`, { params });
  }

  bulkUpdatePrices(updates: { variationId: number; defaultSellPrice: number }[]): Observable<{ updated: number }> {
    return this.http.patch<any>(`${this.apiUrl}/products/bulk-price`, { updates });
  }

  // ==================== Image Upload ====================

  /**
   * POST /api/products/:id/image — upload or replace the product thumbnail.
   * Field name: "image". Max 8 MB. Allowed: jpg, png, gif, webp.
   */
  uploadImage(productId: number, file: File): Observable<Product> {
    const form = new FormData();
    form.append('image', file, file.name);
    return this.http.post<Product>(`${this.apiUrl}/${productId}/image`, form);
  }

  /**
   * DELETE /api/products/:id/image — remove the product thumbnail.
   */
  removeImage(productId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${productId}/image`);
  }
}
