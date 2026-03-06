# Ultimate POS - Technical Architecture Specification

## 🏛️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │         │
│  │   Browser    │  │     POS      │  │    Browser   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                  ┌─────────▼─────────┐                         │
│                  │  Angular 17+ SPA   │                         │
│                  │  (TypeScript)      │                         │
│                  └─────────┬──────────┘                         │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           │ HTTPS/WSS
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Nginx Reverse Proxy                        │   │
│  │  - Load Balancing                                       │   │
│  │  - SSL Termination                                      │   │
│  │  - Rate Limiting                                        │   │
│  │  - Request Routing                                      │   │
│  └──────────┬─────────────────┬────────────────────────────┘   │
│             │                  │                                 │
│   ┌─────────▼─────┐    ┌──────▼──────────┐                    │
│   │  /api/v1/*    │    │   /api/v2/*     │                    │
│   │  (Laravel)    │    │   (NestJS)      │                    │
│   │  Legacy       │    │   New System    │                    │
│   └───────────────┘    └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    APPLICATION LAYER (NestJS)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    API Gateway Module                   │    │
│  │  - Request validation                                   │    │
│  │  - Authentication/Authorization                         │    │
│  │  - Response transformation                              │    │
│  └────────┬──────────────────────────────────────┬────────┘    │
│           │                                       │              │
│  ┌────────▼──────────────┐           ┌──────────▼──────────┐  │
│  │   Business Modules     │           │   Support Services   │  │
│  ├────────────────────────┤           ├─────────────────────┤  │
│  │ • Auth Module          │           │ • Queue Service     │  │
│  │ • Users Module         │           │ • Cache Service     │  │
│  │ • Business Module      │           │ • File Service      │  │
│  │ • Products Module      │           │ • Email Service     │  │
│  │ • Inventory Module     │           │ • SMS Service       │  │
│  │ • Contacts Module      │           │ • PDF Service       │  │
│  │ • Purchases Module     │           │ • Logger Service    │  │
│  │ • Sales Module         │           │ • Search Service    │  │
│  │ • POS Module           │           │ • Socket Service    │  │
│  │ • Payments Module      │           │ • Scheduler Service │  │
│  │ • Reports Module       │           └─────────────────────┘  │
│  │ • Restaurant Module    │                                     │
│  │ • Accounting Module    │                                     │
│  │ • CRM Module           │                                     │
│  │ • Manufacturing Module │                                     │
│  │ • Repair Module        │                                     │
│  │ • HMS Module           │                                     │
│  │ • Superadmin Module    │                                     │
│  └────────────────────────┘                                     │
└──────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                       DATA LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    MySQL     │  │    Redis     │  │  File Store  │          │
│  │   Primary    │  │   Cache &    │  │   AWS S3 /   │          │
│  │   Database   │  │   Sessions   │  │   Local      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Elasticsearch│  │  Queue (Bull)│  │  Backup DB   │          │
│  │   Search     │  │  Background  │  │  Replica     │          │
│  │   (Optional) │  │    Jobs      │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  • Payment Gateways (Stripe, PayPal, Razorpay)                  │
│  • Email Service (SendGrid, AWS SES)                            │
│  • SMS Service (Twilio)                                          │
│  • Push Notifications (FCM, OneSignal)                          │
│  • Cloud Storage (AWS S3, Google Cloud Storage)                 │
│  • Monitoring (Sentry, DataDog, New Relic)                      │
│  • Analytics (Google Analytics, Mixpanel)                        │
│  • WooCommerce API                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

### JWT-Based Authentication

```typescript
┌────────────┐                                    ┌────────────┐
│            │  1. POST /auth/login              │            │
│   Client   │  { email, password }              │   NestJS   │
│  (Angular) │ ───────────────────────────────► │    API     │
│            │                                    │            │
│            │  2. Validate credentials           │            │
│            │     & Generate tokens              │            │
│            │                                    │            │
│            │ ◄─────────────────────────────── │            │
│            │  {                                 │            │
│            │    accessToken: "jwt...",          │            │
│            │    refreshToken: "jwt...",         │            │
│            │    user: {...}                     │            │
│            │  }                                 │            │
│            │                                    │            │
│            │  3. Store in memory + httpOnly    │            │
│            │     cookie                         │            │
│            │                                    │            │
│            │  4. API Request with Bearer       │            │
│            │     Authorization: Bearer jwt...   │            │
│            │ ───────────────────────────────► │            │
│            │                                    │            │
│            │  5. Validate JWT                   │            │
│            │     - Verify signature             │            │
│            │     - Check expiration             │            │
│            │     - Verify user permissions      │            │
│            │                                    │            │
│            │ ◄─────────────────────────────── │            │
│            │  Response                          │            │
│            │                                    │            │
│            │  6. Token expired?                 │            │
│            │     POST /auth/refresh             │            │
│            │     { refreshToken }               │            │
│            │ ───────────────────────────────► │            │
│            │                                    │            │
│            │ ◄─────────────────────────────── │            │
│            │  {                                 │            │
│            │    accessToken: "new_jwt..."       │            │
│            │  }                                 │            │
└────────────┘                                    └────────────┘
```

### NestJS Auth Implementation

```typescript
// auth/auth.module.ts
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: config.get('JWT_EXPIRATION', '15m') 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.sub,
      email: payload.email,
      businessId: payload.businessId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}

// auth/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    
    if (!requiredPermissions) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );
  }
}

// Example usage in controller
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  @Post()
  @Permissions('product.create')
  async create(@Body() createProductDto: CreateProductDto) {
    // Only users with 'product.create' permission can access
  }
}
```

---

## 📦 Module Structure (Example: Products Module)

### Complete Module Architecture

```
src/products/
├── products.module.ts           # Module definition
├── products.controller.ts       # HTTP endpoints
├── products.service.ts          # Business logic
├── products.repository.ts       # Data access layer
├── dto/                         # Data Transfer Objects
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── product-response.dto.ts
│   └── product-filter.dto.ts
├── entities/                    # Database entities
│   ├── product.entity.ts
│   └── product-variation.entity.ts
├── interfaces/                  # TypeScript interfaces
│   └── product.interface.ts
├── pipes/                       # Custom pipes
│   └── product-validation.pipe.ts
├── guards/                      # Custom guards
│   └── product-ownership.guard.ts
├── decorators/                  # Custom decorators
│   └── product-permission.decorator.ts
└── tests/                       # Tests
    ├── products.controller.spec.ts
    ├── products.service.spec.ts
    └── products.e2e-spec.ts
```

### Example Implementation

```typescript
// products/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 14 Pro' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Latest iPhone model' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'single' })
  @IsString()
  type: 'single' | 'variable' | 'combo';

  @ApiProperty({ example: 1 })
  @IsNumber()
  businessId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  sku: string;
}

// products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    // Create product with transaction
    const product = await this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          ...createProductDto,
          createdAt: new Date(),
        },
        include: {
          category: true,
          brand: true,
          variations: true,
        },
      });

      // Create initial inventory record
      await tx.variationLocationDetails.create({
        data: {
          variationId: newProduct.id,
          locationId: createProductDto.locationId,
          qtyAvailable: 0,
        },
      });

      return newProduct;
    });

    // Emit event for other modules
    this.eventEmitter.emit('product.created', product);

    // Invalidate cache
    await this.cacheService.del(`products:business:${product.businessId}`);

    return product;
  }

  async findAll(
    businessId: number,
    filters: ProductFilterDto,
  ): Promise<PaginatedResponse<Product>> {
    // Try cache first
    const cacheKey = `products:${businessId}:${JSON.stringify(filters)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where = {
      businessId,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search } },
          { sku: { contains: filters.search } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          category: true,
          brand: true,
          variations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      items: products,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        brand: true,
        variations: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('product.updated', product);

    // Invalidate cache
    await this.cacheService.del(`products:business:${product.businessId}`);

    return product;
  }

  async remove(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Emit event
    this.eventEmitter.emit('product.deleted', { id, businessId: product.businessId });

    // Invalidate cache
    await this.cacheService.del(`products:business:${product.businessId}`);
  }
}

// products/products.controller.ts
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions('product.create')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.productsService.create({
      ...createProductDto,
      businessId: user.businessId,
    });
  }

  @Get()
  @Permissions('product.view')
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ type: ProductFilterDto })
  async findAll(
    @Query() filters: ProductFilterDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.productsService.findAll(user.businessId, filters);
  }

  @Get(':id')
  @Permissions('product.view')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('product.update')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Permissions('product.delete')
  @ApiOperation({ summary: 'Delete product' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
```

---

## 🎨 Angular Architecture

### Feature Module Structure (Example: Products)

```
src/app/features/products/
├── products.module.ts                 # Feature module
├── products-routing.module.ts         # Routes
├── components/
│   ├── product-list/
│   │   ├── product-list.component.ts
│   │   ├── product-list.component.html
│   │   ├── product-list.component.scss
│   │   └── product-list.component.spec.ts
│   ├── product-form/
│   │   ├── product-form.component.ts
│   │   ├── product-form.component.html
│   │   └── product-form.component.scss
│   ├── product-detail/
│   └── product-filters/
├── services/
│   ├── products.service.ts
│   └── products-api.service.ts
├── models/
│   ├── product.model.ts
│   └── product-filter.model.ts
├── store/
│   ├── products.actions.ts
│   ├── products.reducer.ts
│   ├── products.effects.ts
│   └── products.selectors.ts
└── guards/
    └── product-access.guard.ts
```

### Example Implementation

```typescript
// products/services/products.service.ts
@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(filters: ProductFilter): Observable<PaginatedResponse<Product>> {
    const params = new HttpParams()
      .set('page', filters.page.toString())
      .set('limit', filters.limit.toString())
      .set('search', filters.search || '')
      .set('categoryId', filters.categoryId?.toString() || '');

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createProduct(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product)
      .pipe(catchError(this.handleError));
  }

  updateProduct(id: number, product: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, product)
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}

// products/components/product-list/product-list.component.ts
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit, OnDestroy {
  products$ = this.store.select(selectAllProducts);
  loading$ = this.store.select(selectProductsLoading);
  error$ = this.store.select(selectProductsError);
  totalPages$ = this.store.select(selectProductsTotalPages);
  
  displayedColumns = ['sku', 'name', 'category', 'price', 'stock', 'actions'];
  filters: ProductFilter = { page: 1, limit: 20 };
  
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.store.dispatch(ProductsActions.loadProducts({ filters: this.filters }));
  }

  onSearch(search: string) {
    this.filters = { ...this.filters, search, page: 1 };
    this.loadProducts();
  }

  onPageChange(page: number) {
    this.filters = { ...this.filters, page };
    this.loadProducts();
  }

  onCreate() {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '800px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.store.dispatch(ProductsActions.createProduct({ product: result }));
        }
      });
  }

  onEdit(product: Product) {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '800px',
      data: { mode: 'edit', product }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.store.dispatch(ProductsActions.updateProduct({ 
            id: product.id, 
            product: result 
          }));
        }
      });
  }

  onDelete(product: Product) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Product',
        message: `Are you sure you want to delete ${product.name}?`
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.store.dispatch(ProductsActions.deleteProduct({ id: product.id }));
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// products/store/products.effects.ts
@Injectable()
export class ProductsEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProducts),
      switchMap(({ filters }) =>
        this.productsService.getProducts(filters).pipe(
          map(response => ProductsActions.loadProductsSuccess({ response })),
          catchError(error => of(ProductsActions.loadProductsFailure({ error: error.message })))
        )
      )
    )
  );

  createProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.createProduct),
      exhaustMap(({ product }) =>
        this.productsService.createProduct(product).pipe(
          map(createdProduct => {
            this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
            return ProductsActions.createProductSuccess({ product: createdProduct });
          }),
          catchError(error => {
            this.snackBar.open(`Error: ${error.message}`, 'Close', { duration: 5000 });
            return of(ProductsActions.createProductFailure({ error: error.message }));
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private productsService: ProductsService,
    private snackBar: MatSnackBar
  ) {}
}
```

---

## 🔄 Data Flow Patterns

### Request/Response Flow

```
User Action (Click "Create Product")
    ↓
Component dispatches action
    store.dispatch(ProductsActions.createProduct({ product }))
    ↓
Effect catches action
    createProduct$ effect
    ↓
HTTP Request to API
    this.http.post('/api/products', product)
    ↓
NestJS Controller receives request
    @Post() create(@Body() dto)
    ↓
Validation (class-validator)
    ↓
Service processes business logic
    productsService.create(dto)
    ↓
Repository/Prisma saves to database
    prisma.product.create(...)
    ↓
Response sent back
    ↓
Effect handles response
    createProductSuccess or createProductFailure
    ↓
Reducer updates state
    ↓
Selectors provide new data
    ↓
Component receives update (via Observable)
    products$ | async
    ↓
View re-renders (OnPush change detection)
```

---

## 🗄️ Database Design Patterns

### Multi-Tenancy Strategy

```typescript
// Option 1: Shared Database with businessId column (Recommended)
model Product {
  id         Int      @id @default(autoincrement())
  businessId Int      @map("business_id")
  name       String
  
  business   Business @relation(fields: [businessId], references: [id])
  
  @@index([businessId])
  @@map("products")
}

// Prisma middleware to auto-filter by businessId
prisma.$use(async (params, next) => {
  if (params.model) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = params.args.where || {};
      params.args.where.businessId = getCurrentBusinessId();
    }
  }
  return next(params);
});

// Option 2: Separate schema per tenant (for Superadmin module)
// Create database schema per business: business_1, business_2, etc.
```

### Soft Deletes

```typescript
model Product {
  id        Int       @id @default(autoincrement())
  name      String
  deletedAt DateTime? @map("deleted_at")
  
  @@map("products")
}

// Middleware to filter soft-deleted records
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = params.args.where || {};
    params.args.where.deletedAt = null;
  }
  return next(params);
});
```

---

## 📱 Real-Time Features

### WebSocket Implementation

```typescript
// websocket/websocket.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'events',
})
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-business')
  handleJoinBusiness(
    @MessageBody() data: { businessId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`business-${data.businessId}`);
  }

  notifyStockUpdate(businessId: number, productId: number, newStock: number) {
    this.server.to(`business-${businessId}`).emit('stock-updated', {
      productId,
      newStock,
      timestamp: new Date(),
    });
  }

  notifyNewSale(businessId: number, sale: any) {
    this.server.to(`business-${businessId}`).emit('sale-created', {
      sale,
      timestamp: new Date(),
    });
  }
}
```

---

## 🔍 Caching Strategy

### Multi-Level Caching

```typescript
@Injectable()
export class CacheService {
  constructor(
    @InjectRedis() private redis: Redis,
    private cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Level 1: In-memory cache (fast)
    const memoryCache = await this.cacheManager.get<T>(key);
    if (memoryCache) return memoryCache;

    // Level 2: Redis cache
    const redisCache = await this.redis.get(key);
    if (redisCache) {
      const parsed = JSON.parse(redisCache);
      // Populate memory cache
      await this.cacheManager.set(key, parsed, 60);
      return parsed;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Set in both caches
    await Promise.all([
      this.cacheManager.set(key, value, ttl),
      this.redis.setex(key, ttl, serialized),
    ]);
  }

  async del(pattern: string): Promise<void> {
    // Delete from both caches
    await this.cacheManager.del(pattern);
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 🧪 Testing Strategy

### Backend Testing

```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
        {
          provide: CacheService,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto = {
        name: 'Test Product',
        sku: 'SKU-001',
        businessId: 1,
        price: 99.99,
      };

      const expected = { id: 1, ...dto };
      prisma.product.create = jest.fn().mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining(dto),
      });
    });

    it('should throw ConflictException for duplicate SKU', async () => {
      prisma.product.findUnique = jest.fn().mockResolvedValue({ id: 1 });

      await expect(service.create({ sku: 'DUPLICATE' }))
        .rejects
        .toThrow(ConflictException);
    });
  });
});
```

### Frontend Testing

```typescript
// product-list.component.spec.ts
describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let store: MockStore<AppState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductListComponent],
      imports: [MatTableModule, MatPaginatorModule],
      providers: [
        provideMockStore({
          initialState: {
            products: {
              products: [],
              loading: false,
              error: null,
            },
          },
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should load products on init', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.ngOnInit();
    
    expect(dispatchSpy).toHaveBeenCalledWith(
      ProductsActions.loadProducts({ filters: component.filters })
    );
  });
});
```

---

*Last Updated: March 3, 2026*
*Version: 1.0*
