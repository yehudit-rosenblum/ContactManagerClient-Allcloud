import { Component, OnInit } from '@angular/core';
import { ContactService } from './service/contact.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'contactManagerFront';
  loading = true;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    // טען את הנתונים מיד כשהאפליקציה מתחילה
    this.contactService.getContacts().subscribe({
      next: (contacts) => {
        this.loading = false;  // הסתר ספינר כשהנתונים הגיעו
      },
      error: (error) => {
        this.loading = false;  // הסתר ספינר גם במקרה של שגיאה
      }
    });
  }
}
