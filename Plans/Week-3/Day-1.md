# Week 3, Day 1: Product Catalog & Variations

## Objective
Build complete product management with SKU-level variations and pricing.

## Tasks
- [ ] Verify Product, ProductVariation, Variation models in Prisma
- [ ] Create `products.service.ts` with CRUD operations
- [ ] Map fields: name, sku_prefix, category_id, brand_id, description, type
- [ ] Create `variations.service.ts` for variant management
- [ ] Implement SKU generation (auto or manual)
- [ ] Create product DTOs (create, update, response)
- [ ] Create `products.controller.ts` endpoints:
  - POST /api/products
  - GET /api/products
  - GET /api/products/:id
  - PUT /api/products/:id
  - DELETE /api/products/:id
- [ ] Create `products.service.spec.ts` unit tests

## Verification
- [ ] Products can be created with multiple variations
- [ ] SKU uniqueness enforced per business
- [ ] Product search working
- [ ] Soft-delete prevents deleting in-use products

## Success Criteria
✅ Product catalog fully functional
