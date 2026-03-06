import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VariationTemplate,
  CreateVariationTemplateDto,
  ProductVariation,
  Variation,
  CreateVariationDto,
} from '../models/variation.model';

@Injectable({ providedIn: 'root' })
export class VariationsService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Variation Templates ─────────────────────────────────────────────────

  getAllTemplates(): Observable<VariationTemplate[]> {
    return this.http.get<VariationTemplate[]>(`${this.baseUrl}/variations/templates`);
  }

  createTemplate(dto: CreateVariationTemplateDto): Observable<VariationTemplate> {
    return this.http.post<VariationTemplate>(`${this.baseUrl}/variations/templates`, dto);
  }

  updateTemplate(id: number, dto: Partial<CreateVariationTemplateDto>): Observable<VariationTemplate> {
    return this.http.patch<VariationTemplate>(`${this.baseUrl}/variations/templates/${id}`, dto);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/variations/templates/${id}`);
  }

  // ─── Product Variations ───────────────────────────────────────────────────

  getProductVariations(productId: number): Observable<ProductVariation[]> {
    return this.http.get<ProductVariation[]>(
      `${this.baseUrl}/variations/product-variations/by-product/${productId}`,
    );
  }

  createProductVariation(productId: number, name: string): Observable<ProductVariation> {
    return this.http.post<ProductVariation>(`${this.baseUrl}/variations/product-variations`, {
      productId,
      name,
    });
  }

  // ─── Variations ───────────────────────────────────────────────────────────

  getVariationsByProduct(productId: number): Observable<Variation[]> {
    return this.http.get<Variation[]>(`${this.baseUrl}/variations/by-product/${productId}`);
  }

  createVariation(dto: CreateVariationDto): Observable<Variation> {
    return this.http.post<Variation>(`${this.baseUrl}/variations`, dto);
  }

  updateVariation(id: number, dto: Partial<CreateVariationDto>): Observable<Variation> {
    return this.http.patch<Variation>(`${this.baseUrl}/variations/${id}`, dto);
  }

  deleteVariation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/variations/${id}`);
  }
}
