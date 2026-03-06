export interface RepairStatus {
  id: number;
  businessId: number;
  name: string;
  color: string | null;
  sortOrder: number | null;
}

export interface RepairDeviceModel {
  id: number;
  businessId: number;
  name: string;
  repairChecklist: string | null;
  brandId: number | null;
  deviceId: number | null;
  createdBy: number;
}

export interface RepairJobSheet {
  id: number;
  businessId: number;
  locationId: number | null;
  contactId: number;
  jobSheetNo: string;
  serviceType: string;
  pickUpOnSiteAddr: string | null;
  brandId: number | null;
  deviceId: number | null;
  deviceModelId: number | null;
  serialNo: string;
  statusId: number;
  deliveryDate: string | null;
  defects: string | null;
  productCondition: string | null;
  serviceStaff: number | null;
  commentBySs: string | null;
  estimatedCost: number | null;
  parts: string | null;
  createdBy: number;
  contact?: { id: number; name: string; mobile: string };
  status?: RepairStatus;
  deviceModel?: RepairDeviceModel | null;
}

export interface RepairDashboard {
  totalJobSheets: number;
  statusBreakdown: Array<{ id: number; name: string; color: string | null; count: number }>;
}

export interface CreateRepairStatusDto {
  name: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateDeviceModelDto {
  name: string;
  repairChecklist?: string;
  brandId?: number;
  deviceId?: number;
}

export interface CreateJobSheetDto {
  contactId: number;
  locationId?: number;
  jobSheetNo: string;
  serviceType?: string;
  serialNo: string;
  statusId: number;
  deviceModelId?: number;
  brandId?: number;
  estimatedCost?: number;
  defects?: string;
  productCondition?: string;
}

export interface UpdateJobSheetDto {
  statusId?: number;
  commentBySs?: string;
  estimatedCost?: number;
  deliveryDate?: string;
  serviceStaff?: number;
  parts?: string;
}
