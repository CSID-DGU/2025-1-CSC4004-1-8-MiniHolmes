console.log("=== Script Started ===");

//파이썬 코드와 달라진 부분 : 
// 1. 가구 DB 입력, _id 필드가 없을 경우 UUID를 생성하도록 수정
// 2. 가구의 크기와 가격을 확인하는 알고리즘 변경(무한루프 문제 방지)
//     2-1. 무한루프 방지를 위해 가장 작은/저렴한 가구를 대체 선택하는 방식으로 변경됨
//     2-2. 크기와 가격을 파악하는 부분을 하나의 while문으로 엮어 순차적으로 조건 확인하는 것이 아닌 동시만족하도록 수정


// 가구 클래스 정의(데이터 구조 설계)
class FurnitureItem {
    constructor(data) {
      this.oid = data._id?.$oid ?? crypto.randomUUID(); // DB _id가 있으면 사용, 없으면 UUID 생성하도록 코드 수정
      this.name = data.name;
      this.category = data.category;
      this.style = data.style;
      this.dimensions = data.dimensions;
      this.colortone = data.colortone;
      this.price = data.price;
      this.brand = data.brand;
      this.glb_file = data.glb_file;
      this.url = data.url;
    }

  //가로 길이로 가구의 크기 등급을 계산
  sizeGrade() {
    const width = this.dimensions.width;
    const category = this.category.toLowerCase();

    //가구 카테고리에 따라 크기 등급을 다르게 설정, 1등급으로 갈수록 크기가 큼
    //침대는 더블, 슈퍼싱글, 싱글 3등급으로 나눔
    if (category === "bed") {
      if (width >= 1350) return 1; //더블
      if (width >= 1100) return 2; //슈퍼싱글
      return 3;//싱글
    //책장 3단계, 책상 3단계, 옷장 3단계로 나눔
    } else if (category === "bookshelf") {
      if (width >= 80) return 1;
      if (width >= 60) return 2;
      return 3;
    } else if (category === "desk") {
      if (width >= 160) return 1;
      if (width >= 140) return 2;
      return 3;
    } else if (category === "closet") {
      if (width >= 120) return 1;
      if (width >= 90) return 2;
      return 3;
    } else {
      return 3;
    }
  }

   //가격 등급 계산
  priceGrade() {
    const price = this.price / 1000; //천 단위 변환
    const category = this.category.toLowerCase();

    //침대는 70~100 1등급, 50~70 2등급, 35~50 3등급, 25~35 4등급, 15~25 5등급 (만원 단위)
    if (category === "bed") {
      if (price >= 700 && price <= 1000) return 1;
      if (price >= 500) return 2;
      if (price >= 350) return 3;
      if (price >= 250) return 4;
      if (price >= 150) return 5;
      return 6;
    //책장은 20~30 1등급, 12~20 2등급, 8~12 3등급, 5~8 4등급, 3~5 5등급 (만원 단위)
    } else if (category === "bookshelf") {
      if (price >= 20) return 1;
      if (price >= 12) return 2;
      if (price >= 8) return 3;
      if (price >= 5) return 4;
      if (price >= 3) return 5;
      return 6;
    //책상은 40~50 1등급, 30~40 2등급, 20~30 3등급, 10~20 4등급, 6~10 5등급 (만원 단위)
    } else if (category === "desk") {
      if (price >= 40 && price <= 50) return 1;
      if (price >= 30) return 2;
      if (price >= 20) return 3;
      if (price >= 10) return 4;
      if (price >= 6) return 5;
      return 6;
    //옷장은 40~50 1등급, 30~40 2등급, 20~30 3등급, 10~20 4등급, 5~10 5등급 (만원 단위)
    } else if (category === "closet") {
      if (price >= 40) return 1;
      if (price >= 30) return 2;
      if (price >= 20) return 3;
      if (price >= 10) return 4;
      return 5;
    } else {
      return 5;
    }
  }
} //클래스 정의 끝

//가구의 총 폭과 가격을 계산하는 함수
function totalWidth(items) {
  return items.reduce((sum, item) => sum + item.dimensions.width, 0);
}
//가구의 총 가격을 계산하는 함수
function totalPrice(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

//가구 선택 함수
function selectItems(furnitureDb, weights, budget, perimeter) {
    //함수의 입력값은 (가구 DB, 사용자 선호도(가중치), 예산, 가구 배치 면적적)
  const categories = ["bed", "closet", "desk", "bookshelf"];//카테고리별 후보군
  const selectedItems = [];

  for (const category of categories) {
    const candidates = furnitureDb.filter(f => f.category === category);//카테고리별 후보군
    if (candidates.length === 0) continue;

    candidates.sort((a, b) => { //1을 각 4가지 조건에 따라 소수점으로 나누어 나눠진 가중치에 곱셈 통해 정렬
      const scoreA =
        weights.style * (a.style === weights.target_style) +
        weights.colortone * (a.colortone === weights.target_colortone) -
        weights.size * a.sizeGrade() -
        weights.price * a.priceGrade();

      const scoreB =
        weights.style * (b.style === weights.target_style) +
        weights.colortone * (b.colortone === weights.target_colortone) -
        weights.size * b.sizeGrade() -
        weights.price * b.priceGrade();

      return scoreB - scoreA; // 내림차순
    });

    selectedItems.push(candidates[0]);
  }

  //크기 조건 및 가격 조건 검사
let adjustCount = 0;
const MAX_ITER = 100;

while (
  (totalWidth(selectedItems) > perimeter * 0.75 || totalPrice(selectedItems) > budget) &&
  adjustCount < MAX_ITER
) {
  // 크기 초과 시 가장 큰 가구를 더 작은 대안으로 교체
  if (totalWidth(selectedItems) > perimeter * 0.75) {
    let largest = selectedItems.reduce((a, b) => (a.sizeGrade() > b.sizeGrade() ? a : b));
    let category = largest.category;
    let alternatives = furnitureDb
      .filter(f => f.category === category && f !== largest)
      .sort((a, b) => a.sizeGrade() - b.sizeGrade());

    if (alternatives.length > 0) {
      let beforeWidth = totalWidth(selectedItems);
      selectedItems[selectedItems.indexOf(largest)] = alternatives[0];
      let afterWidth = totalWidth(selectedItems);
      if (afterWidth >= beforeWidth) break;
    }
  }

  // 가격 초과 시 가장 비싼 가구를 더 저렴한 대안으로 교체
  if (totalPrice(selectedItems) > budget) {
    let expensive = selectedItems.reduce((a, b) => (a.priceGrade() > b.priceGrade() ? a : b));
    let category = expensive.category;
    let alternatives = furnitureDb
      .filter(f => f.category === category && f !== expensive)
      .sort((a, b) => a.priceGrade() - b.priceGrade());

    if (alternatives.length > 0) {
      let beforePrice = totalPrice(selectedItems);
      selectedItems[selectedItems.indexOf(expensive)] = alternatives[0];
      let afterPrice = totalPrice(selectedItems);
      if (afterPrice >= beforePrice) break;
    }
  }

  adjustCount++;
}
  return selectedItems;
}

//추천 메인 함수
function recommendSets(furnitureDb, userWeights, maxBudget, perimeter) {
  const recommendedSets = [];
  let availableItems = [...furnitureDb];

  for (let i = 0; i < 3; i++) { //3세트 추천
    const selected = selectItems(availableItems, userWeights, maxBudget, perimeter);
    recommendedSets.push(selected);
    selected.forEach(item => {
      availableItems = availableItems.filter(f => f !== item);
    });
  }

  return recommendedSets;
}

// --- DB 데이터 로딩 ---
const rawFurnitureDb = [{
  "_id": {
    "$oid": "6818ec5435879695a35746db"
  },
  "name": "BRIMNES 브림네스 옷장+도어2",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 78,
    "depth": 50,
    "height": 190
  },
  "colortone": "white",
  "price": 199000,
  "brand": "IKEA",
  "glb_file": "BRIMNES 브림네스 옷장+도어2 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/brimnes-wardrobe-with-2-doors-white-20400479/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746dc"
  },
  "name": "VISTHUS 비스투스 옷장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 122,
    "depth": 59,
    "height": 216
  },
  "colortone": "gray/white",
  "price": 429000,
  "brand": "IKEA",
  "glb_file": "VISTHUS 비스투스 옷장 - 그레이화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/visthus-wardrobe-grey-white-30347617/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746dd"
  },
  "name": "GURSKEN 구르스켄 옷장",
  "category": "closet",
  "style": "natural",
  "dimensions": {
    "width": 55,
    "depth": 185.7,
    "height": 49.4
  },
  "colortone": "lightbeige",
  "price": 99900,
  "brand": "IKEA",
  "glb_file": "GURSKEN 구르스켄 옷장 - 라이트베이지.glb",
  "url": "https://www.ikea.com/kr/ko/p/gursken-wardrobe-light-beige-50503292/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746de"
  },
  "name": "VUKU 부쿠 옷장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 74,
    "depth": 51,
    "height": 149
  },
  "colortone": "white",
  "price": 20000,
  "brand": "IKEA",
  "glb_file": "VUKU 부쿠 옷장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/vuku-wardrobe-white-10339331/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746df"
  },
  "name": "IDANÄS 이다네스 옷장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 121,
    "depth": 59,
    "height": 211
  },
  "colortone": "white",
  "price": 599000,
  "brand": "IKEA",
  "glb_file": "IDANÄS 이다네스 옷장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/idanaes-wardrobe-white-40458836/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e0"
  },
  "name": "VIHALS 비할스 옷장+도어2",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 105,
    "depth": 57,
    "height": 200
  },
  "colortone": "white",
  "price": 279000,
  "brand": "IKEA",
  "glb_file": "VIHALS 비할스 옷장+도어2 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/vihals-wardrobe-with-2-doors-white-40483256/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e1"
  },
  "name": "KLEPPSTAD 클렙스타드 오픈형 옷장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 39,
    "depth": 55,
    "height": 176
  },
  "colortone": "white",
  "price": 99900,
  "brand": "IKEA",
  "glb_file": "KLEPPSTAD 클렙스타드 오픈형 옷장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/kleppstad-open-wardrobe-white-50441765/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e2"
  },
  "name": "PAX 팍스 / GRIMO 그리모 코너옷장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 201.2,
    "depth": 110.2,
    "height": 110.2
  },
  "colortone": "white",
  "price": 435000,
  "brand": "IKEA",
  "glb_file": "PAX 팍스  GRIMO 그리모 코너옷장 - 화이트화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/pax-grimo-corner-wardrobe-white-white-s79218510/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e3"
  },
  "name": "PAX 팍스 / FLISBERGET 플리스베리에트 옷장",
  "category": "closet",
  "style": "natural",
  "dimensions": {
    "width": 200,
    "depth": 60,
    "height": 201.2
  },
  "colortone": "lightbeige",
  "price": 795000,
  "brand": "IKEA",
  "glb_file": "PAX 팍스  FLISBERGET 플리스베리에트 옷장 - 화이트라이트베이지.glb",
  "url": "https://www.ikea.com/kr/ko/p/pax-flisberget-wardrobe-white-light-beige-s29304341/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e4"
  },
  "name": "PAX 팍스 오픈형 옷장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 175,
    "depth": 58,
    "height": 201.2
  },
  "colortone": "white",
  "price": 492500,
  "brand": "IKEA",
  "glb_file": "PAX 팍스 오픈형 옷장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/pax-wardrobe-white-s09128565/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e5"
  },
  "name": "BRIMNES 브림네스 옷장+도어3",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 117,
    "depth": 50,
    "height": 190
  },
  "colortone": "white",
  "price": 279000,
  "brand": "IKEA",
  "glb_file": "BRIMNES 브림네스 옷장+도어3 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/brimnes-wardrobe-with-3-doors-white-10407928/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e6"
  },
  "name": "PAX 팍스 오픈형 옷장콤비네이션",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 150,
    "depth": 58,
    "height": 201
  },
  "colortone": "white",
  "price": 355000,
  "brand": "IKEA",
  "glb_file": "PAX 팍스 오픈형 옷장콤비네이션 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/pax-wardrobe-combination-white-s09385673/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e7"
  },
  "name": "IDANÄS 이다네스 옷장",
  "category": "closet",
  "style": "natural",
  "dimensions": {
    "width": 121,
    "depth": 59,
    "height": 211
  },
  "colortone": "darkbrown steined",
  "price": 599000,
  "brand": "IKEA",
  "glb_file": "IDANÄS 이다네스 옷장 - 다크브라운 스테인.glb",
  "url": "https://www.ikea.com/kr/ko/p/idanaes-wardrobe-dark-brown-stained-30458832/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e8"
  },
  "name": "IDANÄS 이다네스 수납장+접이식도어",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 121,
    "depth": 50,
    "height": 135
  },
  "colortone": "white",
  "price": 479000,
  "brand": "IKEA",
  "glb_file": "IDANÄS 이다네스 수납장+접이식도어 - 화이트 (00458824).glb",
  "url": "https://www.ikea.com/kr/ko/p/idanaes-cabinet-with-bi-folding-doors-white-00458824/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746e9"
  },
  "name": "PAX 팍스 / FORSAND 포르산드 옷장콤비네이션",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 150,
    "depth": 60,
    "height": 201.2
  },
  "colortone": "white",
  "price": 480000,
  "brand": "IKEA",
  "glb_file": "PAX 팍스  FORSAND 포르산드 옷장콤비네이션 - 화이트화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/pax-forsand-wardrobe-combination-white-white-s09429714/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746ea"
  },
  "name": "KLEPPSTAD 클렙스타드 옷장+도어2",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 79,
    "depth": 55,
    "height": 176
  },
  "colortone": "white",
  "price": 139000,
  "brand": "IKEA",
  "glb_file": "KLEPPSTAD 클렙스타드 옷장+도어2 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/kleppstad-wardrobe-with-2-doors-white-10437237/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746eb"
  },
  "name": "IDANÄS 이다네스 6칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 84,
    "depth": 50,
    "height": 135
  },
  "colortone": "white",
  "price": 459000,
  "brand": "IKEA",
  "glb_file": "IDANÄS 이다네스 6칸서랍장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/idanaes-chest-of-6-drawers-white-80458698/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746ec"
  },
  "name": "MALM 말름 6칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 160,
    "depth": 48,
    "height": 78
  },
  "colortone": "white",
  "price": 279000,
  "brand": "IKEA",
  "glb_file": "MALM 말름 6칸서랍장 - 화이트 (70354644).glb",
  "url": "https://www.ikea.com/kr/ko/p/malm-chest-of-6-drawers-white-70354644/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746ed"
  },
  "name": "JONAXEL 요낙셀 옷장콤비네이션",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 173,
    "depth": 51,
    "height": 173
  },
  "colortone": "white",
  "price": 254000,
  "brand": "IKEA",
  "glb_file": "JONAXEL 요낙셀 옷장콤비네이션 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/jonaxel-wardrobe-combination-white-s69297664/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746ee"
  },
  "name": "NORDLI 노르들리 6칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 160,
    "depth": 47,
    "height": 169
  },
  "colortone": "white",
  "price": 470000,
  "brand": "IKEA",
  "glb_file": "NORDLI 노르들리 6칸서랍장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/nordli-chest-of-6-drawers-white-s69295170/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746ef"
  },
  "name": "NORDLI 노르들리 5칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 120,
    "depth": 47,
    "height": 169
  },
  "colortone": "white",
  "price": 380000,
  "brand": "IKEA",
  "glb_file": "NORDLI 노르들리 5칸서랍장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/nordli-chest-of-5-drawers-white-s89295287/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f0"
  },
  "name": "NORDLI 노르들리 8칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 160,
    "depth": 47,
    "height": 169
  },
  "colortone": "white",
  "price": 590000,
  "brand": "IKEA",
  "glb_file": "NORDLI 노르들리 8칸서랍장 - 화이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/nordli-chest-of-8-drawers-white-s89295353/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f1"
  },
  "name": "NORDLI 노르들리 8칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 120,
    "depth": 47,
    "height": 99
  },
  "colortone": "white",
  "price": 460000,
  "brand": "IKEA",
  "glb_file": "NORDLI 노르들리 8칸서랍장 - 화이트 (1).glb",
  "url": "https://www.ikea.com/kr/ko/p/nordli-chest-of-8-drawers-white-s29208429/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f2"
  },
  "name": "NORDLI 노르들리 6칸서랍장",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 80,
    "depth": 47,
    "height": 99
  },
  "colortone": "white/black",
  "price": 330000,
  "brand": "IKEA",
  "glb_file": "NORDLI 노르들리 6칸서랍장 - 화이트앤트러싸이트.glb",
  "url": "https://www.ikea.com/kr/ko/p/nordli-chest-of-6-drawers-white-anthracite-s19211762/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f3"
  },
  "name": "KOLBJÖRN 콜비에른 수납장",
  "category": "closet",
  "style": "natural",
  "dimensions": {
    "width": 80,
    "depth": 35,
    "height": 37
  },
  "colortone": "beige",
  "price": 107000,
  "brand": "IKEA",
  "glb_file": "KOLBJÖRN 콜비에른 수납장 - 실내외겸용.glb",
  "url": "https://www.ikea.com/kr/ko/p/kolbjoern-cabinet-in-outdoor-beige-50409299/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f4"
  },
  "name": "KLACKENÄS 클라케네스 다용도수납장",
  "category": "closet",
  "style": "natural",
  "dimensions": {
    "width": 41,
    "depth": 97,
    "height": 120
  },
  "colortone": "black/wood",
  "price": 499000,
  "brand": "IKEA",
  "glb_file": "KLACKENÄS 클라케네스 다용도수납장 - 블랙참나무무늬목 브라운스테인.glb",
  "url": "https://www.ikea.com/kr/ko/p/klackenaes-sideboard-black-oak-veneer-brown-stained-70506751/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f5"
  },
  "name": "FRYKSÅS 프뤽소스 수납장",
  "category": "closet",
  "style": "natural",
  "dimensions": {
    "width": 81,
    "depth": 41,
    "height": 124
  },
  "colortone": "wood",
  "price": 449000,
  "brand": "IKEA",
  "glb_file": "FRYKSÅS 프뤽소스 수납장 - 라탄.glb",
  "url": "https://www.ikea.com/kr/ko/p/fryksas-cabinet-rattan-20574097/"
},
{
  "_id": {
    "$oid": "6818ec5435879695a35746f6"
  },
  "name": "SAMLA 삼라 수납함+뚜껑",
  "category": "closet",
  "style": "modern",
  "dimensions": {
    "width": 57,
    "depth": 39,
    "height": 28
  },
  "price": 9900,
  "brand": "IKEA",
  "glb_file": "SAMLA 삼라 수납함+뚜껑 - 투명.glb",
  "url": "https://www.ikea.com/kr/ko/p/samla-box-with-lid-transparent-s39440767/"
},
{
  "_id": {
    "$oid": "68189c8fb6cf08b3314dd85b"
  },
  "name": "SLATTUM 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 120,
    "depth": 200,
    "height": 85
  },
  "colortone": "light",
  "price": 139000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/slattum-upholstered-bed-frame-vissle-dark-grey-70571242/"
},
{
  "_id": {
    "$oid": "68189db2598c057b6030344d"
  },
  "name": "NESTTUN 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 126,
    "depth": 207,
    "height": 86
  },
  "colortone": "light",
  "price": 166500,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/nesttun-bed-frame-white-luroey-s39158018/"
},
{
  "_id": {
    "$oid": "68189df3598c057b6030344e"
  },
  "name": "VEVELSTAD 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 126,
    "depth": 207,
    "height": 20
  },
  "colortone": "light",
  "price": 139000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/vevelstad-bed-frame-white-80518273/"
},
{
  "_id": {
    "$oid": "68189e21598c057b6030344f"
  },
  "name": "BRIMNES 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 126,
    "depth": 206,
    "height": 47
  },
  "colortone": "light",
  "price": 244000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/brimnes-bed-frame-with-storage-white-50401043/"
},
{
  "_id": {
    "$oid": "68189e9c598c057b60303450"
  },
  "name": "GRIMSBU 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 92,
    "depth": 202,
    "height": 55
  },
  "colortone": "medium",
  "price": 50000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/grimsbu-bed-frame-grey-20458757/"
},
{
  "_id": {
    "$oid": "68189f04598c057b60303451"
  },
  "name": "SONGESAND 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 133,
    "depth": 207,
    "height": 95
  },
  "colortone": "light",
  "price": 134000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/songesand-bed-frame-white-80372567/"
},
{
  "_id": {
    "$oid": "68189f67598c057b60303452"
  },
  "name": "STJÄRNÖ 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 98,
    "depth": 209,
    "height": 118
  },
  "colortone": "dark",
  "price": 284000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/stjaernoe-bed-frame-anthracite-loenset-s89563402/"
},
{
  "_id": {
    "$oid": "68189fb8598c057b60303453"
  },
  "name": "IDANÄS 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 131,
    "depth": 207,
    "height": 112
  },
  "colortone": "dark",
  "price": 329000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/idanaes-bed-frame-dark-brown-stained-40459647/"
},
{
  "_id": {
    "$oid": "68189fe5598c057b60303454"
  },
  "name": "FYRESDAL 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 88,
    "depth": 207,
    "height": 94
  },
  "colortone": "dark",
  "price": 197000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/fyresdal-day-bed-frame-black-00424363/"
},
{
  "_id": {
    "$oid": "6818a049598c057b60303455"
  },
  "name": "SLÄKT 침대",
  "category": "bed",
  "style": "modern",
  "dimensions": {
    "width": 96,
    "depth": 206,
    "height": 89
  },
  "colortone": "light",
  "price": 292000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/slaekt-bed-frame-w-storage-slatted-bedbase-white-s99291967/"
},
{
  "_id": {
    "$oid": "6818a0ba598c057b60303456"
  },
  "name": "MALM 침대",
  "category": "bed",
  "style": "natural",
  "dimensions": {
    "width": 135,
    "depth": 209,
    "height": 100
  },
  "colortone": "medium",
  "price": 284000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/malm-bed-frame-high-white-stained-oak-veneer-40325163/"
},
{
  "_id": {
    "$oid": "6818a0e8598c057b60303457"
  },
  "name": "TARVA 침대",
  "category": "bed",
  "style": "natural",
  "dimensions": {
    "width": 128,
    "depth": 209,
    "height": 92
  },
  "colortone": "medium",
  "price": 139000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/tarva-bed-frame-pine-00354459/"
},
{
  "_id": {
    "$oid": "6818a127598c057b60303458"
  },
  "name": "UTÅKER 침대",
  "category": "bed",
  "style": "natural",
  "dimensions": {
    "width": 83,
    "depth": 205,
    "height": 46
  },
  "colortone": "light",
  "price": 161000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/utaker-stackable-bed-pine-70360485/"
},
{
  "_id": {
    "$oid": "6818a16b598c057b60303459"
  },
  "name": "VEVELSTAD 침대",
  "category": "bed",
  "style": "natural",
  "dimensions": {
    "width": 96,
    "depth": 207,
    "height": 107
  },
  "colortone": "light",
  "price": 297200,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/vevelstad-bed-frame-with-3-headboards-white-tolkning-rattan-s79441821/"
},
{
  "_id": {
    "$oid": "6818a1e3598c057b6030345a"
  },
  "name": "GLAMBERGET 침대",
  "category": "bed",
  "style": "natural",
  "dimensions": {
    "width": 163,
    "depth": 211,
    "height": 35
  },
  "colortone": "medium",
  "price": 538000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/glamberget-bed-frame-with-storage-and-mattress-pine-vesteroey-extra-firm-s49568500/"
},
{
  "_id": {
    "$oid": "6818a297598c057b6030345b"
  },
  "name": "BRUKSVARA 침대",
  "category": "bed",
  "style": "natural",
  "dimensions": {
    "width": 126,
    "depth": 205,
    "height": 88
  },
  "colortone": "light",
  "price": 159000,
  "brand": "IKEA",
  "url": "https://www.ikea.com/kr/ko/p/bruksvara-bed-frame-white-40558204/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d500"
  },
  "name": "KALLAX 선반유닛 with underframe",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 147,
    "depth": 39,
    "height": 94
  },
  "colortone": "dark",
  "price": 129900,
  "brand": "IKEA",
  "glb_file": "kallax_underframe.glb",
  "url": "https://www.ikea.com/kr/ko/p/kallax-shelving-unit-with-underframe-black-brown-black-s79471667/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d501"
  },
  "name": "BILLY 책장 with drawer",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 80,
    "depth": 30,
    "height": 106
  },
  "colortone": "light",
  "price": 104900,
  "brand": "IKEA",
  "glb_file": "billy_drawer.glb",
  "url": "https://www.ikea.com/kr/ko/p/billy-bookcase-with-drawer-white-s59545297/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d502"
  },
  "name": "SKRUVBY 책장",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 60,
    "depth": 37.5,
    "height": 140
  },
  "colortone": "light",
  "price": 89900,
  "brand": "IKEA",
  "glb_file": "skruvby_bookcase.glb",
  "url": "https://www.ikea.com/kr/ko/p/skruvby-bookcase-white-40508855/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d503"
  },
  "name": "DALRIPA 책장",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 60,
    "depth": 32,
    "height": 150
  },
  "colortone": "light",
  "price": 79900,
  "brand": "IKEA",
  "glb_file": "dalripa_bookcase.glb",
  "url": "https://www.ikea.com/kr/ko/p/dalripa-bookcase-white-90528506/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d504"
  },
  "name": "BILLY 책장 80x202",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 80,
    "depth": 28,
    "height": 202
  },
  "colortone": "light",
  "price": 114900,
  "brand": "IKEA",
  "glb_file": "billy_80x202.glb",
  "url": "https://www.ikea.com/kr/ko/p/billy-bookcase-white-s89545291/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d505"
  },
  "name": "VITTSJÖ 선반유닛",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 51,
    "depth": 36,
    "height": 175
  },
  "colortone": "dark",
  "price": 69900,
  "brand": "IKEA",
  "glb_file": "vittsjo_shelving.glb",
  "url": "https://www.ikea.com/kr/ko/p/vittsjoe-shelving-unit-black-brown-glass-30214679/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d506"
  },
  "name": "BILLY 책장 40x202",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 80,
    "depth": 28,
    "height": 106
  },
  "colortone": "light",
  "price": 59900,
  "brand": "IKEA",
  "glb_file": "billy_40x202.glb",
  "url": "https://www.ikea.com/kr/ko/p/billy-bookcase-white-70522044/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d507"
  },
  "name": "LAIVA 책장",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 62,
    "depth": 24,
    "height": 165
  },
  "colortone": "dark",
  "price": 30000,
  "brand": "IKEA",
  "glb_file": "laiva_bookcase.glb",
  "url": "https://www.ikea.com/kr/ko/p/laiva-bookcase-black-brown-20178592/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d508"
  },
  "name": "KALLAX 선반유닛",
  "category": "bookshelf",
  "style": "natural",
  "dimensions": {
    "width": 76.5,
    "depth": 39,
    "height": 146.5
  },
  "colortone": "white-stained oak effect",
  "price": 99900,
  "brand": "IKEA",
  "glb_file": "kallax_oak.glb",
  "url": "https://www.ikea.com/kr/ko/p/kallax-shelving-unit-white-stained-oak-effect-70362917/"
},
{
  "_id": {
    "$oid": "6819e7248c0d5764d052d509"
  },
  "name": "FJÄLLBO 선반유닛",
  "category": "bookshelf",
  "style": "modern",
  "dimensions": {
    "width": 100,
    "depth": 36,
    "height": 136
  },
  "colortone": "black",
  "price": 139000,
  "brand": "IKEA",
  "glb_file": "fjallbo_shelving.glb",
  "url": "https://www.ikea.com/kr/ko/p/fjaellbo-shelving-unit-black-10339294/"
},
{
  "_id": {
    "$oid": "6819e7df8c0d5764d052d50a"
  },
  "id": "desk001",
  "name": "LINNMON 린몬 / ADILS 아딜스,테이블,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 74
  },
  "colortone": "white",
  "price": 39900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-adils-table-white-s09246408/"
},
{
  "_id": {
    "$oid": "6819e7e98c0d5764d052d50b"
  },
  "id": "desk002",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책상,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 120,
    "depth": 60,
    "height": 73
  },
  "colortone": "white",
  "price": 49900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/lagkapten-adils-desk-white-s09416759/"
},
{
  "_id": {
    "$oid": "6819e7ef8c0d5764d052d50c"
  },
  "id": "desk003",
  "name": "MICKE 미케,책상,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 105,
    "depth": 50,
    "height": 75
  },
  "colortone": "white",
  "price": 49900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/micke-desk-white-80354276/#content"
},
{
  "_id": {
    "$oid": "6819e7f68c0d5764d052d50d"
  },
  "id": "desk004",
  "name": "LINNMON 린몬 / OLOV 올로브.책상,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 93
  },
  "colortone": "white",
  "price": 59900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-olov-desk-white-s99416199/"
},
{
  "_id": {
    "$oid": "6819e7fe8c0d5764d052d50e"
  },
  "id": "desk005",
  "name": "PÅHL 폴,책상,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 96,
    "depth": 58,
    "height": 72
  },
  "colortone": "white",
  "price": 69900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/pahl-desk-white-s19245106/"
},
{
  "_id": {
    "$oid": "6819e8068c0d5764d052d50f"
  },
  "id": "desk006",
  "name": "BRUSALI 브루살리,책상,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 90,
    "depth": 52,
    "height": 73
  },
  "colortone": "white",
  "price": 79900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/brusali-desk-white-20439764//"
},
{
  "_id": {
    "$oid": "6819e80e8c0d5764d052d510"
  },
  "id": "desk007",
  "name": "TORALD 토랄드,책상,화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 65,
    "depth": 40,
    "height": 75
  },
  "colortone": "white",
  "price": 35000,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/torald-desk-white-70493956/"
},
{
  "_id": {
    "$oid": "6819e8148c0d5764d052d511"
  },
  "id": "desk008",
  "name": "LINNMON 린몬 / ADILS 아딜스,책상,다크그레이/블랙",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 74
  },
  "colortone": "darkgray/black",
  "price": 39900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-adils-desk-dark-grey-black-s99416095/#content"
},
{
  "_id": {
    "$oid": "6819e81d8c0d5764d052d512"
  },
  "id": "desk009",
  "name": "MICKE 미케,책상,블랙브라운",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 73,
    "depth": 50,
    "height": 75
  },
  "colortone": "blackbrown",
  "price": 69900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/micke-desk-black-brown-20354279/#content"
},
{
  "_id": {
    "$oid": "6819e8258c0d5764d052d513"
  },
  "id": "desk010",
  "name": "LINNMON 린몬 / KRILLE 크릴레,책상,다크그레이/화이트",
  "category": "desk",
  "style": "modern",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 73
  },
  "colortone": "darkgray/white",
  "price": 79900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-krille-desk-dark-grey-white-s39416121/#content"
},
{
  "_id": {
    "$oid": "6819e8a08c0d5764d052d514"
  },
  "id": "desk011",
  "name": "LINNMON 린몬 / ADILS 아딜스,책싱,화이트스테인 참나무무늬",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 74
  },
  "colortone": "white",
  "price": 39900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-adils-desk-white-stained-oak-effect-white-s59416337/"
},
{
  "_id": {
    "$oid": "6819e8a88c0d5764d052d515"
  },
  "id": "desk012",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책싱,화이트스테인 참나무무늬",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 140,
    "depth": 60,
    "height": 73
  },
  "colortone": "white",
  "price": 59900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/lagkapten-adils-desk-white-stained-oak-effect-white-s59417209/#content"
},
{
  "_id": {
    "$oid": "6819e8ae8c0d5764d052d516"
  },
  "id": "desk013",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책싱,화이트스테인 참나무무늬",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 140,
    "depth": 60,
    "height": 73
  },
  "colortone": "darkgrey",
  "price": 59900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/lagkapten-adils-desk-white-stained-oak-effect-dark-grey-s69417256/#content"
},
{
  "_id": {
    "$oid": "6819e8b68c0d5764d052d517"
  },
  "id": "desk014",
  "name": "MÅLSKYTT 몰쉬트 / ADILS 아딜스,책상,자작나무/화이트",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 140,
    "depth": 60,
    "height": 73
  },
  "colortone": "white",
  "price": 99900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/malskytt-adils-desk-birch-white-s09417749/#content"
},
{
  "_id": {
    "$oid": "6819e8c18c0d5764d052d519"
  },
  "id": "desk016",
  "name": "LAGKAPTEN 락캅텐 / KRILLE 크릴레,책상,화이트스테인 참나무무늬 화이트",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 120,
    "depth": 60,
    "height": 73
  },
  "colortone": "white",
  "price": 89900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/lagkapten-krille-desk-white-stained-oak-effect-white-s99416910/#content"
},
{
  "_id": {
    "$oid": "6819e8c88c0d5764d052d51a"
  },
  "id": "desk017",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책상,화이트스테인 참나무무늬/블랙",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 120,
    "depth": 60,
    "height": 73
  },
  "colortone": "black",
  "price": 49900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/lagkapten-adils-desk-white-stained-oak-effect-black-s39416885/#content"
},
{
  "_id": {
    "$oid": "6819e8cf8c0d5764d052d51b"
  },
  "id": "desk017",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책상,화이트스테인 참나무무늬/블랙",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 120,
    "depth": 60,
    "height": 73
  },
  "colortone": "black",
  "price": 49900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/lagkapten-adils-desk-white-stained-oak-effect-black-s39416885/#content"
},
{
  "_id": {
    "$oid": "6819e8d38c0d5764d052d51c"
  },
  "id": "desk018",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책상,화이트스테인 참나무무늬/화이트",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 93
  },
  "colortone": "white",
  "price": 59900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-olov-desk-white-stained-oak-effect-white-s49416347/#content"
},
{
  "_id": {
    "$oid": "6819e8dc8c0d5764d052d51d"
  },
  "id": "desk019",
  "name": "LAGKAPTEN 락캅텐 / ADILS 아딜스,책상,화이트스테인 참나무무늬/블랙",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 100,
    "depth": 60,
    "height": 93
  },
  "colortone": "black",
  "price": 59900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/linnmon-olov-desk-white-stained-oak-effect-black-s59416356/#content"
},
{
  "_id": {
    "$oid": "6819e8e38c0d5764d052d51e"
  },
  "id": "desk020",
  "name": "FJÄLLBO 피엘보,노트북책상,블랙",
  "category": "desk",
  "style": "natural",
  "dimensions": {
    "width": 100,
    "depth": 36,
    "height": 75
  },
  "colortone": "black",
  "price": 69900,
  "brand": "IKEA",
  "glb_file": "일단 비어둬보자",
  "url": "https://www.ikea.com/kr/ko/p/fjaellbo-laptop-table-black-10339736/"
}];

// --- 가구 아이템 클래스 정의 ---
const furnitureDb = rawFurnitureDb.map(item => new FurnitureItem(item));

// --- 사용자 입력 값 정의 ---
const userWeights = {
  style: 0.3,
  colortone: 0.3,
  size: 0.2,
  price: 0.2,
  target_style: "modern", //mordern, natural
  target_colortone: "light" //light, medium, dark
};

const budget = 1000000;       // 예산 100만 원
const perimeter = 600;       // 배치 가능 폭 600cm

// --- 추천 실행 ---
const recommended = recommendSets(furnitureDb, userWeights, budget, perimeter);

// --- 총 가격 계산 함수 ---
function totalPrice(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// --- 결과 출력 ---
recommended.forEach((set, index) => {
  const totalSetPrice = totalPrice(set).toLocaleString();
  const totalSetWidth = set.reduce((sum, item) => sum + item.dimensions.width, 0);

  console.log(`\n🔷 추천 세트 ${index + 1} (총 가격: ${totalSetPrice}, 총 가로 길이: ${totalSetWidth}cm):`);
  set.forEach(item => {
    console.log(`- ${item.name} (${item.category}) | 스타일: ${item.style}, 컬러: ${item.colortone}, 가격: ${item.price.toLocaleString()}원`);
    console.log(`  크기: ${item.dimensions.width}cm (가로) × ${item.dimensions.depth}cm (세로)`);
    console.log(`  링크: ${item.url}`);
  });
});
