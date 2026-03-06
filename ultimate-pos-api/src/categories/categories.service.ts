import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, businessId: number, createCategoryDto: CreateCategoryDto) {
    // If parentId is provided, verify it exists and belongs to the same business
    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          id: createCategoryDto.parentId,
          businessId,
          deletedAt: null,
        },
      });

      if (!parentCategory) {
        throw new BadRequestException('Parent category not found or does not belong to your business');
      }
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        shortCode: createCategoryDto.shortCode,
        parentId: createCategoryDto.parentId,
        businessId,
        createdBy: userId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        subcategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(businessId: number, includeSubcategories = false) {
    const categories = await this.prisma.category.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        subcategories: includeSubcategories ? {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        } : false,
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories;
  }

  async findOne(id: number, businessId: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        subcategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: number, userId: number, businessId: number, updateCategoryDto: UpdateCategoryDto) {
    // Verify category exists and belongs to the user's business
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If updating parentId, verify the new parent exists and prevent circular references
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId) {
        // Check if new parent exists
        const parentCategory = await this.prisma.category.findFirst({
          where: {
            id: updateCategoryDto.parentId,
            businessId,
            deletedAt: null,
          },
        });

        if (!parentCategory) {
          throw new BadRequestException('Parent category not found');
        }

        // Prevent setting self as parent
        if (updateCategoryDto.parentId === id) {
          throw new BadRequestException('A category cannot be its own parent');
        }

        // Prevent circular references (parent cannot be a subcategory of this category)
        const isCircular = await this.checkCircularReference(id, updateCategoryDto.parentId);
        if (isCircular) {
          throw new BadRequestException('Circular reference detected: the selected parent is a subcategory of this category');
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        shortCode: updateCategoryDto.shortCode,
        parentId: updateCategoryDto.parentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        subcategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, businessId: number) {
    // Verify category exists and belongs to the user's business
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        subcategories: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has subcategories
    if (category.subcategories.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories. Delete subcategories first.');
    }

    // Soft delete
    await this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Check if setting newParentId as parent of categoryId would create a circular reference
   */
  private async checkCircularReference(categoryId: number, newParentId: number): Promise<boolean> {
    let currentId = newParentId;
    const visited = new Set<number>();

    while (currentId) {
      if (currentId === categoryId) {
        return true; // Circular reference detected
      }

      if (visited.has(currentId)) {
        break; // Already checked this path
      }

      visited.add(currentId);

      const parent = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!parent || !parent.parentId) {
        break;
      }

      currentId = parent.parentId;
    }

    return false;
  }
}
