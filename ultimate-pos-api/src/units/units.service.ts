import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, businessId: number, createUnitDto: CreateUnitDto) {
    // Validate base unit if provided
    if (createUnitDto.baseUnitId) {
      const baseUnit = await this.prisma.unit.findFirst({
        where: {
          id: createUnitDto.baseUnitId,
          businessId,
          deletedAt: null,
        },
      });

      if (!baseUnit) {
        throw new BadRequestException('Base unit not found or does not belong to your business');
      }

      // Base unit should not have its own base unit (only one level of conversion)
      if (baseUnit.baseUnitId) {
        throw new BadRequestException('Base unit cannot itself have a base unit. Please select a primary unit.');
      }

      // Multiplier is required when baseUnitId is provided
      if (!createUnitDto.baseUnitMultiplier) {
        throw new BadRequestException('Base unit multiplier is required when base unit is specified');
      }
    }

    // If multiplier is provided without baseUnitId, that's an error
    if (createUnitDto.baseUnitMultiplier && !createUnitDto.baseUnitId) {
      throw new BadRequestException('Base unit ID is required when multiplier is specified');
    }

    return this.prisma.unit.create({
      data: {
        actualName: createUnitDto.actualName,
        shortName: createUnitDto.shortName,
        allowDecimal: createUnitDto.allowDecimal ?? false,
        baseUnitId: createUnitDto.baseUnitId,
        baseUnitMultiplier: createUnitDto.baseUnitMultiplier,
        businessId,
        createdBy: userId,
      },
      include: {
        baseUnit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        subUnits: {
          where: { deletedAt: null },
          select: {
            id: true,
            actualName: true,
            shortName: true,
            baseUnitMultiplier: true,
          },
        },
      },
    });
  }

  async findAll(businessId: number, onlyBaseUnits = false) {
    const units = await this.prisma.unit.findMany({
      where: {
        businessId,
        deletedAt: null,
        ...(onlyBaseUnits ? { baseUnitId: null } : {}),
      },
      include: {
        baseUnit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        subUnits: {
          where: { deletedAt: null },
          select: {
            id: true,
            actualName: true,
            shortName: true,
            baseUnitMultiplier: true,
          },
        },
      },
      orderBy: [
        { baseUnitId: 'asc' },
        { actualName: 'asc' },
      ],
    });

    return units;
  }

  async findOne(id: number, businessId: number) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        baseUnit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        subUnits: {
          where: { deletedAt: null },
          select: {
            id: true,
            actualName: true,
            shortName: true,
            baseUnitMultiplier: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async update(id: number, businessId: number, updateUnitDto: UpdateUnitDto) {
    // Verify unit exists and belongs to the user's business
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Validate base unit if being updated
    if (updateUnitDto.baseUnitId !== undefined) {
      if (updateUnitDto.baseUnitId) {
        // Prevent setting self as base unit
        if (updateUnitDto.baseUnitId === id) {
          throw new BadRequestException('A unit cannot be its own base unit');
        }

        const baseUnit = await this.prisma.unit.findFirst({
          where: {
            id: updateUnitDto.baseUnitId,
            businessId,
            deletedAt: null,
          },
        });

        if (!baseUnit) {
          throw new BadRequestException('Base unit not found');
        }

        // Base unit should not have its own base unit
        if (baseUnit.baseUnitId) {
          throw new BadRequestException('Base unit cannot itself have a base unit. Please select a primary unit.');
        }

        // If this unit has sub-units, prevent changing it to have a base unit
        const hasSubUnits = await this.prisma.unit.count({
          where: {
            baseUnitId: id,
            deletedAt: null,
          },
        });

        if (hasSubUnits > 0) {
          throw new BadRequestException('Cannot set a base unit for this unit because it has sub-units');
        }
      }
    }

    return this.prisma.unit.update({
      where: { id },
      data: {
        actualName: updateUnitDto.actualName,
        shortName: updateUnitDto.shortName,
        allowDecimal: updateUnitDto.allowDecimal,
        baseUnitId: updateUnitDto.baseUnitId,
        baseUnitMultiplier: updateUnitDto.baseUnitMultiplier,
      },
      include: {
        baseUnit: {
          select: {
            id: true,
            actualName: true,
            shortName: true,
          },
        },
        subUnits: {
          where: { deletedAt: null },
          select: {
            id: true,
            actualName: true,
            shortName: true,
            baseUnitMultiplier: true,
          },
        },
      },
    });
  }

  async remove(id: number, businessId: number) {
    // Verify unit exists and belongs to the user's business
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        subUnits: {
          where: { deletedAt: null },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Check if unit has sub-units
    if (unit.subUnits.length > 0) {
      throw new BadRequestException('Cannot delete unit with sub-units. Delete or update sub-units first.');
    }

    // Soft delete
    await this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Unit deleted successfully' };
  }
}
