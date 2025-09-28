// import { NgModule } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { HttpClientModule } from '@angular/common/http';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// import { AppRoutingModule } from './app-routing.module';
// import { AppComponent } from './app.component';

// import { SpinnerComponent } from './components/spinner/spinner.component';
// import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
// import { ContactListComponent } from './components/contact-list/contact-list.component';
// import { ContactDetailComponent } from './components/contact-detail/contact-detail.component';

// const dbConfig: DBConfig = {
//   name: 'localDB',
//   version: 1,
//   objectStoresMeta: [
//     {
//       store: 'contact',
//       storeConfig: { keyPath: 'id', autoIncrement: true },
//       storeSchema: [
//         { name: 'name', keypath: 'name', options: { unique: false } },
//         { name: 'fullAddress', keypath: 'fullAddress', options: { unique: false } },
//         { name: 'email', keypath: 'email', options: { unique: false } },
//         { name: 'phone', keypath: 'phone', options: { unique: false } },
//         { name: 'cell', keypath: 'cell', options: { unique: false } },
//         { name: 'registrationDate', keypath: 'registrationDate', options: { unique: false } },
//         { name: 'age', keypath: 'age', options: { unique: false } },
//         { name: 'image', keypath: 'image', options: { unique: false } }
//       ]
//     }
//   ]
// }

// @NgModule({
//   declarations: [
//     AppComponent,
//     ContactListComponent,
//     ContactDetailComponent,
//     SpinnerComponent
//   ],
//   imports: [
//     BrowserModule,
//     AppRoutingModule,
//     HttpClientModule,
//     FormsModule,
//     ReactiveFormsModule,
//     NgxIndexedDBModule.forRoot(dbConfig)
//   ],
//   providers: [],
//   bootstrap: [AppComponent]
// })
// export class AppModule { }







import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SpinnerComponent } from './components/spinner/spinner.component';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { ContactDetailComponent } from './components/contact-detail/contact-detail.component';

const dbConfig: DBConfig = {
  name: 'localDB',
  version: 1,
  objectStoresMeta: [
    {
      store: 'contact',
      storeConfig: { keyPath: 'id', autoIncrement: false }, // שינוי ל-false
      storeSchema: [
        { name: 'id', keypath: 'id', options: { unique: true } }, // הוספת id לסכימה
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'fullAddress', keypath: 'fullAddress', options: { unique: false } },
        { name: 'email', keypath: 'email', options: { unique: false } },
        { name: 'phone', keypath: 'phone', options: { unique: false } },
        { name: 'cell', keypath: 'cell', options: { unique: false } },
        { name: 'registrationDate', keypath: 'registrationDate', options: { unique: false } },
        { name: 'age', keypath: 'age', options: { unique: false } },
        { name: 'image', keypath: 'image', options: { unique: false } }
      ]
    }
  ]
}

@NgModule({
  declarations: [
    AppComponent,
    ContactListComponent,
    ContactDetailComponent,
    SpinnerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgxIndexedDBModule.forRoot(dbConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }