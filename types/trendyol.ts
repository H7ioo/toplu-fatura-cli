export type TrendyolOrder = {
  id: number; // Paket no
  shipmentAddress: ShipmentAddressOrInvoiceAddress;
  cargoTrackingNumber: string;
  deliveryNumber: string; // Paket no
  cargoTrackingLink: string;
  cargoProviderId: number;
  cargoProviderName: string;
  cargoProviderCode: string;
  originShipmentDate: number;
  texTargetXDockName: string;
  orderDetail: OrderDetail;
  deci?: null;
  cargoDeci: number;
  cargoActualDeci?: null;
  boxQuantity?: null;
  whoPays: number;
  shippedDate: number;
  collectionPointId?: null;
  hasMessage?: null;
  fastDelivery?: null;
  cargoInvoice: CargoInvoice;
  adelInfo: AdelInfo;
  paperPrinted: boolean;
  stickerPrinted: boolean;
  commercial: boolean; // Kurumsal fatura
  invoiceStatus: string;
  fastDeliveryType: string;
  adelApproveDate: number;
  totalProductDeci: number;
  agreedDeliveryDateExtendible: boolean;
  agreedDeliveryExtensionEndDate: number;
  extendedAgreedDeliveryDate: number;
  deliveredByService: boolean;
  groupId: string;
  dispatchType: string;
  bulkSales: boolean;
  invoiceLink: string;
  exportType: "None" | "Mikro"; // Mikro ihracat
  microTrackingLink: string;
  glocal: boolean; // Mikro ihracat
  giftBoxRequested: boolean;
  shipmentNumber: number;
  etgbNo: string;
  storeFrontId: number;
};
type ShipmentAddressOrInvoiceAddress = {
  firstName: string;
  lastName: string;
  fullName: string; // isim soyisim
  company: string; // Şirket adı (kurumsal fatura için)
  address1: string;
  address2: string;
  fullAddress: string; // Full adres
  city: string;
  cityId: number;
  cityCode: number;
  district: string;
  districtId: number;
  postalCode: string;
  countryCode: string;
  neighborhoodId: number;
  neighborhood: string;
  email: string;
  latitude: string;
  longitude: string;
  identityNumber: string;
  countyId: number;
  taxNumber: string; // VKN
  taxOffice: string; // Vergi Dairesi
  isEInvoiceAvailable: boolean; // E-Arsiv - E-Fatura
};
type OrderDetail = {
  id: number;
  orderNumber: string; // Sipariş no
  orderDate: number; // Sipariş tarihi
  orderAgreedDeliveryDate: number;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  taxNumber: string;
  customerGuid: string;
  currency: Currency;
  orderStatus: StatusOrOrderStatus;
  invoiceAddress: ShipmentAddressOrInvoiceAddress;
  lines?: LinesEntity[] | null;
  totalDiscount: number; // Toplam satıcı indirimi
  grossAmount: number; // Satış tutarı
  totalPrice: number; // Faturlanacak tutar
  invoice: Invoice;
  totalTyDiscount: number; // Toplam trendyol indirimi
};
type Currency = {
  id: number;
  name: string;
  code: string;
};
type StatusOrOrderStatus = {
  name: string;
};
type LinesEntity = {
  id: number;
  productContentId: number;
  productName: string;
  productCode: number;
  listingId: string;
  productColor: string;
  productSize: string;
  productCategory: string;
  productCategoryId: number;
  barcode: string;
  brandName: string;
  merchantId: number;
  sku: string;
  merchantSku: string;
  price: number; // Ürün fiyatı KDV dahil
  discountAmount?: number; // Satıcı indirimi
  vatBaseAmount: number; // KDV
  salesCampaignId: number;
  shipmentAddress: ShipmentAddressOrInvoiceAddress;
  packageItems?: PackageItemsEntity[] | null; // .length gives the pieces amount
  productImage: string;
};
type PackageItemsEntity = {
  id: number;
  orderLineItemId: number;
  status: StatusOrOrderStatus;
  orderLineItemStatusName: string;
  cancellationReason: object;
  discountAmount?: null;
  tyDiscountAmount?: null;
};

type Invoice = {
  invoiceType: string;
  invoiceLink: string;
  email: string;
  fileName: string;
};
type CargoInvoice = {
  amount: number;
  status: string;
};
type AdelInfo = {
  status: string;
  history?: null[] | null;
};

export type invoicePostError = {
  timestamp: number;
  exception: string | "CustomerInvoiceApiBusinessException";
  errors: {
    key: string;
    message: string;
    errorCode: string;
    args: string[];
  }[];
};
