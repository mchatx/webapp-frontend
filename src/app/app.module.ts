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
import { DocsComponent } from './docs/docs.component';
import { AboutComponent } from './about/about.component';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';
import { NewRoomComponent } from './new-room/new-room.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { ArchiveComponent } from './archive/archive.component';
import { ScheduleEditComponent } from './schedule-edit/schedule-edit.component'
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { ArchiveEditComponent } from './archive-edit/archive-edit.component';
import { LoginComponent } from './login/login.component';
import { VerivyComponent } from './verivy/verivy.component';
import { SignupComponent } from './signup/signup.component';
import { RestartpassComponent } from './restartpass/restartpass.component';
import { AccountpageComponent } from './accountpage/accountpage.component';
import { TestingGroundComponent } from './testing-ground/testing-ground.component';
import { RequestboardComponent } from './requestboard/requestboard.component';
import { ArchiveDetailComponent } from './archive-detail/archive-detail.component';
import { RoomComponent } from './room/room.component';
import { ProxyappComponent } from './proxyapp/proxyapp.component';
import { ProxyappsetComponent } from './proxyappset/proxyappset.component';
import { WebappComponent } from './webapp/webapp.component';
import { TranslatorClientComponent } from './translator-client/translator-client.component';
import { ScriptEditorComponent } from './script-editor/script-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    DocsComponent,
    AboutComponent,
    ScrollToTopComponent,
    NewRoomComponent,
    ScheduleComponent,
    ScheduleEditComponent,
    ArchiveComponent,
    ArchiveEditComponent,
    LoginComponent,
    VerivyComponent,
    SignupComponent,
    RestartpassComponent,
    AccountpageComponent,
    TestingGroundComponent,
    RequestboardComponent,
    ArchiveDetailComponent,
    RoomComponent,
    ProxyappComponent,
    ProxyappsetComponent,
    WebappComponent,
    TranslatorClientComponent,
    ScriptEditorComponent
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
