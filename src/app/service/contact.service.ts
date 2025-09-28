import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, delay, firstValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import { Contact } from '../models/contact.model';
import { DBConfig, NgxIndexedDBService } from 'ngx-indexed-db';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  contacts: Contact[] = []; //רשימת אנשי קשר בתצוגה
  private apiUrl = 'https://localhost:7139/Contact';

  constructor(private http: HttpClient, private dbService: NgxIndexedDBService) { }


  getContacts(): Observable<any> {
    //אם הצליח להגיע לשרת
    return this.http.get<any[]>(this.apiUrl).pipe(
      switchMap(serverContacts => {
        this.syncToServerDB(); //מסנכרנים לתוך השרת
        localStorage.setItem('offline', 'false');
        return of(serverContacts);
      }),
      catchError((error: any) => {
        // שגיאה בשרת (0 = לא זמין, 503 = שרת מכובה)
        if (error.status === 0 || error.status === 503) {
          localStorage.setItem('offline', 'true');
          // פונים ללוקאל DB
          return this.dbService.getAll('contact');
        }
        return of([]);
      }),
      map((contacts: any) => this.sortHebThenEng(contacts))
    );
  }




  private saveToIndexedDB(contacts: any[]): void {
    if (!Array.isArray(contacts) || contacts.length === 0) return;

    contacts.forEach((contact) => {
      this.dbService.add('contact', contact).subscribe({
        next: () => { },
        error: () => {
          // אם כבר קיים – ננסה לעדכן
          this.dbService.update('contact', contact).subscribe({
            next: () => { },
            error: () => { }
          });
        }
      });
    });
  }


  createContact(contact: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, contact).pipe(
      tap(async (createdContact: any) => {
        // שמירה מהשרת ללוקאל (עם Id אמיתי)
        try {
          await this.dbService.add('contact', createdContact).toPromise();
        } catch (error) { }
      }),
      catchError((error: any) => {
        // כשהשרת לא זמין — יצירת Id זמני ושלילי ושמירה בלוקאל
        if (error.status === 0 || error.status === 503) {
          if (!contact.id) {
            contact.id = 0;  // <-- כאן השינוי: מזהה זמני שלילי
          }
          return this.dbService.add('contact', contact).pipe(
            tap(() => {
              localStorage.setItem('offline', 'true');
            }),
            map(() => contact),
            catchError(() => of(contact))
          );
        }
        return of([error]);
      })
    );
  }


  updateContact(_id: number, contact: any): Observable<any> {
    return this.http.put<any>(this.apiUrl, contact).pipe(
      tap(async (updatedContact: any) => {
        try {
          await this.dbService.update('contact', updatedContact).toPromise();
          await this.handleOfflineSync();
        } catch { }
      }),
      catchError((error: any) => {
        if (error.status === 0 || error.status === 503) {
          // עדכון מקומי במצב offline + סימון offline
          return this.dbService.update('contact', contact).pipe(
            tap(() => localStorage.setItem('offline', 'true')),
            map(() => contact),
            catchError(() => of(contact))
          );
        }
        return of([error]);
      })
    );
  }


  deleteContact(id: number): Observable<any> {
    console.log('מוחק איש קשר עם ID:', id);

    return this.http.delete<any>(`${this.apiUrl}?id=${id}`).pipe(
      tap(async (response) => {
        console.log('נמחק מהשרת:', response);
        try {
          await this.dbService.delete('contact', id).toPromise();
          console.log('נמחק מ-IndexedDB');
        } catch (error) {
          console.log('שגיאה במחיקה מ-IndexedDB:', error);
        }
      }),
      catchError((error: any) => {
        console.log('שגיאה בשרת:', error.status);
        if (error.status === 0 || error.status === 503) {
          // מחק מ-IndexedDB ומחזיר Observable
          return this.dbService.delete('contact', id).pipe(
            tap(() => {
              localStorage.setItem('offline', 'true');
              console.log('נמחק מ-IndexedDB במצב offline');
            }),
            catchError((dbError) => {
              console.log('שגיאה במחיקה offline:', dbError);
              return of(null);
            }),
            map(() => ({ deleted: true }))
          );
        }
        return of([error]);
      })
    );
  }

  getContact(id: number): Observable<Contact | undefined> {
    return this.getContacts().pipe(
      map(list => list.find((c: any) => (c.id ?? c.Id) === id))
    );
  }


  fetchRandomContacts(count = 10): Observable<Contact[]> {
    const url = `https://randomuser.me/api/?results=${count}&inc=name,location,email,phone,cell,registered,dob,picture&noinfo`;

    return this.http.get<any>(url).pipe(
      // מיפוי תוצאת randomuser לאובייקטים ללא id (השרת יקצה כשזמין)
      map(res =>
        (res?.results ?? []).map((u: any) => ({
          name: `${u.name?.first ?? ''} ${u.name?.last ?? ''}`.trim(),
          fullAddress: [
            u.location?.street?.name,
            u.location?.street?.number,
            u.location?.city,
            u.location?.state,
            u.location?.country
          ].filter(Boolean).join(', '),
          email: u.email ?? '',
          phone: u.phone ?? '',
          cell: (u.cell ?? '').replace(/\D/g, ''),
          registrationDate: u.registered?.date ? new Date(u.registered.date) : new Date(),
          age: Number(u.dob?.age ?? 0),
          image: u.picture?.medium ?? u.picture?.thumbnail ?? ''
        }))
      ),
      // ניסיון לשלוח לשרת ב-bulk כדי לקבל ID אמיתיים
      switchMap((contactsNoId: any[]) =>
        this.http.post<Contact[]>(`${this.apiUrl}/bulk`, contactsNoId).pipe(
          tap(serverContacts => this.saveToIndexedDB(serverContacts as any[])),
          map(serverContacts => serverContacts),
          catchError(() => {
            const withTempIds: Contact[] = (contactsNoId || []).map((c, i) => ({
              id: - i,
              ...c
            }));
            localStorage.setItem('offline', 'true'); // סימון אופליין
            // שמירה בלוקאל כדי שיופיע מיד
            this.saveToIndexedDB(withTempIds as any[]);
            return of(withTempIds);
          })
        )
      )
    );
  }


  isHebrew(str: string): boolean {
    const firstChar = (str ?? '').trim().charAt(0);
    return /^[\u0590-\u05FF]/.test(firstChar);
  }

  sortHebThenEng(contacts: any[]): any[] {
    const collHe = new Intl.Collator('he', { sensitivity: 'base', numeric: true });
    const collEn = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

    const heb = contacts
      .filter(c => this.isHebrew(c?.name ?? ''))
      .sort((a, b) => collHe.compare(a.name ?? '', b.name ?? ''));

    const eng = contacts
      .filter(c => !this.isHebrew(c?.name ?? ''))
      .sort((a, b) => collEn.compare(a.name ?? '', b.name ?? ''));

    return [...heb, ...eng];
  }

  private async handleOfflineSync(): Promise<void> {
    const storageData = localStorage.getItem('offline');
    if (storageData && JSON.parse(storageData) === true) {
      try {
        await this.syncToServerDB();
        localStorage.setItem('offline', 'false');
      } catch (error) {
      }
    }
  }



  async syncToServerDB(): Promise<void> {
    // שליפת כל אנשי הקשר מהלוקאל
    const local = await firstValueFrom(this.dbService.getAll<Contact>('contact'));

    // שליחה לשרת וקבלת הרשימה המעודכנת בחזרה
    const serverContacts = await firstValueFrom(
      this.http.put<Contact[]>(`${this.apiUrl}/syncFromClient`, local)
    );

    // מחיקה מלאה של הלוקאל
    await firstValueFrom(this.dbService.clear('contact'));

    // הכנסת כל הנתונים המעודכנים מהשרת ללוקאל
    for (const contact of serverContacts) {
      await firstValueFrom(this.dbService.add('contact', contact));
    }

    // סימון שהמצב עכשיו אונליין
    localStorage.setItem('offline', 'false');

    //עדכון הרשימה המקומית שעליה התצוגה רצה
    this.contacts = serverContacts.map(c => ({ ...c }));
  }

}