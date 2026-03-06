export interface ResTable {
  id: number;
  businessId: number;
  locationId: number;
  name: string;
  description: string | null;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  capacity: number;
  createdBy: number;
  bookings?: { id: number }[];
}

export interface Booking {
  id: number;
  businessId: number;
  locationId: number;
  contactId: number;
  tableId: number | null;
  waiterId: number | null;
  bookingStart: string;
  bookingEnd: string;
  bookingStatus: 'booked' | 'completed' | 'cancelled' | 'waiting';
  bookingNote: string | null;
  guestCount: number;
  createdBy: number;
  contact?: { id: number; name: string; mobile: string };
  table?: { id: number; name: string; capacity: number } | null;
}

export interface RestaurantDashboard {
  totalTables: number;
  byStatus: Record<string, number>;
  todayBookings: number;
  activeBookings: number;
}

export interface CreateResTableDto {
  name: string;
  locationId: number;
  description?: string;
  capacity?: number;
}

export interface UpdateResTableDto {
  name?: string;
  locationId?: number;
  description?: string;
  capacity?: number;
  status?: string;
}

export interface CreateBookingDto {
  contactId: number;
  locationId: number;
  tableId?: number;
  waiterId?: number;
  bookingStart: string;
  bookingEnd: string;
  bookingNote?: string;
  guestCount?: number;
}

export interface UpdateBookingDto {
  tableId?: number;
  waiterId?: number;
  bookingStart?: string;
  bookingEnd?: string;
  bookingStatus?: string;
  bookingNote?: string;
  guestCount?: number;
}
