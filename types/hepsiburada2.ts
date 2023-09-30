export interface HepsiburadaOrderDetaild {
  Tenant: string;
  RefId: string;
  Type: number;
  Code: string;
  TrackingNumber: string;
  Invoice: Invoice;
  CargoCompany: CargoCompany;
  TrackingPhoneNumber: string;
  TrackingUrl: string;
  ReceivedBy: string;
  ReceivedDate: Date;
  ShippedDate: Date;
  EstimatedArrivalDate: Date;
  IsAlternative: boolean;
  IsMutualBarcode: boolean;
  Status: string;
  UndeliveredDate: Date;
  UndeliveredReason: string;
  Number: string;
  RetractedDate: Date;
  RetractedReason: string;
  Id: string;
  InsertedDate: Date;
  Orders: Order[];
  OptionType: string;
  EstimatedShippingDate: Date;
  TotalListingPrice: CustomsTotalPrice;
  TotalUnitHBDiscountPrice: CustomsTotalPrice;
  TotalPriceBeforeLateInterest: CustomsTotalPrice;
  ShippingTotalPrice: CustomsTotalPrice;
  CustomsTotalPrice: CustomsTotalPrice;
  IsCargoChangable: boolean;
  Demands: null;
  IsInvoiceAddButtonViewable: boolean;
  IsFinancialIconVisible: boolean;
  IsChangeCargoCompanyButtonShowable: boolean;
  IsViewOrPrintLabelButtonShowable: boolean;
  IsUnpackButtonShowable: boolean;
  IsResendTagShowable: boolean;
  ActionTags: null;
  HasInvoice: boolean;
  IsDropShippingMerchant: boolean;
}

export interface CargoCompany {
  TypeCode: string;
  Alias: string;
  Name: string;
  LogoUrl: string;
  CarrierId: number;
  CarrierName: string;
  CodePrefix: string;
}

export interface CustomsTotalPrice {
  CurrencyCode: string;
  Value: number;
}

export interface Invoice {
  Number: string;
  Date: Date;
  ZarfUuid: string;
  IsEArchive: boolean;
  IsEIntegration: boolean;
  TicketId: string;
  PublicDocumentURL: string;
  PublicDocumentURLType: string;
}

export interface Line {
  Id: string;
  InitialDelivery: InitialDelivery;
  Cancel: Cancel;
  Sku: string;
  Name: string;
  Index: number;
  Quantity: number;
  LineItemType: string;
  SecureLinkFormat: string;
  VariantProperties: VariantProperty[];
  PriceBeforeLateInterest: CustomsTotalPrice;
  UnitPriceBeforeLateInterest: CustomsTotalPrice;
  ListingPrice: CustomsTotalPrice;
  EstimatedShippingDate: Date;
  EstimatedArrivalDate: Date;
  IsPackable: boolean;
  Order: Order;
  CancellationFormUrl: string;
  UnitHBDiscountPrice: CustomsTotalPrice;
  UnitHBDiscountPriceWithoutCommission: CustomsTotalPrice;
  CustomizedProductValue: string;
  MerchantSku: string;
  Merchant: Merchant;
  Status: string;
  CargoCompany: null;
  Warehouse: Warehouse;
  UnitPurchasePrice: CustomsTotalPrice;
  IsSerialNumberRequired: boolean;
  SerialNumbers: unknown[];
  TagList: unknown[];
  Gtip: string;
  IsCargoChangable: boolean;
  DeptorDifferenceAmount: number;
  SapTransferDiscount: number;
  IsCancelOrderButtonShowable: boolean;
  IsChangeCargoCompanyButtonShowable: boolean;
  IsCreatePackageButtonShowable: boolean;
  IsResendTagShowable: boolean;
  IsChangeTagShowable: boolean;
  IsFulfilledByHbTagShowable: boolean;
  IsDonationTagShowable: boolean;
  IsDropShippingMerchant: boolean;
}

export interface Order {
  OrderNumber: string;
  CreatedDateTime: Date;
  UserFullName: string;
  ShippingAddress: IngAddress;
  BillingAddress: IngAddress;
  Lines?: Line[];
  UserEmail: string;
  IsCustomerCorporateIconShowable: boolean;
  IsCustomerIndividualIconShowable: boolean;
  PaymentStatus?: string;
}

export interface Cancel {
  Origin: string;
  ReasonCode: string;
  RequestDate: Date;
  AgentName: string;
  CancelledBy: string;
  ListingAction: string;
}

export interface InitialDelivery {
  TimeSlot: string;
  SlotName: string;
  OptionId: string;
  OptionName: string;
  OptionDate: Date;
  ShippingTime: string;
  ShippingMethodId: string;
  DeliverySlotType: string;
  PickupTime: string;
  OptionType: string;
  IsAlternative: boolean;
  IsMutualBarcode: boolean;
  IsJetDelivery: boolean;
}

export interface Merchant {
  Id: string;
  Name: string;
  SapId: string;
  LegalName: string;
  EArchive: boolean;
  ShowCustomerPhone: boolean;
  IsInternational: boolean;
  IsRetail: boolean;
  IsTest: boolean;
  Parent: Parent;
}

export interface Parent {
  Id: string;
  Name: string;
}

export interface VariantProperty {
  Name: string;
  Value: string;
}

export interface Warehouse {
  ShippingModel: string;
  ShippingAddressLabel: string;
}

export interface IngAddress {
  AddressRefId: string;
  AddressDetail: string;
  CountryCode: string;
  Country: string;
  City: string;
  District: string;
  County: string;
  GsmNumber: string;
  UserName: string;
  TelNumber: string;
  FaxNumber: string;
  TaxNumber: string;
  TaxOffice: string;
  UserIdentityNumber: string;
  CityCode: number;
  IsPoi: boolean;
  IsCc: boolean;
  MapCoordinates: string;
  WorkingHours: string;
  MaxReceiveDay: string;
  Floor: string;
  AddressTitle: string;
  PostalCode: string;
  TownCode: string;
  DistrictCode: string;
  PartnerCode: string;
  BranchCode: string;
}
