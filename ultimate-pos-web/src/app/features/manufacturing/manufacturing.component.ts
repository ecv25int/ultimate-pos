import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ManufacturingService } from '../../core/services/manufacturing.service';
import { MfgIngredientGroup, MfgRecipe } from '../../core/models/manufacturing.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-manufacturing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">precision_manufacturing</mat-icon>
          <div>
            <h1>Manufacturing</h1>
            <p class="subtitle">Recipes, ingredients &amp; production groups</p>
          </div>
        </div>
      </div>

      <mat-tab-group>
        <!-- RECIPES TAB -->
        <mat-tab label="Recipes">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>{{ editingRecipeId() ? 'edit' : 'add_circle' }}</mat-icon></div>
                <mat-card-title>{{ editingRecipeId() ? 'Edit Recipe' : 'New Recipe' }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="recipeForm" (ngSubmit)="submitRecipe()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Product ID</mat-label>
                      <input matInput type="number" formControlName="productId" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Variation ID</mat-label>
                      <input matInput type="number" formControlName="variationId" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Final Price</mat-label>
                      <input matInput type="number" formControlName="finalPrice" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Total Quantity</mat-label>
                      <input matInput type="number" formControlName="totalQuantity" />
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Instructions</mat-label>
                    <textarea matInput rows="3" formControlName="instructions"></textarea>
                  </mat-form-field>

                  <h3>Ingredients</h3>
                  <div formArrayName="ingredients">
                    <div *ngFor="let ing of ingredientsArray.controls; let i = index"
                         [formGroupName]="i" class="ingredient-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Variation ID</mat-label>
                        <input matInput type="number" formControlName="variationId" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Quantity</mat-label>
                        <input matInput type="number" formControlName="quantity" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Waste %</mat-label>
                        <input matInput type="number" formControlName="wastePercent" />
                      </mat-form-field>
                      <button mat-icon-button color="warn" type="button" (click)="removeIngredient(i)">
                        <mat-icon>remove_circle</mat-icon>
                      </button>
                    </div>
                  </div>
                  <button mat-stroked-button type="button" (click)="addIngredient()">
                    <mat-icon>add</mat-icon> Add Ingredient
                  </button>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit"
                            [disabled]="recipeForm.invalid || saving()">
                      {{ editingRecipeId() ? 'Update Recipe' : 'Create Recipe' }}
                    </button>
                    <button *ngIf="editingRecipeId()" mat-stroked-button type="button" (click)="cancelEdit()">
                      Cancel
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon orange"><mat-icon>menu_book</mat-icon></div>
                <mat-card-title>Recipes ({{ recipes().length }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div *ngIf="loading()" class="spinner-center"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="recipes()" *ngIf="!loading()" class="full-width-table">
                  <ng-container matColumnDef="productId">
                    <th mat-header-cell *matHeaderCellDef>Product ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.productId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="variationId">
                    <th mat-header-cell *matHeaderCellDef>Variation ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.variationId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="finalPrice">
                    <th mat-header-cell *matHeaderCellDef>Final Price</th>
                    <td mat-cell *matCellDef="let r">{{ r.finalPrice }}</td>
                  </ng-container>
                  <ng-container matColumnDef="ingredients">
                    <th mat-header-cell *matHeaderCellDef>Ingredients</th>
                    <td mat-cell *matCellDef="let r">{{ r.ingredients?.length ?? 0 }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button (click)="editRecipe(r)"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button color="warn" (click)="deleteRecipe(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="recipeColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: recipeColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- INGREDIENT GROUPS TAB -->
        <mat-tab label="Ingredient Groups">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon green"><mat-icon>add_circle</mat-icon></div>
                <mat-card-title>New Ingredient Group</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="groupForm" (ngSubmit)="submitGroup()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Description</mat-label>
                      <input matInput formControlName="description" />
                    </mat-form-field>
                  </div>
                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit"
                            [disabled]="groupForm.invalid || saving()">Add Group</button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon purple"><mat-icon>category</mat-icon></div>
                <mat-card-title>Groups ({{ groups().length }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="groups()" class="full-width-table">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let g">{{ g.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Description</th>
                    <td mat-cell *matCellDef="let g">{{ g.description ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let g">
                      <button mat-icon-button color="warn" (click)="deleteGroup(g.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="groupColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: groupColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .tab-content { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
    .form-card, .list-card { border-radius: 12px; overflow: hidden; }
    .card-avatar-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; }
    .card-avatar-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.green  { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon.orange { color: #f57c00; background: #fff3e0; }
    .card-avatar-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .form-row mat-form-field { flex: 1; min-width: 160px; }
    .full-width { width: 100%; }
    .full-width-table { width: 100%; }
    .ingredient-row { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
    .ingredient-row mat-form-field { flex: 1; min-width: 120px; }
    .form-actions { display: flex; gap: 12px; margin-top: 1rem; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
  `],
})
export class ManufacturingComponent implements OnInit {
  private svc = inject(ManufacturingService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  recipes = signal<MfgRecipe[]>([]);
  groups = signal<MfgIngredientGroup[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingRecipeId = signal<number | null>(null);

  recipeColumns = ['productId', 'variationId', 'finalPrice', 'ingredients', 'actions'];
  groupColumns = ['name', 'description', 'actions'];

  recipeForm = this.fb.group({
    productId: [null as number | null, Validators.required],
    variationId: [null as number | null, Validators.required],
    finalPrice: [0, Validators.required],
    totalQuantity: [0],
    instructions: [''],
    ingredients: this.fb.array([]),
  });

  groupForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  get ingredientsArray(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.svc.getRecipes().subscribe({ next: v => this.recipes.set(v), complete: () => this.loading.set(false) });
    this.svc.getIngredientGroups().subscribe({ next: v => this.groups.set(v) });
  }

  addIngredient() {
    this.ingredientsArray.push(this.fb.group({
      variationId: [null, Validators.required],
      quantity: [1, Validators.required],
      wastePercent: [0],
    }));
  }

  removeIngredient(index: number) {
    this.ingredientsArray.removeAt(index);
  }

  submitRecipe() {
    if (this.recipeForm.invalid) return;
    this.saving.set(true);
    const val = this.recipeForm.value as any;
    const obs = this.editingRecipeId()
      ? this.svc.updateRecipe(this.editingRecipeId()!, val)
      : this.svc.createRecipe(val);
    obs.subscribe({
      next: () => {
        this.snack.open('Recipe saved', 'OK', { duration: 2000 });
        this.cancelEdit();
        this.loadAll();
      },
      error: () => this.snack.open('Error saving recipe', 'OK', { duration: 2000 }),
      complete: () => this.saving.set(false),
    });
  }

  editRecipe(r: MfgRecipe) {
    this.editingRecipeId.set(r.id);
    this.ingredientsArray.clear();
    (r.ingredients ?? []).forEach(ing => {
      this.ingredientsArray.push(this.fb.group({
        variationId: [ing.variationId, Validators.required],
        quantity: [ing.quantity, Validators.required],
        wastePercent: [ing.wastePercent ?? 0],
      }));
    });
    this.recipeForm.patchValue({
      productId: r.productId,
      variationId: r.variationId,
      finalPrice: r.finalPrice,
      totalQuantity: r.totalQuantity ?? 0,
      instructions: r.instructions ?? '',
    });
  }

  cancelEdit() {
    this.editingRecipeId.set(null);
    this.recipeForm.reset({ finalPrice: 0, totalQuantity: 0 });
    this.ingredientsArray.clear();
  }

  deleteRecipe(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Recipe', message: 'Delete this recipe?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteRecipe(id).subscribe({ next: () => this.loadAll() });
    });
  }

  submitGroup() {
    if (this.groupForm.invalid) return;
    this.saving.set(true);
    this.svc.createIngredientGroup(this.groupForm.value as any).subscribe({
      next: () => {
        this.snack.open('Group created', 'OK', { duration: 2000 });
        this.groupForm.reset();
        this.loadAll();
      },
      error: () => this.snack.open('Error creating group', 'OK', { duration: 2000 }),
      complete: () => this.saving.set(false),
    });
  }

  deleteGroup(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Group', message: 'Delete this group?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteIngredientGroup(id).subscribe({ next: () => this.loadAll() });
    });
  }
}
