import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Asset,
  AssetTransaction,
  AssetMaintenance,
  AssetDashboard,
  CreateAssetDto,
  UpdateAssetDto,
  CreateAssetTransactionDto,
  CreateMaintenanceDto,
  CreateWarrantyDto,
  AssetWarranty,
} from '../models/asset-management.model';

@Injectable({ providedIn: 'root' })
export class AssetManagementService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/assets`;

  getDashboard(): Observable<AssetDashboard> {
    return this.http.get<AssetDashboard>(`${this.base}/dashboard`);
  }

  // Assets
  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(this.base);
  }

  getAsset(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.base}/${id}`);
  }

  createAsset(dto: CreateAssetDto): Observable<Asset> {
    return this.http.post<Asset>(this.base, dto);
  }

  updateAsset(id: number, dto: UpdateAssetDto): Observable<Asset> {
    return this.http.patch<Asset>(`${this.base}/${id}`, dto);
  }

  deleteAsset(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/${id}`);
  }

  // Transactions
  getTransactions(assetId?: number): Observable<AssetTransaction[]> {
    let params = new HttpParams();
    if (assetId) params = params.set('assetId', String(assetId));
    return this.http.get<AssetTransaction[]>(`${this.base}/transactions/list`, { params });
  }

  createTransaction(dto: CreateAssetTransactionDto): Observable<AssetTransaction> {
    return this.http.post<AssetTransaction>(`${this.base}/transactions/create`, dto);
  }

  // Warranties
  createWarranty(dto: CreateWarrantyDto): Observable<AssetWarranty> {
    return this.http.post<AssetWarranty>(`${this.base}/warranties/create`, dto);
  }

  deleteWarranty(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/warranties/${id}`);
  }

  // Maintenances
  getMaintenances(assetId?: number): Observable<AssetMaintenance[]> {
    let params = new HttpParams();
    if (assetId) params = params.set('assetId', String(assetId));
    return this.http.get<AssetMaintenance[]>(`${this.base}/maintenances/list`, { params });
  }

  createMaintenance(dto: CreateMaintenanceDto): Observable<AssetMaintenance> {
    return this.http.post<AssetMaintenance>(`${this.base}/maintenances/create`, dto);
  }

  updateMaintenanceStatus(id: string, status: string): Observable<AssetMaintenance> {
    return this.http.patch<AssetMaintenance>(`${this.base}/maintenances/${id}/status`, { status });
  }

  deleteMaintenance(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/maintenances/${id}`);
  }
}
