import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, CreateTaskDto, UpdateTaskDto, CreateTimeLogDto, CreateCommentDto } from './dto/project.dto';

@Controller('api/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class ProjectController {
  constructor(private svc: ProjectService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.svc.getDashboard(req.user.businessId);
  }

  @Get()
  getProjects(@Req() req: any, @Query('status') status?: string) {
    return this.svc.getProjects(req.user.businessId, status);
  }

  @Get(':id')
  getProject(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.getProject(id, req.user.businessId);
  }

  @Post()
  createProject(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.svc.createProject(req.user.businessId, req.user.id, dto);
  }

  @Patch(':id')
  updateProject(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.svc.updateProject(id, req.user.businessId, dto);
  }

  @Delete(':id')
  deleteProject(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteProject(id, req.user.businessId);
  }

  // Tasks
  @Get('tasks/list')
  getTasks(@Req() req: any, @Query('projectId') projectId?: string, @Query('status') status?: string) {
    return this.svc.getTasks(req.user.businessId, projectId ? Number(projectId) : undefined, status);
  }

  @Post('tasks')
  createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.svc.createTask(req.user.businessId, req.user.id, dto);
  }

  @Patch('tasks/:id')
  updateTask(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.svc.updateTask(id, req.user.businessId, dto);
  }

  @Delete('tasks/:id')
  deleteTask(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteTask(id, req.user.businessId);
  }

  // Time Logs
  @Get('time-logs/list')
  getTimeLogs(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.svc.getTimeLogs(req.user.businessId, projectId ? Number(projectId) : undefined);
  }

  @Post('time-logs')
  createTimeLog(@Req() req: any, @Body() dto: CreateTimeLogDto) {
    return this.svc.createTimeLog(req.user.businessId, req.user.id, dto);
  }

  // Comments
  @Post('comments')
  createComment(@Req() req: any, @Body() dto: CreateCommentDto) {
    return this.svc.createComment(req.user.id, dto);
  }

  @Delete('comments/:id')
  deleteComment(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteComment(id, req.user.id);
  }
}
