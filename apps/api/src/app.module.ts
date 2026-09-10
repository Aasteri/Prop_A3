import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { SitesModule } from './sites/sites.module';
import { ProjectsModule } from './projects/projects.module';
import { SiteTrackerModule } from './site-tracker/site-tracker.module';
import { ChangeLogModule } from './change-log/change-log.module';
import { MaterialRequestsModule } from './material-requests/material-requests.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TenantApplicationsModule } from './tenant-applications/tenant-applications.module';
import { EstateTerrierModule } from './estate-terrier/estate-terrier.module';
import { ListingsModule } from './listings/listings.module';
import { CrmModule } from './crm/crm.module';
import { PublicModule } from './public/public.module';
import { ClientPortalModule } from './client-portal/client-portal.module';
import { DeployHookModule } from './deploy-hook/deploy-hook.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HseModule } from './hse/hse.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MailModule } from './mail/mail.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { PropertiesModule } from './properties/properties.module';
import { TenanciesModule } from './tenancies/tenancies.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ServiceChargesModule } from './service-charges/service-charges.module';
import { RemittancesModule } from './remittances/remittances.module';
import { SalesInspectionsModule } from './sales-inspections/sales-inspections.module';
import { ArtisansModule } from './artisans/artisans.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { InventoriesModule } from './inventories/inventories.module';
import { WorksModule } from './works/works.module';
import { InspectionsModule } from './inspections/inspections.module';
import { OffersModule } from './offers/offers.module';
import { SalesOffersModule } from './sales-offers/sales-offers.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    SitesModule,
    ProjectsModule,
    SiteTrackerModule,
    ChangeLogModule,
    MaterialRequestsModule,
    InvoicesModule,
    MilestonesModule,
    TenantApplicationsModule,
    EstateTerrierModule,
    ListingsModule,
    CrmModule,
    PublicModule,
    ClientPortalModule,
    DeployHookModule,
    NotificationsModule,
    HseModule,
    DashboardModule,
    DocumentsModule,
    AuditModule,
    AdminModule,
    PropertiesModule,
    TenanciesModule,
    MaintenanceModule,
    ProcurementModule,
    ServiceChargesModule,
    RemittancesModule,
    SalesInspectionsModule,
    ArtisansModule,
    ServiceRequestsModule,
    InventoriesModule,
    WorksModule,
    InspectionsModule,
    OffersModule,
    SalesOffersModule,
    MailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
