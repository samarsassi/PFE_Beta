import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddoffreComponent } from './Components/addoffre/addoffre.component';
import { authGuard } from './Services/guard/auth.guard';
import { OffreemploiComponent } from './Components/offreemploi/offreemploi.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { MenuOffresComponent } from './Components/offreemploi/menuoffres/menuoffres.component';
import { NotfoundComponent } from './Components/notfound/notfound.component';
import { HomepageComponent } from './Components/homepage/homepage.component';
import { MainpageComponent } from './Components/user/mainpage/mainpage.component';
import { ViewOffreComponent } from './Components/user/view-offre/view-offre.component';
import { MaincontentComponent } from './Components/user/maincontent/maincontent.component';
import { UnauthorizedComponent } from './Components/user/unauthorized/unauthorized.component';
import { CandidaturesComponent } from './Components/candidatures/candidatures.component';
import { CodeExecutorComponent } from './Components/code-executor/code-executor.component';
import { AdminDashboardComponent } from './Components/admin-dashboard/admin-dashboard.component';
import { MesCandidaturesComponent } from './Components/user/mes-candidatures/mes-candidatures.component';

const routes: Routes = [

  { path: '404', component: NotfoundComponent },
  {
    path: 'main', component: MainpageComponent,
    children: [
      { path: '', component: MaincontentComponent },
      { path: 'TechnicalTest', component: CodeExecutorComponent },
      { path: 'offre/:id', component: ViewOffreComponent },
      { path: 'mes-candidatures', component: MesCandidaturesComponent }
    ]
  },
  {
    path: '', component: DashboardComponent,
    canActivate: [authGuard], data: { roles: ['admin'] },

    children: [
      { path: 'home', component: HomepageComponent },
      { path: 'offreEmploi', component: MenuOffresComponent },
      { path: 'addoffre', component: AddoffreComponent },
      { path: 'offreEmploi/offres', component: OffreemploiComponent },
      { path: 'candidatures', component: CandidaturesComponent },
      { path: 'challenge', component: AdminDashboardComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,
    { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
