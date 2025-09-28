import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { ContactDetailComponent } from './components/contact-detail/contact-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'contacts', pathMatch: 'full' }, // ← בלי '/'
  { path: 'contacts', component: ContactListComponent },
  { path: 'contact/new', component: ContactDetailComponent }, // חייב לבוא לפני :id
  { path: 'contact/:id', component: ContactDetailComponent },
  { path: '**', redirectTo: 'contacts' } 
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }