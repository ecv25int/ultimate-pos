import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@Injectable()
export class NotificationTemplatesService {
  constructor(private prisma: PrismaService) {}

  create(businessId: number, dto: CreateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        businessId,
        templateFor: dto.templateFor,
        emailBody: dto.emailBody,
        smsBody: dto.smsBody,
        subject: dto.subject,
        autoSend: dto.autoSend ?? false,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.notificationTemplate.findMany({
      where: { businessId },
      orderBy: { templateFor: 'asc' },
    });
  }

  async findOne(id: number, businessId: number) {
    const t = await this.prisma.notificationTemplate.findFirst({ where: { id, businessId } });
    if (!t) throw new NotFoundException('Notification template not found');
    return t;
  }

  findByEvent(businessId: number, event: string) {
    return this.prisma.notificationTemplate.findFirst({
      where: { businessId, templateFor: event },
    });
  }

  async update(id: number, businessId: number, dto: UpdateNotificationTemplateDto) {
    await this.findOne(id, businessId);
    return this.prisma.notificationTemplate.update({ where: { id }, data: dto });
  }

  async remove(id: number, businessId: number) {
    await this.findOne(id, businessId);
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}
