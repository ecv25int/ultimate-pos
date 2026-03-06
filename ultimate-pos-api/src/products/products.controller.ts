import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  ParseFloatPipe,
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { extname, join } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Products')
@ApiBearerAuth('JWT')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new product', description: 'Creates a product record (admin/manager only).' })
  @ApiResponse({ status: 201, description: 'Product created.' })
  @ApiResponse({ status: 409, description: 'SKU already exists.' })
  create(@Request() req: any, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(
      req.user.id,
      req.user.businessId,
      createProductDto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'List all products', description: 'Returns all active products for the authenticated business.' })
  @ApiResponse({ status: 200, description: 'Array of products.' })
  findAll(@Request() req: any) {
    return this.productsService.findAll(req.user.businessId);
  }

  /**
   * GET /api/products/search — Advanced filtered search
   * Must be defined BEFORE @Get(':id') to avoid route conflict
   */
  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Advanced product search', description: 'Search products by name/SKU with optional filters for category, brand, type, and stock status.' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term (name, SKU)' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'brandId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['single', 'variable'] })
  @ApiQuery({ name: 'stockStatus', required: false, enum: ['in_stock', 'low_stock', 'out_of_stock'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated product search results.' })
  searchProducts(
    @Request() req: any,
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('type') type?: string,
    @Query('stockStatus') stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.search(req.user.businessId, {
      query,
      categoryId: categoryId ? +categoryId : undefined,
      brandId: brandId ? +brandId : undefined,
      type,
      stockStatus,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    });
  }

  /**
   * PATCH /api/products/bulk-price — Bulk update selling prices
   * Must be defined BEFORE @Get(':id') to avoid route conflict
   */
  @Patch('bulk-price')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk update sell prices on variations', description: 'Updates defaultSellPrice for multiple product variations at once.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: { variationId: { type: 'integer' }, defaultSellPrice: { type: 'number' } },
            required: ['variationId', 'defaultSellPrice'],
          },
        },
      },
      required: ['updates'],
    },
  })
  @ApiResponse({ status: 200, description: 'Number of variations updated.' })
  bulkUpdatePrices(
    @Request() req: any,
    @Body() body: { updates: { variationId: number; defaultSellPrice: number }[] },
  ) {
    return this.productsService.bulkUpdatePrices(req.user.businessId, body.updates);
  }

  /**
   * GET /api/products/export
   * Download all products as a CSV file
   * Must be defined BEFORE @Get(':id') to avoid route conflict
   */
  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export products to CSV', description: 'Downloads all products as a CSV file.' })
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  async exportCsv(@Request() req: any, @Res() res: Response) {
    const csv = await this.productsService.exportToCsv(req.user.businessId);
    const filename = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.end(csv);
  }

  /**
   * POST /api/products/import
   * Upload a CSV file to bulk-import products
   */
  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Import products from CSV', description: 'Upload a CSV file (field name: file) to bulk-create products.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'CSV file with columns: name, sku, purchasePrice, sellingPrice, type, categoryId, unitId' })
  @ApiResponse({ status: 200, description: 'Import summary: created/updated/failed counts.' })
  async importCsv(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { error: 'No file uploaded. Use multipart/form-data with field name "file".' };
    }
    return this.productsService.importFromCsv(
      req.user.id,
      req.user.businessId,
      file.buffer,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Updated product.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, req.user.businessId, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.remove(id, req.user.businessId);
  }

  /**
   * POST /api/products/:id/image
   * Upload or replace the product image (jpg/png/gif/webp, max 8 MB)
   */
  @Post(':id/image')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'uploads', 'products'),
        filename: (_req, file, cb) => {
          const productId = (_req as any).params?.id ?? 'unknown';
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `product-${productId}-${Date.now()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
        }
      },
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    }),
  )
  @ApiOperation({ summary: 'Upload product image', description: 'Upload or replace the product image. Field name: image. Max 8 MB. Allowed: jpg, png, gif, webp.' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 200, description: 'Product with updated imageUrl.' })
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No image file provided. Use multipart/form-data with field name "image".');
    }
    return this.productsService.uploadImage(id, req.user.businessId, file.filename);
  }

  /**
   * DELETE /api/products/:id/image
   * Remove the product image
   */
  @Delete(':id/image')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remove product image' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Image removed.' })
  async removeImage(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.removeImage(id, req.user.businessId);
  }
}
