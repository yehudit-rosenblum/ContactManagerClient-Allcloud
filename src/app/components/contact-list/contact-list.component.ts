import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, take } from 'rxjs';
import { Contact } from 'src/app/models/contact.model';
import { ContactService } from 'src/app/service/contact.service';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent implements OnInit {
 
  loading = false;
  contactId: number | null = null;

  constructor(public contactService: ContactService, private router: Router) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  // מביא את כל הרשימה
loadContacts(): void {
  this.loading = true;
  this.contactService.getContacts().pipe(take(1)).subscribe({
    next: (contacts) => {
      this.contactService.contacts = contacts ? [...contacts] : []; // ← מערך חדש כדי לטריגר רינדור
      this.loading = false;
    },
    error: (error) => {
      this.loading = false;
    }
  });
}



  // יצירת איש קשר חדש
onNewContact(): void {
  this.router.navigate(['/contact/new']);
}


onContactClick(contact: Contact): void {
  if (contact?.id != null) {
    this.router.navigate(['/contact', contact.id], { state: { contact } });
  }
}

onEdit(contact: Contact): void {
    this.router.navigate(['/contact', contact.id], { state: { contact } });

}

  // מחיקת איש קשר
onDelete(contact: Contact): void {
  const id = Number((contact as any).id ?? (contact as any).Id);
  if (Number.isNaN(id)) return;

  this.loading = true;
  this.contactService.deleteContact(id).subscribe({
    next: () => {
      // להסיר מהרשימה מיידית
      this.contactService.contacts = this.contactService.contacts.filter(c => Number((c as any).id ?? (c as any).Id) !== id);
      this.loading = false;
    },
    error: (err) => { console.error(err); this.loading = false; }
  });
}

// הוספת 10 אנשי קשר רנדומליים
onAddRandomContacts(): void {
  this.loading = true;

  this.contactService.fetchRandomContacts(10).subscribe({
    next: () => {
      this.loadContacts();      // רענון בלבד – בלי createContact ובלי forkJoin
      this.loading = false;
    },
    error: (err) => {
      console.error('שגיאה בשליפה מ-randomuser:', err);
      this.loading = false;
    }
  });
}

}