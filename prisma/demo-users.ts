/**
 * Demo / UAT accounts — @propa3.com
 * Passwords match mailboxes to create on Namecheap (except shared SMTP info@).
 * Do not commit production .env with SMTP secrets.
 */
import { UserRole } from '@prisma/client';

export type DemoUserDef = {
  email: string;
  /** Previous seed email — used to migrate existing DB rows */
  legacyEmail?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  primarySiteCode?: 'JKW' | 'GZ2';
};

export const DEMO_USERS: DemoUserDef[] = [
  {
    email: 'ceo@propa3.com',
    legacyEmail: 'ceo@triplea.ng',
    password: 'RwrsW9r8xz&noJv3tept',
    firstName: 'Abraham',
    lastName: 'Akinola',
    role: UserRole.CEO,
    phone: '+2348000000001',
  },
  {
    email: 'pm.jkw@propa3.com',
    legacyEmail: 'pm.jkw@triplea.ng',
    password: 'Bar4QMujSv$gu8fdb32J',
    firstName: 'Project',
    lastName: 'Manager',
    role: UserRole.PROJECT_MANAGER,
    phone: '+2348000000002',
    primarySiteCode: 'JKW',
  },
  {
    email: 'foreman.gz2@propa3.com',
    legacyEmail: 'foreman.gz2@triplea.ng',
    password: 'pjBgSiH&$LVyd*@^gwNF',
    firstName: 'Site',
    lastName: 'Foreman',
    role: UserRole.FOREMAN,
    phone: '+2348000000003',
    primarySiteCode: 'GZ2',
  },
  {
    email: 'foreman.jkw@propa3.com',
    legacyEmail: 'foreman.jkw@triplea.ng',
    password: 'D$RVW&@k^z*#zuhFN#3j',
    firstName: 'Jikwoyi',
    lastName: 'Foreman',
    role: UserRole.FOREMAN,
    phone: '+2348000000004',
    primarySiteCode: 'JKW',
  },
  {
    email: 'store.jkw@propa3.com',
    legacyEmail: 'store.jkw@triplea.ng',
    password: '7LhYmpTBgq3X*p3a#$5D',
    firstName: 'Store',
    lastName: 'Manager',
    role: UserRole.STORE_MANAGER,
    phone: '+2348000000005',
    primarySiteCode: 'JKW',
  },
  {
    email: 'engineer@propa3.com',
    legacyEmail: 'engineer@triplea.ng',
    password: 'Fq4CBjsU5Dgrhmb436ix',
    firstName: 'Site',
    lastName: 'Engineer',
    role: UserRole.ENGINEER,
    phone: '+2348000000007',
  },
  {
    email: 'finance@propa3.com',
    legacyEmail: 'finance@triplea.ng',
    password: 'QNp5miQQr@oaQwWD$UPB',
    firstName: 'Finance',
    lastName: 'Officer',
    role: UserRole.FINANCE,
    phone: '+2348000000006',
  },
  {
    email: 'sales@propa3.com',
    legacyEmail: 'sales@triplea.ng',
    password: '!dAscG#7$NhGnhdC7rH#',
    firstName: 'Sales',
    lastName: 'Officer',
    role: UserRole.SALES,
    phone: '+2348000000008',
  },
  {
    email: 'client@propa3.com',
    legacyEmail: 'client@triplea.ng',
    password: 'MMBRg6fJHC^SStcPv$MP',
    firstName: 'James',
    lastName: 'Okoro',
    role: UserRole.CLIENT,
    phone: '+2348099999999',
  },
];
