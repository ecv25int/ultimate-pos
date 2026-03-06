import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, CreateTaskDto, UpdateTaskDto, CreateTimeLogDto, CreateCommentDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  // ---- Projects ----
  async getProjects(businessId: number, status?: string) {
    return this.prisma.pjtProject.findMany({
      where: { businessId, ...(status && { status }) },
      include: { members: true, _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(id: number, businessId: number) {
    const project = await this.prisma.pjtProject.findFirst({
      where: { id, businessId },
      include: {
        members: true,
        tasks: { include: { comments: true, timeLogs: true } },
        timeLogs: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProject(businessId: number, userId: number, dto: CreateProjectDto) {
    const { memberUserIds, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.pjtProject.create({
        data: {
          ...data,
          businessId,
          createdBy: userId,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      });
      if (memberUserIds?.length) {
        await tx.pjtProjectMember.createMany({
          data: memberUserIds.map((uid) => ({ projectId: project.id, userId: uid })),
        });
      }
      return project;
    });
  }

  async updateProject(id: number, businessId: number, dto: UpdateProjectDto) {
    await this.getProject(id, businessId);
    return this.prisma.pjtProject.update({
      where: { id },
      data: {
        ...dto,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteProject(id: number, businessId: number) {
    await this.getProject(id, businessId);
    await this.prisma.pjtProject.delete({ where: { id } });
    return { success: true };
  }

  // ---- Tasks ----
  async getTasks(businessId: number, projectId?: number, status?: string) {
    return this.prisma.pjtTask.findMany({
      where: { businessId, ...(projectId && { projectId }), ...(status && { status }) },
      include: { _count: { select: { comments: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createTask(businessId: number, userId: number, dto: CreateTaskDto) {
    const taskId = `TASK-${Date.now()}`;
    return this.prisma.pjtTask.create({
      data: {
        ...dto,
        businessId,
        createdBy: userId,
        taskId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateTask(id: number, businessId: number, dto: UpdateTaskDto) {
    const task = await this.prisma.pjtTask.findFirst({ where: { id, businessId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.pjtTask.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async deleteTask(id: number, businessId: number) {
    const task = await this.prisma.pjtTask.findFirst({ where: { id, businessId } });
    if (!task) throw new NotFoundException();
    await this.prisma.pjtTask.delete({ where: { id } });
    return { success: true };
  }

  // ---- Time Logs ----
  async getTimeLogs(businessId: number, projectId?: number) {
    return this.prisma.pjtTimeLog.findMany({
      where: { businessId, ...(projectId && { projectId }) },
      orderBy: { startTime: 'desc' },
    });
  }

  async createTimeLog(businessId: number, userId: number, dto: CreateTimeLogDto) {
    return this.prisma.pjtTimeLog.create({
      data: {
        ...dto,
        businessId,
        userId,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
    });
  }

  // ---- Comments ----
  async createComment(userId: number, dto: CreateCommentDto) {
    return this.prisma.pjtTaskComment.create({
      data: { ...dto, userId },
    });
  }

  async deleteComment(id: number, userId: number) {
    await this.prisma.pjtTaskComment.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  // ---- Dashboard ----
  async getDashboard(businessId: number) {
    const [total, byStatus] = await Promise.all([
      this.prisma.pjtProject.count({ where: { businessId } }),
      this.prisma.pjtProject.groupBy({
        by: ['status'],
        where: { businessId },
        _count: true,
      }),
    ]);
    const tasksDue = await this.prisma.pjtTask.count({
      where: { businessId, dueDate: { lte: new Date() }, status: { not: 'completed' } },
    });
    return { totalProjects: total, byStatus, overdueTasksCount: tasksDue };
  }
}
