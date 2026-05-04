// 역할: 부스맵 좌표를 캠퍼스 존 단위로 분류하는 계산 유틸을 제공한다.

export type MapZoneType = "BOOTH" | "PUB" | "FOOD_TRUCK" | "SMOKING_AREA";

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
    id: "booth-zone",
    type: "BOOTH",
    label: "부스 구역",
    markers: [
      { id: "booth-zone-marker-1", lat: 37.32076430236001, lng: 127.12783124592683 },
    ],
    polygons: [
      [
        { lat: 37.32056199927189, lng: 127.1274332123369 },
        { lat: 37.32112439454845, lng: 127.12812801085909 },
        { lat: 37.32098905956238, lng: 127.12829419174007 },
        { lat: 37.3204424272138, lng: 127.12760506087584 },
      ],
    ],
  },
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
  {
    id: "smoking-zone-1",
    type: "SMOKING_AREA",
    label: "흡연 구역",
    markers: [],
    polygons: [
      [
        { lat: 37.3206972854365, lng: 127.12938805297199 },
        { lat: 37.32087949422414, lng: 127.12961682705277 },
        { lat: 37.32082988188686, lng: 127.12966751108807 },
        { lat: 37.32065668350782, lng: 127.12943875248844 },
      ],
    ],
  },
  {
    id: "smoking-zone-2",
    type: "SMOKING_AREA",
    label: "흡연 구역",
    markers: [],
    polygons: [
      [
        { lat: 37.3194552462379, lng: 127.12811389551466 },
        { lat: 37.31954747670636, lng: 127.12822969113937 },
        { lat: 37.31942792183926, lng: 127.12838461337432 },
        { lat: 37.319331183305906, lng: 127.12827163054055 },
      ],
    ],
  },
];
