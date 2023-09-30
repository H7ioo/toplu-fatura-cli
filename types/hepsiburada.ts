import { HepsiburadaOrderDetaild } from "./hepsiburada2";

export interface HepsiburadaOrder {
  Total: number;
  Count: number;
  Offset: number;
  Limit: number;
  Data: Data[];
}

export interface Data {
  Id: string;
  Code: string; // Teslimat Numarası
  Status: string;
  ReceivedDate: string;
  EstimatedShippingDate: string;
  EstimatedArrivalDate: string;
  CargoCompany: CargoCompany;
  Orders: Order[];
  TotalPriceBeforeLateInterest: TotalPriceBeforeLateInterest;
  IsJetDelivery: boolean;
  IsChangeCargoCompanyButtonShowable: boolean;
  IsViewOrPrintLabelButtonShowable: boolean;
  IsUnpackButtonShowable: boolean;
  IsResendTagShowable: boolean;
  IsChangeTagShowable: boolean;
  ActionTags: unknown;
  IsFulfilledByHbTagShowable: boolean;
  IsDonationTagShowable: boolean;
  HasInvoice: boolean;
  DeliveryNumber: string;
  TrackingNumber: string;
  InvoiceUrl: string;
  UndeliveredDate: string;
  IsInvoiceAddButtonViewable: boolean;
  OrderCreatedDateTime: string;
  TrackingUrl: string;
  IsDropShippingMerchant: boolean;
  DataDetailed: HepsiburadaOrderDetaild;
}

export interface CargoCompany {
  Id: number;
  Name: string;
  ShortName: string;
  LogoUrl: string;
  TrackingUrl: string;
  CodePrefix: string;
  TrackingType: number;
  IsActive: boolean;
  MutualBarcode: boolean;
  RecallOptionAvailable: boolean;
  CargoChangeOptionAvailable: boolean;
  AvailableForReturnHepsimat: boolean;
  IsSyncCargoCancelAvailable: boolean;
  IsChangeableCargo: boolean;
}

export interface Order {
  OrderNumber: string;
  UserFullName: string;
  Lines: Line[];
  IsCargoChangable: boolean;
  IsCustomerIndividualIconShowable: boolean;
  IsCustomerCorporateIconShowable: boolean;
}

export interface Line {
  Id: string;
  Name: string;
  Sku: string;
  MerchantSKU: string;
  Quantity: number;
  SecureLinkFormat: string;
  IsCustomizedProduct: boolean;
  IsSerialNumberRequired: boolean;
  VariantProperties: VariantProperty[];
  IsJetDelivery: boolean;
  ShippingAddress: ShippingAddress;
  BillingAddress: BillingAddress;
  UserEmail: string;
  IsDropShippingMerchant: boolean;
}

export interface VariantProperty {
  Name: string;
  Value: string;
}

export interface ShippingAddress {
  AddressRefId: string;
  City: string;
  County: string;
  District: string;
  AddressDetail: string;
  TaxNumber: string;
  TaxOffice: string;
  UserIdentityNumber: string;
  PartnerCode: string;
  UserName: string;
  GsmNumber: string;
}

export interface BillingAddress {
  AddressRefId: string;
  City: string;
  County: string;
  District: string;
  AddressDetail: string;
  TaxNumber: string;
  TaxOffice: string;
  UserIdentityNumber: string;
  PartnerCode: string;
  UserName: string;
  GsmNumber: string;
}

export interface TotalPriceBeforeLateInterest {
  CurrencyCode: string;
  Value: number;
}
