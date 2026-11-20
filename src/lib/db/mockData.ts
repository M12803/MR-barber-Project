import { DatabaseSchema } from '../../types';

export const INITIAL_DATABASE: DatabaseSchema = {
  version: 2,
  settings: {
    shopName: 'صالون محمد رمضان',
    shopSubtitle: 'MR BARBERS - CUT • STYLE • CONFIDENCE',
    phone: '01000000000',
    currency: 'جنيه',
  },
  users: [
    {
      id: 'usr_admin',
      username: 'Admin',
      displayName: 'محمد رمضان (المالك)',
      role: 'ADMIN',
      pinCode: 'Mr3770',
      isActive: true,
    },
    {
      id: 'usr_ahmed',
      username: 'ahmed',
      displayName: 'أحمد محمد',
      role: 'EMPLOYEE',
      employeeId: 'emp_ahmed',
      pinCode: '1111',
      isActive: true,
    },
    {
      id: 'usr_mahmoud',
      username: 'mahmoud',
      displayName: 'محمود',
      role: 'EMPLOYEE',
      employeeId: 'emp_mahmoud',
      pinCode: '2222',
      isActive: true,
    },
    {
      id: 'usr_mohamed',
      username: 'mohamed',
      displayName: 'محمد',
      role: 'EMPLOYEE',
      employeeId: 'emp_mohamed',
      pinCode: '3333',
      isActive: true,
    },
    {
      id: 'usr_ali',
      username: 'ali',
      displayName: 'علي',
      role: 'EMPLOYEE',
      employeeId: 'emp_ali',
      pinCode: '4444',
      isActive: true,
    },
  ],
  employees: [
    {
      id: 'emp_ahmed',
      name: 'أحمد محمد',
      phone: '01123456789',
      pinCode: '1111',
      isActive: true,
      joinDate: '2026-01-01',
    },
    {
      id: 'emp_mahmoud',
      name: 'محمود',
      phone: '01234567890',
      pinCode: '2222',
      isActive: true,
      joinDate: '2026-01-05',
    },
    {
      id: 'emp_mohamed',
      name: 'محمد',
      phone: '01098765432',
      pinCode: '3333',
      isActive: true,
      joinDate: '2026-01-10',
    },
    {
      id: 'emp_ali',
      name: 'علي',
      phone: '01511223344',
      pinCode: '4444',
      isActive: true,
      joinDate: '2026-01-15',
    },
  ],
  services: [
    { id: 'srv_1', name: 'شعر بس', defaultPrice: 80 },
    { id: 'srv_2', name: 'دقن بس', defaultPrice: 50 },
    { id: 'srv_3', name: 'شعر ودقن', defaultPrice: 120 },
    { id: 'srv_4', name: 'حمام كريم', defaultPrice: 70 },
    { id: 'srv_5', name: 'استشوار', defaultPrice: 40 },
    { id: 'srv_6', name: 'قصة أطفال', defaultPrice: 60 },
    { id: 'srv_7', name: 'تنظيف بشرة وماسك', defaultPrice: 150 },
  ],
  operations: [
    // ... existing operations ...
  ],
  advances: [
    // ... existing advances ...
  ],
  shiftLogs: [],
};