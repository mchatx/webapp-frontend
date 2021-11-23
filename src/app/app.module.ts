import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { ProxyappComponent } from './proxyapp/proxyapp.component';
import { ProxyappsetComponent } from './proxyappset/proxyappset.component';
import { TranslatorClientComponent } from './translator-client/translator-client.component';
import { ScriptEditorComponent } from './script-editor/script-editor.component';
import { ChatboardComponent } from './chatboard/chatboard.component';
import { ArchiveEditComponent } from './archive-edit/archive-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    ScrollToTopComponent,
    ProxyappComponent,
    ProxyappsetComponent,
    TranslatorClientComponent,
    ScriptEditorComponent,
    ChatboardComponent,
    ArchiveEditComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxPageScrollModule,
    FontAwesomeModule,
    HighlightModule,
    FormsModule,
    HttpClientModule,
    SelectDropDownModule
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        fullLibraryLoader: () => import('highlight.js'),
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
