import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { ProxyappComponent } from './proxyapp/proxyapp.component';
import { ProxyappsetComponent } from './proxyappset/proxyappset.component';
import { TranslatorClientComponent } from './translator-client/translator-client.component';
import { ScriptEditorComponent } from './script-editor/script-editor.component';
import { ChatboardComponent } from './chatboard/chatboard.component';
import { ArchiveEditComponent } from './archive-edit/archive-edit.component';

const routes: Routes = [
  { path: 'footer', component: FooterComponent },
  { path: 'header', component: HeaderComponent },
  { path: '', component: HomeComponent },

  { path: 'TLClient', component: TranslatorClientComponent, data:{PlainPage:true}},
  { path: 'ScriptEditor', component: ScriptEditorComponent, data:{PlainPage:true}},
  { path: 'ArchiveManager', component: ArchiveEditComponent, data:{PlainPage:true}},
  { path: 'chatboard', component: ChatboardComponent, data:{PlainPage:true}},

  { path: 'streamtool/app/:token', component: ProxyappComponent, data:{PlainPage:true}},
  { path: 'streamtool/setup', component: ProxyappsetComponent, data:{PlainPage:true}}
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
