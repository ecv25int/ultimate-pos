import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MfgIngredientGroup,
  MfgRecipe,
  CreateIngredientGroupDto,
  CreateRecipeDto,
  UpdateRecipeDto,
} from '../models/manufacturing.model';

@Injectable({ providedIn: 'root' })
export class ManufacturingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/manufacturing`;

  // Ingredient Groups
  getIngredientGroups(): Observable<MfgIngredientGroup[]> {
    return this.http.get<MfgIngredientGroup[]>(`${this.base}/ingredient-groups`);
  }

  createIngredientGroup(dto: CreateIngredientGroupDto): Observable<MfgIngredientGroup> {
    return this.http.post<MfgIngredientGroup>(`${this.base}/ingredient-groups`, dto);
  }

  deleteIngredientGroup(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/ingredient-groups/${id}`);
  }

  // Recipes
  getRecipes(productId?: number): Observable<MfgRecipe[]> {
    let params = new HttpParams();
    if (productId) params = params.set('productId', String(productId));
    return this.http.get<MfgRecipe[]>(`${this.base}/recipes`, { params });
  }

  getRecipe(id: number): Observable<MfgRecipe> {
    return this.http.get<MfgRecipe>(`${this.base}/recipes/${id}`);
  }

  createRecipe(dto: CreateRecipeDto): Observable<MfgRecipe> {
    return this.http.post<MfgRecipe>(`${this.base}/recipes`, dto);
  }

  updateRecipe(id: number, dto: UpdateRecipeDto): Observable<MfgRecipe> {
    return this.http.patch<MfgRecipe>(`${this.base}/recipes/${id}`, dto);
  }

  deleteRecipe(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/recipes/${id}`);
  }
}
