import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your business configuration</p>
        </div>
      </div>

      <div class="settings-nav">
        <a routerLink="tax-rates" routerLinkActive="active" class="settings-card">
          <span class="icon">%</span>
          <div>
            <strong>Tax Rates</strong>
            <p>Define tax rates for products and sales</p>
          </div>
        </a>
        <a routerLink="users" routerLinkActive="active" class="settings-card">
          <span class="icon">👥</span>
          <div>
            <strong>User Management</strong>
            <p>Manage staff accounts and roles</p>
          </div>
        </a>
        <a routerLink="business-locations" routerLinkActive="active" class="settings-card">
          <span class="icon">📍</span>
          <div>
            <strong>Business Locations</strong>
            <p>Manage branches and store locations</p>
          </div>
        </a>
        <a routerLink="invoice-settings" routerLinkActive="active" class="settings-card">
          <span class="icon">🧾</span>
          <div>
            <strong>Invoice Settings</strong>
            <p>Configure layouts and numbering schemes</p>
          </div>
        </a>
        <a routerLink="customer-groups" routerLinkActive="active" class="settings-card">
          <span class="icon">🏷️</span>
          <div>
            <strong>Customer Groups</strong>
            <p>Group customers for pricing and discounts</p>
          </div>
        </a>
        <a routerLink="selling-price-groups" routerLinkActive="active" class="settings-card">
          <span class="icon">💲</span>
          <div>
            <strong>Selling Price Groups</strong>
            <p>Create custom price lists for segments</p>
          </div>
        </a>
        <a routerLink="discounts" routerLinkActive="active" class="settings-card">
          <span class="icon">🎟️</span>
          <div>
            <strong>Discounts</strong>
            <p>Define percentage or fixed discounts</p>
          </div>
        </a>
        <a routerLink="warranties" routerLinkActive="active" class="settings-card">
          <span class="icon">🛡️</span>
          <div>
            <strong>Warranties</strong>
            <p>Set warranty periods for products</p>
          </div>
        </a>
        <a routerLink="notification-templates" routerLinkActive="active" class="settings-card">
          <span class="icon">🔔</span>
          <div>
            <strong>Notification Templates</strong>
            <p>Email and SMS templates for events</p>
          </div>
        </a>
        <a routerLink="variation-templates" routerLinkActive="active" class="settings-card">
          <span class="icon">🔀</span>
          <div>
            <strong>Variation Templates</strong>
            <p>Define product attribute types (Size, Color)</p>
          </div>
        </a>
        <a routerLink="barcode-labels" routerLinkActive="active" class="settings-card">
          <span class="icon">🏷️</span>
          <div>
            <strong>Barcode Label Templates</strong>
            <p>Define label sizes and formats for printing</p>
          </div>
        </a>
        <a routerLink="audit-logs" routerLinkActive="active" class="settings-card">
          <span class="icon">📋</span>
          <div>
            <strong>Audit Log</strong>
            <p>Track all create, update, and delete actions</p>
          </div>
        </a>
        <a routerLink="sms-notifications" routerLinkActive="active" class="settings-card">
          <span class="icon">📱</span>
          <div>
            <strong>SMS Notifications</strong>
            <p>Configure Twilio SMS alerts for low stock, sales, and payment reminders</p>
          </div>
        </a>
        <a routerLink="push-notifications" routerLinkActive="active" class="settings-card">
          <span class="icon">🔔</span>
          <div>
            <strong>Push Notifications</strong>
            <p>Subscribe to browser push alerts for sales, low stock, and purchase orders</p>
          </div>
        </a>
        <a routerLink="backup" routerLinkActive="active" class="settings-card">
          <span class="icon">💾</span>
          <div>
            <strong>Backup &amp; Restore</strong>
            <p>Download database backups and restore from a .sql.gz file</p>
          </div>
        </a>
        <a routerLink="scheduled-reports" routerLinkActive="active" class="settings-card">
          <span class="icon">📅</span>
          <div>
            <strong>Scheduled Reports</strong>
            <p>Auto-email sales, expense, and inventory reports on a recurring schedule</p>
          </div>
        </a>
        <a routerLink="cash-drawer" routerLinkActive="active" class="settings-card">
          <span class="icon">🪙</span>
          <div>
            <strong>Cash Drawer</strong>
            <p>Configure the cash drawer connected to your POS terminal via network or serial</p>
          </div>
        </a>
      </div>

      <div class="settings-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .page-header p { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .settings-nav {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .settings-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      background: #fff;
      min-width: 220px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    }
    .settings-card:hover, .settings-card.active {
      border-color: #1976d2;
      background: #e3f2fd;
    }
    .settings-card .icon {
      font-size: 24px;
      width: 40px;
      text-align: center;
    }
    .settings-card strong { display: block; margin-bottom: 4px; }
    .settings-card p { margin: 0; font-size: 12px; color: #666; }
  `],
})
export class SettingsComponent {}
