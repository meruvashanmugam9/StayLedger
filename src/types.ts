/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Room {
  id: string;
  roomNumber: string;
  type: 'Single' | 'Double' | 'Triple' | 'Four-Sharing' | 'Five-Sharing';
  rentPrice: number;
  utilityType: 'Fixed' | 'Shared' | 'Metered';
  fixedUtilityAmount?: number;
  capacity: number;
  status: 'Available' | 'Full' | 'Maintenance';
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  roomId: string; // assigned room id
  checkInDate: string;
  depositPaid: number;
  status: 'Active' | 'CheckedOut';
  photoUrl?: string;
  emergencyContact?: string;
}

export interface DeletedGuest {
  id: string;
  guest: Guest;
  deletedAt: string; // Date string of deletion
  originalPayments: Payment[];
}

export interface Payment {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  type: 'Rent' | 'Utility';
  amount: number;
  billingPeriod: string; // e.g. "June 2026"
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  description?: string;
}

export interface UtilityBill {
  id: string;
  utilityType: 'Electricity' | 'Water' | 'Gas' | 'Internet' | 'Trash' | 'Other';
  totalAmount: number;
  billingPeriod: string; // e.g. "June 2026"
  splitMethod: 'Equal Guests' | 'Equal Rooms';
  createdDate: string;
}

// Initial Mock Data to avoid empty-state confusion on launch
export const INITIAL_ROOMS: Room[] = [
  { id: 'r1', roomNumber: '101', type: 'Single', rentPrice: 550, utilityType: 'Fixed', fixedUtilityAmount: 50, capacity: 1, status: 'Full' },
  { id: 'r2', roomNumber: '102', type: 'Double', rentPrice: 380, utilityType: 'Shared', capacity: 2, status: 'Available' },
  { id: 'r3', roomNumber: '201', type: 'Double', rentPrice: 400, utilityType: 'Shared', capacity: 2, status: 'Available' },
  { id: 'r4', roomNumber: '202', type: 'Triple', rentPrice: 280, utilityType: 'Fixed', fixedUtilityAmount: 30, capacity: 3, status: 'Available' },
  { id: 'r5', roomNumber: '301', type: 'Single', rentPrice: 600, utilityType: 'Metered', capacity: 1, status: 'Maintenance' },
  { id: 'r6', roomNumber: '702', type: 'Four-Sharing', rentPrice: 7000, utilityType: 'Shared', capacity: 4, status: 'Available' },
  { id: 'r7', roomNumber: '1002', type: 'Five-Sharing', rentPrice: 6500, utilityType: 'Shared', capacity: 5, status: 'Available' },
];

export const INITIAL_GUESTS: Guest[] = [
  { id: 'g1', name: 'Alexander Wright', phone: '+1 (555) 234-5678', email: 'alex.wright@example.com', roomId: 'r1', checkInDate: '2026-01-10', depositPaid: 500, status: 'Active', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'g2', name: 'Sophia Martinez', phone: '+1 (555) 345-6789', email: 'sophia.m@example.com', roomId: 'r2', checkInDate: '2026-02-15', depositPaid: 400, status: 'Active', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'g3', name: 'Liam Chen', phone: '+1 (555) 456-7890', email: 'lchen@example.com', roomId: 'r3', checkInDate: '2026-03-01', depositPaid: 400, status: 'Active', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'g4', name: 'Emma Watson', phone: '+1 (555) 567-8901', email: 'emma@example.com', roomId: 'r3', checkInDate: '2026-04-12', depositPaid: 450, status: 'Active', photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { id: 'g5', name: 'Shanmugam', phone: '+91 9443210123', email: 'shanmugam@example.com', roomId: 'r6', checkInDate: '2026-05-15', depositPaid: 10000, status: 'Active', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: 'g6', name: 'Balaji', phone: '+91 9845671230', email: 'balaji@example.com', roomId: 'r7', checkInDate: '2026-05-20', depositPaid: 10000, status: 'Active', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', guestId: 'g1', guestName: 'Alexander Wright', roomNumber: '101', type: 'Rent', amount: 550, billingPeriod: 'June 2026', dueDate: '2026-06-05', status: 'Unpaid', description: 'Monthly room rent' },
  { id: 'p2', guestId: 'g1', guestName: 'Alexander Wright', roomNumber: '101', type: 'Utility', amount: 50, billingPeriod: 'June 2026', dueDate: '2026-06-05', status: 'Unpaid', description: 'Fixed Utility (Power & Water)' },
  { id: 'p3', guestId: 'g2', guestName: 'Sophia Martinez', roomNumber: '102', type: 'Rent', amount: 380, billingPeriod: 'June 2026', dueDate: '2026-06-05', status: 'Paid', paidDate: '2026-06-01', description: 'Monthly room rent' },
  { id: 'p4', guestId: 'g3', guestName: 'Liam Chen', roomNumber: '201', type: 'Rent', amount: 400, billingPeriod: 'June 2026', dueDate: '2026-06-05', status: 'Paid', paidDate: '2026-06-02', description: 'Monthly room rent' },
  { id: 'p5', guestId: 'g4', guestName: 'Emma Watson', roomNumber: '201', type: 'Rent', amount: 400, billingPeriod: 'June 2026', dueDate: '2026-06-05', status: 'Unpaid', description: 'Monthly room rent' },
  { id: 'p10', guestId: 'g5', guestName: 'Shanmugam', roomNumber: '702', type: 'Rent', amount: 7000, billingPeriod: 'June 2026', dueDate: '2026-06-03', status: 'Unpaid', description: 'Monthly room rent' },
  { id: 'p11', guestId: 'g6', guestName: 'Balaji', roomNumber: '1002', type: 'Rent', amount: 6500, billingPeriod: 'June 2026', dueDate: '2026-06-03', status: 'Unpaid', description: 'Monthly room rent' },
  // Historical
  { id: 'p6', guestId: 'g1', guestName: 'Alexander Wright', roomNumber: '101', type: 'Rent', amount: 550, billingPeriod: 'May 2026', dueDate: '2026-05-05', paidDate: '2026-05-04', status: 'Paid', description: 'Monthly room rent' },
  { id: 'p7', guestId: 'g1', guestName: 'Alexander Wright', roomNumber: '101', type: 'Utility', amount: 50, billingPeriod: 'May 2026', dueDate: '2026-05-05', paidDate: '2026-05-04', status: 'Paid', description: 'Fixed Utility (Power & Water)' },
  { id: 'p8', guestId: 'g2', guestName: 'Sophia Martinez', roomNumber: '102', type: 'Rent', amount: 380, billingPeriod: 'May 2026', dueDate: '2026-05-05', paidDate: '2026-05-02', status: 'Paid', description: 'Monthly rent' },
  { id: 'p9', guestId: 'g3', guestName: 'Liam Chen', roomNumber: '201', type: 'Rent', amount: 400, billingPeriod: 'May 2026', dueDate: '2026-05-05', paidDate: '2026-05-05', status: 'Paid', description: 'Monthly rent' },
];

export interface BusinessConfig {
  businessName: string;
  landlordName: string;
  phone: string;
  upiId: string;
  gstin?: string;
  address?: string;
  termsAndConditions?: string;
  currencySymbol: string;
}

export const INITIAL_BUSINESS_CONFIG: BusinessConfig = {
  businessName: 'EasyStay PG Accommodation',
  landlordName: 'Shanmugam PG Admin',
  phone: '+91 9443210123',
  upiId: 'payingguest@upi',
  gstin: '36AAAAA1111A1Z1',
  address: 'Hitech Lane, 3rd Block, Madhapur, Hyderabad, Telangana - 500081',
  termsAndConditions: '1. Rents must be paid by the 5th of every month.\n2. Security deposit is refundable upon checkout after adjusting damages.\n3. Tenants must notify 30 days before checkout.',
  currencySymbol: '₹',
};
