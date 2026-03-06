export interface HmsRoomType {
  id: number;
  type: string;
  noOfAdult: number;
  noOfChild: number;
  maxOccupancy: number;
  amenities?: string;
  description?: string;
  businessId: number;
  createdBy: number;
  _count?: { rooms: number };
}

export interface HmsRoom {
  id: number;
  hmsRoomTypeId: number;
  roomNumber: string;
  roomType?: HmsRoomType;
}

export interface HmsExtra {
  id: number;
  name: string;
  price: number;
  pricePer: string;
  businessId: number;
  isActive: boolean;
}

export interface HmsBookingLine {
  id: number;
  transactionId: number;
  hmsRoomId: number;
  hmsRoomTypeId: number;
  adults: number;
  childrens: number;
  price: number;
  totalPrice: number;
  room?: HmsRoom;
  roomType?: HmsRoomType;
}

export interface HmsDashboard {
  totalRoomTypes: number;
  totalRooms: number;
  activeExtras: number;
}

export interface CreateRoomTypeDto { type: string; noOfAdult: number; noOfChild: number; maxOccupancy: number; amenities?: string; description?: string; }
export interface CreateRoomDto { hmsRoomTypeId: number; roomNumber: string; }
export interface CreateExtraDto { name: string; price: number; pricePer: string; isActive?: boolean; }
export interface CreateBookingLineDto { transactionId: number; hmsRoomId: number; hmsRoomTypeId: number; adults: number; childrens: number; price: number; totalPrice: number; }
