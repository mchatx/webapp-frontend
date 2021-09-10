import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { DocsComponent } from './docs/docs.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { NewRoomComponent } from './new-room/new-room.component'
import { ScheduleComponent } from './schedule/schedule.component';
import { ScheduleEditComponent } from './schedule-edit/schedule-edit.component'
import { ArchiveComponent } from './archive/archive.component';
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

const routes: Routes = [
  { path: 'about', component: AboutComponent },
  { path: 'docs', component: DocsComponent },
  //{ path: 'docs', loadChildren: () => import('./docs/docs.component').then(m => m.DocsModule)}, // Lazy loading need more work first
  { path: 'footer', component: FooterComponent },
  { path: 'header', component: HeaderComponent },
  { path: '', component: HomeComponent },
  { path: 'room/:Nick', component: RoomComponent },
  { path: 'roomapply', component: NewRoomComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'archivecard/:ArLink', component: ArchiveDetailComponent},
  { path: 'archive', component: ArchiveComponent },
  { path: 'schededit/:mode', component: ScheduleEditComponent },
  { path: 'verivy/:token', component: VerivyComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'restart-pass', component: RestartpassComponent },
  { path: 'account', component: AccountpageComponent },
  { path: 'archiveedit', component: ArchiveEditComponent },
  { path: 'requestboard', component: RequestboardComponent },
  { path: 'proxyapp', component: WebappComponent, data:{PlainPage:true}},
  //{ path: 'TLClient', component: TranslatorClientComponent, data:{PlainPage:true}},
  //{ path: 'ScriptEditor', component: ScriptEditorComponent, data:{PlainPage:true}},
  { path: 'test', component: TestingGroundComponent },

  //{ path: 'streamtool/app/:token', component: ProxyappComponent, data:{PlainPage:true}},
  //{ path: 'streamtool/setup', component: ProxyappsetComponent, data:{PlainPage:true}}
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
