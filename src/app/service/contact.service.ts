import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Contact } from '../models/contact.model';


@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'https://localhost:7139/Contact'; // הכתובת 

  constructor(private http: HttpClient) { }

  // קבלת כל אנשי הקשר
  // getContacts(): Observable<Contact[]> {
  //   return this.http.get<Contact[]>(this.apiUrl);
  // }



  // קבלת כל אנשי הקשר
  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl).pipe(
      map(contacts => this.sortHebThenEng(contacts))
    );
  }

  // יצירת איש קשר חדש
  createContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }

  // עדכון איש קשר
  updateContact(_id: number, contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(this.apiUrl, contact);
  }

  // מחיקת איש קשר
  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}?id=${id}`);
  }


  //לוקח מהאנגולר ולא פונה לשרת
  getContact(id: number): Observable<Contact | undefined> {
    return this.getContacts().pipe(
      map(list => list.find((c: any) => (c.id ?? c.Id) === id))
    );
  }


  //יוצר 10 אנשי קשר אקראיים
  fetchRandomContacts(count = 10): Observable<Contact[]> {
    const url = `https://randomuser.me/api/?results=${count}&inc=name,location,email,phone,cell,registered,dob,picture&noinfo`;
    return this.http.get<any>(url).pipe(
      map(res =>
        (res?.results ?? []).map((u: any): Contact => ({
          // שם מלא
          name: `${u.name?.first ?? ''} ${u.name?.last ?? ''}`.trim(),
          // כתובת מלאה
          fullAddress: [
            u.location?.street?.name,
            u.location?.street?.number,
            u.location?.city,
            u.location?.state,
            u.location?.country
          ].filter(Boolean).join(', '),
          email: u.email ?? '',
          phone: u.phone ?? '',
          cell: (u.cell ?? '').replace(/\D/g, ''), // אופציונלי: נרמול ספרות
          registrationDate: u.registered?.date ? new Date(u.registered.date) : new Date(),
          age: Number(u.dob?.age ?? 0),
          image: u.picture?.medium ?? u.picture?.thumbnail ?? ''
        }))
      )
    );
  }





  // פונקציה שמזהה אם השם מתחיל באות עברית
  isHebrew(str: string): boolean {
    const firstChar = (str ?? '').trim().charAt(0);
    return /^[\u0590-\u05FF]/.test(firstChar);
  }

  // פונקציה שממיינת: קודם עברית -> אחר כך אנגלית
  sortHebThenEng(contacts: Contact[]): Contact[] {
    const collHe = new Intl.Collator('he', { sensitivity: 'base', numeric: true });
    const collEn = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

    const heb = contacts
      .filter(c => this.isHebrew(c?.name ?? ''))
      .sort((a, b) => collHe.compare(a.name ?? '', b.name ?? ''));

    const eng = contacts
      .filter(c => !this.isHebrew(c?.name ?? ''))
      .sort((a, b) => collEn.compare(a.name ?? '', b.name ?? ''));

    return [...heb, ...eng]; // קודם כל העברית ואז האנגלית
  }

}



