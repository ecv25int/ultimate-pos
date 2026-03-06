import { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./products-list/products-list.component').then(
        (m) => m.ProductsListComponent,
      ),
    title: 'Products - Ultimate POS',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./product-form/product-form.component').then(
        (m) => m.ProductFormComponent,
      ),
    title: 'Add Product - Ultimate POS',
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./product-form/product-form.component').then(
        (m) => m.ProductFormComponent,
      ),
    title: 'Edit Product - Ultimate POS',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/categories.component').then(
        (m) => m.CategoriesComponent,
      ),
    title: 'Categories - Ultimate POS',
  },
  {
    path: 'brands',
    loadComponent: () =>
      import('./brands/brands.component').then((m) => m.BrandsComponent),
    title: 'Brands - Ultimate POS',
  },
  {
    path: 'units',
    loadComponent: () =>
      import('./units/units.component').then((m) => m.UnitsComponent),
    title: 'Units - Ultimate POS',
  },
  {
    path: 'barcodes',
    loadComponent: () =>
      import('./barcode/barcode-print.component').then(
        (m) => m.BarcodePrintComponent,
      ),
    title: 'Barcode Labels - Ultimate POS',
  },
];
