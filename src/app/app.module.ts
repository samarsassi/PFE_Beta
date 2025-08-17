import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from './Services/keycloak/keycloak.service';
import { AddoffreComponent } from './Components/addoffre/addoffre.component';
import { HttpTokenInterceptor } from './Services/interceptor/http-token.interceptor';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgStyle, PathLocationStrategy, Location } from '@angular/common';
import { OffreemploiComponent } from './Components/offreemploi/offreemploi.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { MenuOffresComponent } from './Components/offreemploi/menuoffres/menuoffres.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ViewOffreDialogComponent } from './Components/view-offre-dialog/view-offre-dialog.component';
import { NotfoundComponent } from './Components/notfound/notfound.component';
import { HomepageComponent } from './Components/homepage/homepage.component';
import { NbCardModule, NbThemeModule, NbLayoutModule, NbStepperModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { MainpageComponent } from './Components/user/mainpage/mainpage.component';
import { SnackBarAnnotatedComponent, ViewOffreComponent } from './Components/user/view-offre/view-offre.component';
import { MaincontentComponent } from './Components/user/maincontent/maincontent.component';
import { ScrollTopComponent } from './Components/scroll-top/scroll-top.component';
import { UnauthorizedComponent } from './Components/user/unauthorized/unauthorized.component';
import { ChipModule } from 'primeng/chip';
import { StepsModule } from 'primeng/steps';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { AsyncPipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { CandidaturesComponent, SnackBarComponent } from './Components/candidatures/candidatures.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';  // Optional, for pagination
import { MatSortModule } from '@angular/material/sort';  // Optional, for sorting
import { MatIconModule } from '@angular/material/icon';
import { OnViewDialogComponent } from './Components/candidatures/dialogs/on-view-dialog/on-view-dialog.component';
import { OnDeleteDialogComponent } from './Components/candidatures/dialogs/on-Delete-dialog/on-delete-dialog.component';
//import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { MatCardModule } from '@angular/material/card';
import { EditOffreDialogComponent } from './Components/offreemploi/edit-offre-dialog/edit-offre-dialog.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CodeExecutorComponent } from './Components/code-executor/code-executor.component';
import { KeycloakBypassInterceptor } from './Services/interceptor/keycloak-bypass.interceptor';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MesCandidaturesComponent } from './Components/user/mes-candidatures/mes-candidatures.component';
import { CvAnalyzerComponent } from './Components/cv-analyzer/cv-analyzer.component';
import { InterviewComponent } from './Components/interview/interview.component';
import { InterviewUserComponent } from './Components/user/interview-user/interview-user.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CreateEntretienDialogComponent } from './Components/candidatures/dialogs/create-entretien-dialog/create-entretien-dialog.component';
import { DetailComponent } from './Components/interview/dialog/detail/detail.component';
import { BpmnEditorComponent } from './Components/bpmn-editor/bpmn-editor.component';
import { AdminSnackBarComponent, ChallengesDashboardComponent } from './Components/challenges-dashboard/challenges-dashboard.component';


export function kcFactory(kcService: KeycloakService) {
  return () => kcService.init();

}

@NgModule({
  declarations: [
    AppComponent,
    AddoffreComponent,
    OffreemploiComponent,
    DashboardComponent,
    MenuOffresComponent,
    ViewOffreDialogComponent,
    NotfoundComponent,
    HomepageComponent,
    MainpageComponent,
    ViewOffreComponent,
    MaincontentComponent,
    ScrollTopComponent,
    UnauthorizedComponent,
    CandidaturesComponent,
    OnViewDialogComponent,
    OnDeleteDialogComponent,
    SnackBarAnnotatedComponent,
    EditOffreDialogComponent,
    CodeExecutorComponent,
    ChallengesDashboardComponent,
    MesCandidaturesComponent,
    AdminSnackBarComponent,
    SnackBarComponent,
    CvAnalyzerComponent,
    InterviewComponent,
    InterviewUserComponent,
    CreateEntretienDialogComponent,
    DetailComponent,
    BpmnEditorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgStyle,
    CommonModule,
    FontAwesomeModule,
    MatStepperModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    BrowserAnimationsModule,
    NbCardModule,
    NbThemeModule.forRoot({ name: 'dark' }),
    NbLayoutModule,
    NbEvaIconsModule,
    ChipModule,
    StepsModule,
    MultiSelectModule,
    DropdownModule,
    MatSelectModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCheckboxModule,
    MatStepperModule,
    AsyncPipe,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    //PowerBIEmbedModule,
    MatCardModule,
    NgxChartsModule,
    NgxDatatableModule,
    FullCalendarModule
  ],
  providers: [
    HttpClient,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpTokenInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      deps: [KeycloakService],
      useFactory: kcFactory,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBypassInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
