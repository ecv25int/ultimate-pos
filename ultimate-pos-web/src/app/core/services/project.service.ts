import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PjtProject, PjtTask, PjtTimeLog, PjtTaskComment, ProjectDashboard, CreateProjectDto, CreateTaskDto, CreateTimeLogDto } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/projects`;

  getDashboard(): Observable<ProjectDashboard> { return this.http.get<ProjectDashboard>(`${this.base}/dashboard`); }

  getProjects(status?: string): Observable<PjtProject[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<PjtProject[]>(this.base, { params });
  }

  getProject(id: number): Observable<PjtProject> { return this.http.get<PjtProject>(`${this.base}/${id}`); }
  createProject(dto: CreateProjectDto): Observable<PjtProject> { return this.http.post<PjtProject>(this.base, dto); }
  updateProject(id: number, dto: Partial<CreateProjectDto>): Observable<PjtProject> { return this.http.patch<PjtProject>(`${this.base}/${id}`, dto); }
  deleteProject(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/${id}`); }

  getTasks(projectId?: number, status?: string): Observable<PjtTask[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('projectId', String(projectId));
    if (status) params = params.set('status', status);
    return this.http.get<PjtTask[]>(`${this.base}/tasks/list`, { params });
  }

  createTask(dto: CreateTaskDto): Observable<PjtTask> { return this.http.post<PjtTask>(`${this.base}/tasks`, dto); }
  updateTask(id: number, dto: Partial<CreateTaskDto>): Observable<PjtTask> { return this.http.patch<PjtTask>(`${this.base}/tasks/${id}`, dto); }
  deleteTask(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/tasks/${id}`); }

  getTimeLogs(projectId?: number): Observable<PjtTimeLog[]> {
    let params = new HttpParams();
    if (projectId) params = params.set('projectId', String(projectId));
    return this.http.get<PjtTimeLog[]>(`${this.base}/time-logs/list`, { params });
  }

  createTimeLog(dto: CreateTimeLogDto): Observable<PjtTimeLog> { return this.http.post<PjtTimeLog>(`${this.base}/time-logs`, dto); }

  createComment(taskId: number, comment: string): Observable<PjtTaskComment> {
    return this.http.post<PjtTaskComment>(`${this.base}/comments`, { taskId, comment });
  }
  deleteComment(id: number): Observable<{ success: boolean }> { return this.http.delete<{ success: boolean }>(`${this.base}/comments/${id}`); }
}
