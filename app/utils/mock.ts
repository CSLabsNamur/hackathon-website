const dayjs = useDayjs();

export const mockCurrentDateTime = dayjs("2026-03-27T16:31:00Z");

//region ==== Assets & Resources ====
//export type Asset = {
//  id: string;
//  name: string;
//  owner: string;
//  totalQuantity: number;
//  locations: AssetRoom[];
//}
//
//export type AssetRoom = {
//  id: string;
//  asset: string;
//  room: string;
//  quantity: number;
//}
//
//export const assets = ref<Asset[]>([
//  {
//    id: "asset-001",
//    name: "Multiprise 6 prises",
//    owner: "CSLabs",
//    totalQuantity: 2,
//    locations: [],
//  },
//  {
//    id: "asset-002",
//    name: "Câble HDMI",
//    owner: "CSLabs",
//    totalQuantity: 3,
//    locations: [],
//  },
//  {
//    id: "asset-003",
//    name: "Bobines de rallonges électriques 10m",
//    owner: "Secrétariat",
//    totalQuantity: 4,
//    locations: [],
//  },
//]);
//
//export const assetRooms = ref<AssetRoom[]>([
//  {
//    id: "assetroom-001",
//    asset: "asset-001",
//    room: "info-i31",
//    quantity: 1,
//  },
//  {
//    id: "assetroom-002",
//    asset: "asset-002",
//    room: "info-i32",
//    quantity: 2,
//  },
//  {
//    id: "assetroom-003",
//    asset: "asset-003",
//    room: "info-open-space-3",
//    quantity: 1,
//  },
//  {
//    id: "assetroom-004",
//    asset: "asset-001",
//    room: "info-i33",
//    quantity: 1,
//  },
//]);
//endregion
