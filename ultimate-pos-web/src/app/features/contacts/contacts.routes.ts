import { Routes } from '@angular/router';

export const contactsRoutes: Routes = [
  {
    path: '',
    title: 'Contacts - Ultimate POS',
    loadComponent: () =>
      import('./contacts-list/contacts-list.component').then(
        (m) => m.ContactsListComponent,
      ),
  },
  {
    path: 'create',
    title: 'Add Contact - Ultimate POS',
    loadComponent: () =>
      import('./contact-form/contact-form.component').then(
        (m) => m.ContactFormComponent,
      ),
  },
  {
    path: 'edit/:id',
    title: 'Edit Contact - Ultimate POS',
    loadComponent: () =>
      import('./contact-form/contact-form.component').then(
        (m) => m.ContactFormComponent,
      ),
  },
  {
    path: 'detail/:id',
    title: 'Contact Detail - Ultimate POS',
    loadComponent: () =>
      import('./contact-detail/contact-detail.component').then(
        (m) => m.ContactDetailComponent,
      ),
  },
];
