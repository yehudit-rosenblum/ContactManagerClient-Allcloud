import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from '../../models/contact.model';
import { ContactService } from '../../service/contact.service';

@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.component.html',
  styleUrls: ['./contact-detail.component.scss']  // שנה מ-css ל-scss
})
export class ContactDetailComponent implements OnInit {
  contactForm: FormGroup;
  contact: Contact = {
    id: 0,
    name: '',
    fullAddress: '',
    email: '',
    phone: '',
    cell: '',
    registrationDate: new Date(),
    age: 0,
    image: ''
  };

  isEditMode = false; // הוסף משתנה זה

  isNewContact = false;
  loading = false;
  contactId: number | null = null;

  //לטוסט
  saveMessage: string | null = null;
  saveSuccess = false;

  constructor(private route: ActivatedRoute, private router: Router,
    private formBuilder: FormBuilder, private contactService: ContactService) {
    this.contactForm = this.createForm();
  }

  ngOnInit(): void {
    this.isEditMode = false; // הוסף שורה זו בתחילה

    // 1) אם הגענו מהרשימה עם state – עריכה בלי API
    const stateContact = history.state?.contact as Contact | undefined;
    if (stateContact) {
      this.isNewContact = false;
      this.contactId = stateContact.id ?? null;
      this.contact = stateContact;
      this.updateForm();
      return;
    }

    // 2) זיהוי מצב לפי הראוט בפועל:
    this.route.params.subscribe(params => {
      const id = params['id']; // ב-/contact/new אין id בכלל
      if (!id) {
        // NEW
        this.isNewContact = true;
        this.contactId = null;
        this.contact.registrationDate = new Date();

        // איפוס טופס לברירת מחדל (מומלץ כדי לנקות שאריות)
        this.contactForm.reset({
          name: '',
          fullAddress: '',
          email: '',
          phone: '',
          cell: '',
          age: null,
          image: ''
        });
      } else {
        // EDIT
        this.isNewContact = false;
        this.contactId = +id;
        this.loadContact(); // fallback כשנכנסים ישירות עם :id
      }
    });
  }


  createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      fullAddress: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(/^\+?\d[\d\s\-()]{7,15}$/)],
      cell: ['', [Validators.required, Validators.pattern(/^\+?\d[\d\s\-()]{7,15}$/)]],
      age: [null, [Validators.min(1), Validators.max(120)]],
      image: ['']
    });
  }

  onEdit(): void {
    this.isEditMode = true;
  }


  //מביאים את הפרטים של האיש קשר וממלאים בטופס
  loadContact(): void {
    if (this.contactId) {
      this.loading = true;
      this.contactService.getContact(this.contactId).subscribe({
        next: (contact) => {
          if (contact) {
            this.contact = contact;
            this.updateForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading contact:', error);
          this.loading = false;
        }
      });
    }
  }

  updateForm(): void {
    this.contactForm.patchValue({
      name: this.contact.name,
      fullAddress: this.contact.fullAddress,
      email: this.contact.email,
      phone: this.contact.phone,
      cell: this.contact.cell,
      age: this.contact.age,
      image: this.contact.image
    });
  }


  goBack(): void {
    this.router.navigate(['/contacts']);
  }


  onCancel(): void {
    if (this.isNewContact) {
      this.router.navigate(['/contacts']);
    } else if (this.isEditMode) {
      this.isEditMode = false;
      this.updateForm(); // החזר לערכים המקוריים
    } else {
      this.router.navigate(['/contacts']);
    }
  }

  onSave(): void {
    if (this.contactForm.valid) {
      this.loading = true;

      const formValue = this.contactForm.value;
      const contactToSave: Contact = {
        ...this.contact,
        ...formValue,
        registrationDate: this.contact.registrationDate
      };

      //אם זה איש קשר חדש
      if (this.isNewContact) {
        this.contactService.createContact(contactToSave).subscribe({
          next: (createdContact) => {
            this.loading = false;
            this.showMessage('איש הקשר נשמר בהצלחה ✅', true);
            this.router.navigate(['/contacts']);
          },
          error: (error) => {
            this.loading = false;
            this.showMessage('שגיאה בשמירת איש הקשר ❌', false);
          }
        });
      }
      // עריכת איש קשר
      else if (this.contactId != null) {
        const id = this.contactId; // עכשיו זה number, לא null
        const contactToSaveWithId: Contact = { ...contactToSave, id };

        this.contactService.updateContact(id, contactToSaveWithId).subscribe({
          next: (updatedContact) => {
            // נרמול מפתח המזהה במקרה שהשרת מחזיר Id עם I גדולה
            const normalizedId = updatedContact?.id ?? updatedContact?.Id ?? id;
            this.contact = { ...(updatedContact ?? contactToSaveWithId), id: normalizedId };

            this.loading = false;
            this.isEditMode = false;
            this.showMessage('השינויים נשמרו בהצלחה ✅', true);
          },
          error: () => {
            this.loading = false;
            this.showMessage('שגיאה בעדכון איש הקשר ❌', false);
          }
        });
      }

    } else {
      // סמן שדות לא תקינים
      this.contactForm.markAllAsTouched();
    }
  }

  onDelete(): void {
    this.loading = true;
    this.contactService.deleteContact(this.contactId!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/contacts']);
      },
      error: (error) => {
        console.error('Error deleting contact:', error);
        this.loading = false;
      }
    });
  }


  // Helper methods לבדיקת שגיאות בטופס
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} הוא שדה חובה`;
      if (field.errors['email']) return 'כתובת אימייל לא תקינה';
      if (field.errors['pattern']) return 'פורמט לא תקין';
      if (field.errors['minlength']) return 'טקסט קצר מדי';
      if (field.errors['min']) return 'ערך נמוך מדי';
      if (field.errors['max']) return 'ערך גבוה מדי';
    }
    return '';
  }


  private showMessage(msg: string, success = true) {
    this.saveMessage = msg;
    this.saveSuccess = success;
    setTimeout(() => this.saveMessage = null, 3000);
  }
}