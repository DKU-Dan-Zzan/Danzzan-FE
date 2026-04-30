// 역할: 부스맵 좌표를 캠퍼스 존 단위로 분류하는 계산 유틸을 제공한다.

export type MapZoneType = "PUB" | "FOOD_TRUCK";

export type MapZonePoint = {
    lat: number;
    lng: number;
};

export type MapZoneMarker = {
  id: string;
  lat: number;
  lng: number;
};

export type MapZone = {
  id: string;
  type: MapZoneType;
  label: string;
  markers: MapZoneMarker[];
  polygons: MapZonePoint[][];
};

export const MAP_ZONES: MapZone[] = [
  {
    id: "pub-zone",
    type: "PUB",
    label: "주점 구역",
    markers: [
        { id: "pub-zone-marker-1", lat: 37.31985516924807, lng: 127.12906789548107 },
    ],
    polygons: [
        [
            { lat: 37.319799649310525, lng: 127.1283372975947 }, // 왼쪽 위 
            { lat: 37.32046551640117, lng: 127.12916201568542 }, // 오른쪽 위
            { lat: 37.31989486092517, lng: 127.12984923582496 }, // 오른쪽 아래
            { lat: 37.31926053466022, lng: 127.12902457184381 }, // 왼쪽 아래
        ],
    ],
  },
  {
    id: "foodtruck-zone",
    type: "FOOD_TRUCK",
    label: "푸드트럭 구역",
    markers: [
      { id: "foodtruck-zone-marker-1", lat: 37.3202002958986, lng: 127.12862566878056 },
      { id: "foodtruck-zone-marker-2", lat: 37.319465961459464, lng: 127.12861877644275 },
    ],
    polygons: [
      [
        // 오른쪽 위 네모
        { lat: 37.31992814719142, lng: 127.12824444026057 },
        { lat: 37.32054453201031, lng: 127.12900138226138 },
        { lat: 37.32048816219902, lng: 127.12905205492304 },
        { lat: 37.31989429430843, lng: 127.12830361278405 },
      ],
      [
        // 왼쪽 아래 네모
        { lat: 37.31956307349439, lng: 127.12838766372523 },
        { lat: 37.31964629337825, lng: 127.12850344450922 },
        { lat: 37.31934176888273, lng: 127.12889496965757 },
        { lat: 37.31924954827104, lng: 127.12877071219148 },
      ],
    ],
  },
];