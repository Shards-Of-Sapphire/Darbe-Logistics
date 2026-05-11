export type UserRole = 'Admin' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AcknowledgmentEntry {
  id: string;
  date: string;
  consignorName?: string;
  consignorAddress?: string;
  consignorPhone?: string;
  consignorGSTIN?: string;
  consigneeName: string;
  address: string;
  destination?: string;
  phone: string;
  description: string;
  quantity: number;
  packing: string;
  unitWeight: number;
  actualWeight: number;
  chargedWeight: number;
  unitPrice: number;
  dimensions: string;
  modeOfTransport?: 'Road' | 'Train' | 'Air';
  shipmentType?: string;
  amount?: number;
  signature: string;
  createdBy?: string;
}

export interface ConsignorNoteItem {
  id: string;
  itemName: string;
  quantity: number;
  unitWeight: number;
  weight: number;
  unitPrice: number;
  description: string;
}

export interface ConsignorNoteEntry {
  id: string;
  date: string;
  challanNo: string;
  invoiceNo: string;
  origin: string;
  destination: string;
  modeOfTransport: 'Road' | 'Train' | 'Air';
  consignorName: string;
  consignorAddress: string;
  consignorMobile: string;
  consignorGSTIN: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeMobile: string;
  consigneeGSTIN: string;
  natureOfConsignment: 'Commercial' | 'Non-Commercial';
  items: ConsignorNoteItem[];
  actualWeight: number;
  chargedWeight: number;
  freightCharges: number;
  fodCharges: number;
  riskCharges: number;
  otherCharges: number;
  hamaliCharges: number;
  docketCharges: number;
  codCharges: number;
  fusiSurcharges: number;
  taxSGST: number;
  taxCGST: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'Credit' | 'Paid' | 'To-Pay';
  signature: string;
  remarks: string;
  shipmentType: 'Domestic' | 'International';
  createdBy?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitWeight: number;
  price: number; // This is unitPrice
  total: number;
}

export interface InvoiceEntry {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdBy?: string;
}
