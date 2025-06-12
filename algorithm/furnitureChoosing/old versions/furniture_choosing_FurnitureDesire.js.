console.log("=== Script Started ===");

// 기존 코드와 달라진 부분 : 
// 1. 원하는 가구 카테고리 추가. userPreferenceRank에 desiredCategories: ["desk", "bed"] 가 추가되었다. [] 안에 원하는 가구 넣으면 된다. bed, bookshelf, desk, closet 중에서 선택.
// 2. //원하는 가구만 추천하도록 필터링하는 함수가 추가됨.
/*
function selectCategory(furnitureDb, userWeights, maxBudget, perimeter) { 가 추가되고 filteredItems 을 반환.
*/
// 3. recommendSets 함수에서 selectItems 함수에 availableItems 대신 filteredItems를 전달하여 원하는 가구 카테고리만 선택하도록 변경됨.
/*
recommendSets 함수에서 selectItems 함수에 availableItems 대신 filteredItems를 전달하여 원하는 가구 카테고리만 선택하도록 변경됨.
아래 두 줄이 변경된 부분임.
  const filteredItems = selectCategory(availableItems, userWeights, maxBudget, perimeter); // filteredItems 가 추가되어 원하는 가구 카테고리만 고름
  const selectedFurniture = selectItems(filteredItems, userWeights, maxBudget, perimeter); // selectItems 함수에 availableItems 대신 filteredItems를 전달하여 원하는 가구 카테고리만 선택
*/
// 4. console.log(userWeights) 부분을 삭제함. 더 이상 가중치는 출력하지 않음

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
//스타일이 cozy인 경우 natural로 변환하는 함수
function normalizeStyleForFurniture(style) {
  return style.toLowerCase() === "cozy" ? "natural" : style;
}

//원하는 가구만 추천하도록 필터링하는 함수
function selectCategory(furnitureDb, userWeights, maxBudget, perimeter) {
  const desiredCategories = userWeights.desiredCategories;

  // 원하는 카테고리만 필터링
  const filteredItems = furnitureDb.filter(item =>
    desiredCategories.includes(item.category)
  );

  return filteredItems;
}

//가구 선택 함수
function selectItems(furnitureDb, weights, budget, perimeter) {
    //함수의 입력값은 (가구 DB, 사용자 선호도(가중치), 예산, 가구 배치 면적적)
  const categories = ["bed", "closet", "desk", "bookshelf"];//카테고리별 후보군
  const selectedItems = [];

  for (const category of categories) {
    const candidates = furnitureDb.filter(f => f.category === category);//카테고리별 후보군
    if (candidates.length === 0) continue;
    const normalizedStyle = normalizeStyleForFurniture(weights.target_style); //cozy를 natural로 변환
    candidates.sort((a, b) => { //1을 각 4가지 조건에 따라 소수점으로 나누어 나눠진 가중치에 곱셈 통해 정렬
      const scoreA =
        weights.style * (a.style === normalizedStyle) +
        weights.colortone * (a.colortone === weights.target_colortone) -
        weights.size * a.sizeGrade() -
        weights.price * a.priceGrade();

      const scoreB =
        weights.style * (b.style === normalizedStyle) +
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


// 침구 클래스 정의
class BeddingItem {
    constructor(data) {
      this.oid = data._id?.$oid ?? crypto.randomUUID(); // DB _id가 있으면 사용, 없으면 UUID 생성하도록 코드 수정
      this.name = data.name;
      this.category = data.category;
      this.style = data.style;
      this.dimensions = data.dimensions;
      this.colortone = data.colortone;
      this.material = data.material;
      this.price = data.price;
      this.brand = data.brand;
      this.glb_file = data.glb_file;
      this.url = data.url;
    }
  }
// 매트리스 커버 클래스 정의
class MattressItem {
    constructor(data) {
      this.oid = data._id?.$oid ?? crypto.randomUUID(); // DB _id가 있으면 사용, 없으면 UUID 생성하도록 코드 수정
      this.name = data.name;
      this.category = data.category;
      this.style = data.style;
      this.dimensions = data.dimensions;
      this.colortone = data.colortone;
      this.material = data.material;
      this.price = data.price;
      this.brand = data.brand;
      this.glb_file = data.glb_file;
      this.url = data.url;
    }
  }
// 커튼 클래스 정의
class CurtainItem {
    constructor(data) {
      this.oid = data._id?.$oid ?? crypto.randomUUID(); // DB _id가 있으면 사용, 없으면 UUID 생성하도록 코드 수정
      this.name = data.name;
      this.category = data.category;
      this.style = data.style;
      this.dimensions = data.dimensions;
      this.colortone = data.colortone;
      this.opaqueness = data.opaqueness;
      this.price = data.price;
      this.brand = data.brand;
      this.glb_file = data.glb_file;
      this.url = data.url;
    }
  }

// 침구 추천 함수
function recommendBedding(beddingList, selectedBed, pointColor) {
  // 침대 크기 추출
  const bedWidth = selectedBed.dimensions.width;

  // 1. 침대보다 큰 사이즈의 침구 필터링
  let candidates = beddingList.filter(item => {
    return (
      item.dimensions.length >= bedWidth
    );
  });

  if (candidates.length === 0) return null; // 적절한 크기의 침구 없음

  // 2. pointcolor 일치 확인
  const colorMatched = candidates.filter(item =>
    item.colortone?.toLowerCase().includes(pointColor.toLowerCase())
  );

  if (colorMatched.length > 0) {
    candidates = colorMatched;
  }

  // 3. pointcolor만 일치하는 침구가 하나면 바로 return
  if (candidates.length === 1) {
    return candidates[0];
  }

  // 4. style 일치로 필터링
  const styleMatched = candidates.filter(
    item => item.style === selectedBed.style
  );

  if (styleMatched.length > 0) {
    candidates = styleMatched;
  }

  // 5. 최종 후보 중 랜덤 선택
  if (candidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  return null; // 추천할 수 있는 침구 없음
}

// 매트리스 추천 함수
function recommendMattressCover(mattressList, selectedBed, pointColor) {
  const bedWidth = selectedBed.dimensions.width;
  const bedDepth = selectedBed.dimensions.depth;

  // 1. 침대와 가장 가까운 크기의 매트리스 커버 선택
  let minDiff = Infinity;
  let closestCandidates = [];

  for (const item of mattressList) {
    const widthDiff = Math.abs(item.dimensions.length - bedWidth);
    const totalDiff = widthDiff;

    if (totalDiff < minDiff) {
      minDiff = totalDiff;
      closestCandidates = [item];
    } else if (totalDiff === minDiff) {
      closestCandidates.push(item);
    }
  }

  if (closestCandidates.length === 0) return null;

  // 2. pointcolor 포함 여부 확인 (부분 문자열 포함)
  const colorMatched = closestCandidates.filter(item =>
    item.colortone?.toLowerCase().includes(pointColor.toLowerCase())
  );

  if (colorMatched.length > 0) {
    closestCandidates = colorMatched;
  }

  // 3. pointcolor만 일치하는 게 하나면 바로 return
  if (closestCandidates.length === 1) {
    return closestCandidates[0];
  }

  // 4. style 일치로 필터링
  const styleMatched = closestCandidates.filter(
    item => item.style === selectedBed.style
  );

  if (styleMatched.length > 0) {
    closestCandidates = styleMatched;
  }

  // 5. 최종 후보 중 랜덤 선택
  if (closestCandidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * closestCandidates.length);
    return closestCandidates[randomIndex];
  }

  return null; // 추천할 수 있는 매트리스 커버 없음
}

// 커튼 추천 함수
function recommendCurtain(curtainList, pointColor, selectedStyle) {
  // 1. pointcolor 포함 여부 확인 (부분 문자열 포함)
  let colorMatched = curtainList.filter(item =>
    item.colortone?.toLowerCase().includes(pointColor.toLowerCase())
  );

  // pointcolor가 일치하는 게 없으면 전체가 후보 (규칙에 명시되어 있지 않지만 fallback용)
  if (colorMatched.length === 0) {
    colorMatched = [...curtainList];
  }

  // 2. style 일치 필터링
  const styleMatched = colorMatched.filter(
    item => item.style === selectedStyle
  );

  if (styleMatched.length > 0) {
    colorMatched = styleMatched;
  }

  // 3. 최종 후보 중 랜덤 선택
  if (colorMatched.length > 0) {
    const randomIndex = Math.floor(Math.random() * colorMatched.length);
    return colorMatched[randomIndex];
  }

  return null; // 추천할 수 있는 커튼 없음
}

//추천 메인 함수(가구 추천 + 데코 추천으로 변경됨)
function recommendSets(furnitureDb, beddingList, mattressList, curtainList, userWeights, maxBudget, perimeter, pointColor) {
  const recommendedSets = [];
  let availableItems = [...furnitureDb];

  for (let i = 0; i < 3; i++) {
    // 1. 가구 세트 선택
    
    const filteredItems = selectCategory(availableItems, userWeights, maxBudget, perimeter); // filteredItems 가 추가되어 원하는 가구 카테고리만 고름
    const selectedFurniture = selectItems(filteredItems, userWeights, maxBudget, perimeter); // selectItems 함수에 availableItems 대신 filteredItems를 전달하여 원하는 가구 카테고리만 선택

    // 2. 침대 추출
    const selectedBed = selectedFurniture.find(item => item.category === "bed");
    if (!selectedBed) {
      console.warn("선택된 가구 세트에 침대가 없습니다. 데코레이션을 건너뜁니다.");
      recommendedSets.push({ furnitureSet: selectedFurniture, decorationSet: null });
      continue;
    }

    // 3. 데코 추천
    const recommendedBedding = recommendBedding(beddingList, selectedBed, pointColor);
    const recommendedMattressCover = recommendMattressCover(mattressList, selectedBed, pointColor);
    const recommendedCurtain = recommendCurtain(curtainList, pointColor, selectedBed.style);

    // 4. 세트 저장
    recommendedSets.push({
      furnitureSet: selectedFurniture,
      decorationSet: {
        bedding: recommendedBedding,
        mattress_cover: recommendedMattressCover,
        curtain: recommendedCurtain
      }
    });

    // 5. 가구 중복 제거
    selectedFurniture.forEach(item => {
      availableItems = availableItems.filter(f => f !== item);
    });
  }

  return recommendedSets;
}


// --- DB 데이터 로딩 ---
const rawFurnitureDb = 
[
  {
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
    "colortone": "light",
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
    "colortone": "medium",
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
    "colortone": "medium",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "medium",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "dark",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "light",
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
    "colortone": "medium",
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
    "colortone": "medium",
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
    "colortone": "dark",
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
    "colortone": "medium",
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
    "colortone": "light",
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
  }
];
const rawBeddingList = 
[
    {
        "name": "JAKOBSLILJA 야콥슬릴리아 베드스프레드",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 250
        },
        "colortone": "white",
        "material": "cotton",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "jakobslilja-bedspread-off-white-anthracite__1284413_pe932840_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/jakobslilja-bedspread-off-white-anthracite-50587480/"
    },
    {
        "name": "GULLNATTLJUS 굴나틀리우스 베드스프레드",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 160,
            "width": 250
        },
        "colortone": "floral",
        "material": "polyester",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "gullnattljus-bedspread-white-floral-pattern__1385922_pe963542_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/gullnattljus-bedspread-white-floral-pattern-90600352/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": ".jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-white-00357311/"
    },
    {
        "name": "BERGPALM 베리팔름 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "blue",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "bergpalm-duvet-cover-and-pillowcase-blue-striped__1058345_pe849253_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bergpalm-duvet-cover-and-pillowcase-blue-striped-20522635/"
    },
    {
        "name": "BERGPALM 베리팔름 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "lightpink",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "bergpalm-duvet-cover-and-pillowcase-light-pink-stripe__0978256_pe814061_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bergpalm-duvet-cover-and-pillowcase-light-pink-stripe-70500674/#content"
    },
    {
        "name": "BERGPALM 베리팔름 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "green",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "bergpalm-duvet-cover-and-pillowcase-green-stripe__0720386_pe732529_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bergpalm-duvet-cover-and-pillowcase-green-stripe-60423209/#content"
    },
    {
        "name": "BERGPALM 베리팔름 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "bergpalm-duvet-cover-and-pillowcase-grey-stripe__0720384_pe732527_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bergpalm-duvet-cover-and-pillowcase-grey-stripe-50423262/#content"
    },
    {
        "name": "SMÅNUNNEÖRT 스모눈네외르트 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "redbrown",
        "material": "cotton/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "smanunneoert-duvet-cover-and-pillowcase-red-brown-white-striped__1385790_pe963424_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/smanunneoert-duvet-cover-and-pillowcase-red-brown-white-striped-10599989/"
    },
    {
        "name": "SMÅNUNNEÖRT 스모눈네외르트 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "darkgreyblue",
        "material": "cotton/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "smanunneoert-duvet-cover-and-pillowcase-dark-grey-blue-white-striped__1385765_pe963400_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/smanunneoert-duvet-cover-and-pillowcase-dark-grey-blue-white-striped-00599881/#content"
    },
    {
        "name": "OFELIA VASS 오펠리아 바스 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ofelia-vass-duvet-cover-and-pillowcase-white__0643366_pe701799_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ofelia-vass-duvet-cover-and-pillowcase-white-00234099/"
    },
    {
        "name": "ÄNGSLILJA 엥슬릴리아 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "greygreen",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "aengslilja-duvet-cover-and-pillowcase-grey-green__1316057_pe940616_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengslilja-duvet-cover-and-pillowcase-grey-green-20592789/"
    },
    {
        "name": "ÄNGSLILJA 엥슬릴리아 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "aengslilja-duvet-cover-and-pillowcase-grey__1390652_pe965468_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengslilja-duvet-cover-and-pillowcase-grey-50318671/#content"
    },
    {
        "name": "ÄNGSLILJA 엥슬릴리아 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "natural",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "aengslilja-duvet-cover-and-pillowcase-natural__1315989_pe940578_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengslilja-duvet-cover-and-pillowcase-natural-80592791/#content"
    },
    {
        "name": "ÄNGSLILJA 엥슬릴리아 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "redbrown",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "aengslilja-duvet-cover-and-pillowcase-red-brown__1316088_pe940634_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengslilja-duvet-cover-and-pillowcase-red-brown-60592792/#content"
    },
    {
        "name": "ÄNGSLILJA 엥슬릴리아 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "bluegrey",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "aengslilja-duvet-cover-and-pillowcase-blue-grey__1316015_pe940596_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengslilja-duvet-cover-and-pillowcase-blue-grey-00592790/#content"
    },
    {
        "name": "ÄNGSLILJA 엥슬릴리아 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "aengslilja-duvet-cover-and-pillowcase-white__1135310_pe878966_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengslilja-duvet-cover-and-pillowcase-white-50318567/#content"
    },
    {
        "name": "ÖGONLOCKSMAL 외곤록스말 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "black",
        "material": "polyester",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "oegonlocksmal-duvet-cover-and-pillowcase-black-white-yellow__1384897_pe963057_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/oegonlocksmal-duvet-cover-and-pillowcase-black-white-yellow-20600039/"
    },
    {
        "name": "NATTJASMIN 나티아스민 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-duvet-cover-and-pillowcase-white__0638285_pe698815_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-duvet-cover-and-pillowcase-white-20337181/"
    },
    {
        "name": "NATTJASMIN 나티아스민 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "bluegreen",
        "material": "cotton/lyocell",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-duvet-cover-and-pillowcase-blue-green__1362409_pe955219_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-duvet-cover-and-pillowcase-blue-green-60595837/#content"
    },
    {
        "name": "NATTJASMIN 나티아스민 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "lightbeige",
        "material": "cotton/lyocell",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-duvet-cover-and-pillowcase-light-beige__0720527_pe732613_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-duvet-cover-and-pillowcase-light-beige-90442621/#content"
    },
    {
        "name": "BJÖRKGRÅMAL 비에르크그로말 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white/black",
        "material": "cotton/viscose",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "bjoerkgramal-duvet-cover-and-pillowcase-black-white-dotted__1362335_pe955189_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bjoerkgramal-duvet-cover-and-pillowcase-black-white-dotted-40591185/"
    },
    {
        "name": "VALLKRASSING 발크라싱 담요/스로우",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "offwhite",
        "material": "cotton",
        "price": 22900,
        "brand": "IKEA",
        "jpg_file": "vallkrassing-throw-off-white__1207651_pe908114_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/vallkrassing-throw-off-white-40570927/"
    },
    {
        "name": "VALLKRASSING 발크라싱 담요/스로우",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "greygreen",
        "material": "cotton",
        "price": 22900,
        "brand": "IKEA",
        "jpg_file": "vallkrassing-throw-grey-green__1207660_pe908117_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/vallkrassing-throw-grey-green-70570935/#content"
    },
    {
        "name": "NATTSLÄNDA 낫슬렌다 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "floral",
        "material": "cotton/lyocell",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "nattslaenda-duvet-cover-and-pillowcase-floral-pattern-multicolour__0977177_pe813446_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattslaenda-duvet-cover-and-pillowcase-floral-pattern-multicolour-30508016/"
    },
    {
        "name": "PELARTUJA 펠라르투야 베드스프레드",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 250
        },
        "colortone": "redbrown",
        "material": "cotton",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "pelartuja-bedspread-red-brown-beige__1385934_pe963554_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/pelartuja-bedspread-red-brown-beige-70600386/"
    },
    {
        "name": "PELARTUJA 펠라르투야 베드스프레드",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 250
        },
        "colortone": "white",
        "material": "cotton",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "pelartuja-bedspread-white__1385925_pe963545_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/pelartuja-bedspread-white-30600369/#content"
    },
    {
        "name": "PELARTUJA 펠라르투야 베드스프레드",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 250
        },
        "colortone": "greengrey",
        "material": "cotton",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "pelartuja-bedspread-green-grey-white__1385928_pe963548_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/pelartuja-bedspread-green-grey-white-80600395/#content"
    },
    {
        "name": "KLIPPBRÄCKA 클리프브레카 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white/black",
        "material": "cotton",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "klippbraecka-duvet-cover-and-pillowcase-white-black__1344007_pe949679_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/klippbraecka-duvet-cover-and-pillowcase-white-black-70585003/"
    },
    {
        "name": "SLÅNHÖSTMAL 슬론회스트말 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "orange/pink",
        "material": "cotton/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "slanhoestmal-duvet-cover-and-pillowcase-orange-pink-striped__1241203_pe920869_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/slanhoestmal-duvet-cover-and-pillowcase-orange-pink-striped-80575292/"
    },
    {
        "name": "SLÅNHÖSTMAL 슬론회스트말 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white/black",
        "material": "cotton/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "slanhoestmal-duvet-cover-and-pillowcase-black-white-striped__1241174_pe920852_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/slanhoestmal-duvet-cover-and-pillowcase-black-white-striped-60575269/#content"
    },
    {
        "name": "EKTANDVINGE 엑탄드빙에 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "green",
        "material": "cotton",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ektandvinge-duvet-cover-and-pillowcase-pale-grey-green-white-check__1315721_pe940544_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ektandvinge-duvet-cover-and-pillowcase-pale-grey-green-white-check-80585427/"
    },
    {
        "name": "NATTSLÄNDA 낫슬렌다 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "blue/yellow",
        "material": "cotton",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "nattslaenda-duvet-cover-and-pillowcase-stripe-pattern-multicolour__0977169_pe813424_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattslaenda-duvet-cover-and-pillowcase-stripe-pattern-multicolour-40508006/"
    },
    {
        "name": "BRUNKRISSLA 브룽크리슬라 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "black",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "brunkrissla-duvet-cover-and-pillowcase-black__0642969_pe701579_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/brunkrissla-duvet-cover-and-pillowcase-black-40564587/"
    },
    {
        "name": "INDIRA 인디라 베드스프레드",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 250
        },
        "colortone": "natural",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "indira-bedspread-natural-unbleached-cotton__1259115_pe926530_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/indira-bedspread-natural-unbleached-cotton-70581062/"
    },
    {
        "name": "INDIRA 인디라 베드스프레드",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 250
        },
        "colortone": "greygreen",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "indira-bedspread-grey-green__1259112_pe926527_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/indira-bedspread-grey-green-90582621/#content"
    },
    {
        "name": "SLÖJSILJA 슬뢰이실리아 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "skyblue",
        "material": "cotton",
        "price": 35900,
        "brand": "IKEA",
        "jpg_file": "sloejsilja-duvet-cover-and-pillowcase-light-blue-white-stripe__1207165_pe907826_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sloejsilja-duvet-cover-and-pillowcase-light-blue-white-stripe-30561400/"
    },
    {
        "name": "NATTSLÄNDA 낫슬렌다 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "nattslaenda-duvet-cover-and-pillowcase-floral-pattern-grey-white__0977184_pe813431_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattslaenda-duvet-cover-and-pillowcase-floral-pattern-grey-white-40508025/"
    },
    {
        "name": "BLÅVINGAD 블로빙아드 이불커버+베개커버",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "blue",
        "material": "cotton",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "blavingad-duvet-cover-and-pillowcase-ocean-pattern-blue__1087812_pe860928_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/blavingad-duvet-cover-and-pillowcase-ocean-pattern-blue-90521128/"
    },
    {
        "name": "EKPURPURMAL 엑푸르푸르말 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white/blue",
        "material": "cotton/polyester",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "ekpurpurmal-duvet-cover-and-pillowcase-white-blue-cloud__1149536_pe884072_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ekpurpurmal-duvet-cover-and-pillowcase-white-blue-cloud-50547007/"
    },
    {
        "name": "BISKOPSMÖSSA 비스콥스뫼사 담요/스로우",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 130,
            "width": 170
        },
        "colortone": "green",
        "material": "polyester",
        "price": 12900,
        "brand": "IKEA",
        "jpg_file": "biskopsmoessa-throw-green-off-white__1346431_pe950932_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/biskopsmoessa-throw-green-off-white-80598670/"
    },
    {
        "name": "PARKOLVON 파르콜본 베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 50,
            "width": 80
        },
        "colortone": "yellow",
        "material": "cotton",
        "price": 6900,
        "brand": "IKEA",
        "jpg_file": "parkolvon-pillowcase-multicolour-check__1243849_pe920992_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/parkolvon-pillowcase-multicolour-check-70571204/"
    },
    {
        "name": "LUKTJASMIN 룩샤스민 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "darkgrey",
        "material": "cotton/lyocell",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "luktjasmin-duvet-cover-and-pillowcase-dark-grey__0684428_pe721362_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/luktjasmin-duvet-cover-and-pillowcase-dark-grey-90442555/"
    },
    {
        "name": "LUKTJASMIN 룩샤스민 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "greybeige",
        "material": "cotton/lyocell",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "luktjasmin-duvet-cover-and-pillowcase-grey-beige__1210657_pe910302_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/luktjasmin-duvet-cover-and-pillowcase-grey-beige-80570299/#content"
    },
    {
        "name": "BREDVECKLARE 브레드베클라레 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/viscose",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "bredvecklare-duvet-cover-and-pillowcase-white-blue-check__1279022_pe931233_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bredvecklare-duvet-cover-and-pillowcase-white-blue-check-00579345/"
    },
    {
        "name": "BLÅSKATA 블로스카타 이불커버+베개커버",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey/black",
        "material": "viscos",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "blaskata-duvet-cover-and-pillowcase-grey-black-patterned__1274442_pe930313_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/blaskata-duvet-cover-and-pillowcase-grey-black-patterned-30570503/"
    },
    {
        "name": "BLÅVINGAD 블로빙아드 이불커버+베개커버",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "pattern",
        "material": "cotton/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "blavingad-duvet-cover-and-pillowcase-penguin-pattern-light-turquoise__1087547_pe860777_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/blavingad-duvet-cover-and-pillowcase-penguin-pattern-light-turquoise-30521089/"
    },
    {
        "name": "SORGMANTEL 소리만텔 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "green",
        "material": "cotton/polyester",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "sorgmantel-duvet-cover-and-2-pillowcases-white-green__1149547_pe884083_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sorgmantel-duvet-cover-and-2-pillowcases-white-green-00549481/"
    },
    {
        "name": "ÖGONLOCKSMAL 외곤록스말 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "black",
        "material": "polyester",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "oegonlocksmal-duvet-cover-and-2-pillowcases-black-white-yellow__1384899_pe963059_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/oegonlocksmal-duvet-cover-and-2-pillowcases-black-white-yellow-90600026/"
    },
    {
        "name": "BJÖRKGRÅMAL 비에르크그로말 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "white/black",
        "material": "cotton/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "bjoerkgramal-duvet-cover-and-2-pillowcases-black-white-dotted__1362337_pe955191_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bjoerkgramal-duvet-cover-and-2-pillowcases-black-white-dotted-20591172/"
    },
    {
        "name": "ÄNGSVITVINGE 엥스비트빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "skyblue",
        "material": "cotton",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "aengsvitvinge-duvet-cover-and-2-pillowcases-blue-white__1344081_pe949719_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengsvitvinge-duvet-cover-and-2-pillowcases-blue-white-30584562/"
    },
    {
        "name": "SUMPGRÖE 숨프그뢰에 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "green",
        "material": "polyester/viscose",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "sumpgroee-duvet-cover-and-2-pillowcases-multicolour-striped__1359649_pe955155_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sumpgroee-duvet-cover-and-2-pillowcases-multicolour-striped-50587215/"
    },
    {
        "name": "NATTJASMIN 나티아스민 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-duvet-cover-and-2-pillowcases-white__0638285_pe698815_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-duvet-cover-and-2-pillowcases-white-80337164/"
    },
    {
        "name": "NATTJASMIN 나티아스민 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "bluegreen",
        "material": "cotton/lyocell",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-duvet-cover-and-2-pillowcases-blue-green__1362411_pe955215_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-duvet-cover-and-2-pillowcases-blue-green-40595824/#content"
    },
    {
        "name": "NATTJASMIN 나티아스민 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "lightbeige",
        "material": "cotton/lyocell",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-duvet-cover-and-2-pillowcases-light-beige__0720527_pe732613_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-duvet-cover-and-2-pillowcases-light-beige-00442606/#content"
    },
    {
        "name": "KUNGSCISSUS 쿵시수스 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "green",
        "material": "cotton",
        "price": 69900,
        "brand": "IKEA",
        "jpg_file": "kungscissus-duvet-cover-and-2-pillowcases-white-green__1184209_pe897793_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/kungscissus-duvet-cover-and-2-pillowcases-white-green-10565022/"
    },
    {
        "name": "SMÅNUNNEÖRT 스모눈네외르트 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "darkgreyblue",
        "material": "cotton/viscose",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "smanunneoert-duvet-cover-and-2-pillowcases-dark-grey-blue-white-striped__1385767_pe963402_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/smanunneoert-duvet-cover-and-2-pillowcases-dark-grey-blue-white-striped-70599868/"
    },
    {
        "name": "SMÅNUNNEÖRT 스모눈네외르트 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "redbrown",
        "material": "cotton/viscose",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "smanunneoert-duvet-cover-and-2-pillowcases-red-brown-white-striped__1385792_pe963426_s5",
        "url": "https://www.ikea.com/kr/ko/p/smanunneoert-duvet-cover-and-2-pillowcases-red-brown-white-striped-80599976/#content"
    },
    {
        "name": "KLIPPBRÄCKA 클리프브레카 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "white/black",
        "material": "cotton",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "klippbraecka-duvet-cover-and-2-pillowcases-white-black__1344030_pe949697_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/klippbraecka-duvet-cover-and-2-pillowcases-white-black-60584990/"
    },
    {
        "name": "TÅTELSMYGARE 토텔스뮈가레 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "white",
        "material": "cotton",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "tatelsmygare-duvet-cover-and-2-pillowcases-white-blue__1166685_pe891397_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/tatelsmygare-duvet-cover-and-2-pillowcases-white-blue-50554776/"
    },
    {
        "name": "BREDVECKLARE 브레드베클라레 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "white",
        "material": "cotton",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "bredvecklare-duvet-cover-and-2-pillowcases-white-blue-check__1279020_pe931231_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bredvecklare-duvet-cover-and-2-pillowcases-white-blue-check-60579333/"
    },
    {
        "name": "EKTANDVINGE 엑탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "white/black",
        "material": "cotton",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "ektandvinge-duvet-cover-and-2-pillowcases-anthracite-white-check__1315699_pe940532_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ektandvinge-duvet-cover-and-2-pillowcases-anthracite-white-check-40585387/"
    },
    {
        "name": "EKTANDVINGE 엑탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 200,
            "width": 230
        },
        "colortone": "green",
        "material": "cotton",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "ektandvinge-duvet-cover-and-2-pillowcases-pale-grey-green-white-check__1315725_pe940554_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ektandvinge-duvet-cover-and-2-pillowcases-pale-grey-green-white-check-00585412/#content"
    },
    {
        "name": "EKTANDVINGE 엑탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "green",
        "material": "cotton",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "ektandvinge-duvet-cover-and-2-pillowcases-pale-grey-green-white-check__1315725_pe940554_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ektandvinge-duvet-cover-and-2-pillowcases-pale-grey-green-white-check-30585415/#content"
    },
    {
        "name": "BJÖRKGRÅMAL 비에르크그로말 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white/black",
        "material": "cotton/viscose",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "bjoerkgramal-duvet-cover-and-2-pillowcases-black-white-dotted__1362337_pe955191_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bjoerkgramal-duvet-cover-and-2-pillowcases-black-white-dotted-50591175/"
    },
    {
        "name": "PILDVÄRGMAL 필드베리말 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "floral",
        "material": "cotton/viscose",
        "price": 69900,
        "brand": "IKEA",
        "jpg_file": "pildvaergmal-duvet-cover-and-2-pillowcases-white-floral-pattern__1385328_pe963277_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/pildvaergmal-duvet-cover-and-2-pillowcases-white-floral-pattern-80599844/"
    },
    {
        "name": "SCHERSMIN 셰르스민 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "palepink",
        "material": "cotton",
        "price": 79900,
        "brand": "IKEA",
        "jpg_file": "schersmin-duvet-cover-and-2-pillowcases-pale-pink__1385836_pe963462_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/schersmin-duvet-cover-and-2-pillowcases-pale-pink-50599765/"
    },
    {
        "name": "SCHERSMIN 셰르스민 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white",
        "material": "cotton",
        "price": 79900,
        "brand": "IKEA",
        "jpg_file": "schersmin-duvet-cover-and-2-pillowcases-white__1385816_pe963442_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/schersmin-duvet-cover-and-2-pillowcases-white-40599737/#content"
    },
    {
        "name": "PILTANDVINGE 필탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "pink",
        "material": "polyester/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "piltandvinge-duvet-cover-and-2-pillowcases-pink__1279130_pe931340_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/piltandvinge-duvet-cover-and-2-pillowcases-pink-30579141/"
    },
    {
        "name": "PILTANDVINGE 필탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white",
        "material": "polyester/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "piltandvinge-duvet-cover-and-2-pillowcases-white__1279151_pe931361_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/piltandvinge-duvet-cover-and-2-pillowcases-white-50579197/#content"
    },
    {
        "name": "PILTANDVINGE 필탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "blue",
        "material": "polyester/viscos",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "piltandvinge-duvet-cover-and-2-pillowcases-blue__1279106_pe931316_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/piltandvinge-duvet-cover-and-2-pillowcases-blue-80582396/#content"
    },
    {
        "name": "PILTANDVINGE 필탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "lightgreen",
        "material": "polyester/viscos",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "piltandvinge-duvet-cover-and-2-pillowcases-light-green__1279088_pe931286_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/piltandvinge-duvet-cover-and-2-pillowcases-light-green-50579116/#content"
    },
    {
        "name": "PILTANDVINGE 필탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "grey",
        "material": "polyester/viscos",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "piltandvinge-duvet-cover-and-2-pillowcases-grey__1279123_pe931333_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/piltandvinge-duvet-cover-and-2-pillowcases-grey-80579092/#content"
    },
    {
        "name": "TÅTELSMYGARE 토텔스뮈가레 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white",
        "material": "cotton",
        "price": 69900,
        "brand": "IKEA",
        "jpg_file": "tatelsmygare-duvet-cover-and-2-pillowcases-white-blue__1166685_pe891397_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/tatelsmygare-duvet-cover-and-2-pillowcases-white-blue-90554779/"
    },
    {
        "name": "SORGMANTEL 소리만텔 이불커버+베개커버2",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "green",
        "material": "cotton/polyester",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "sorgmantel-duvet-cover-and-2-pillowcases-white-green__1149547_pe884083_s5.jpg.avif.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sorgmantel-duvet-cover-and-2-pillowcases-white-green-40549484/"
    },
    {
        "name": "MYGGLASVINGE 뮈글라스빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "grey/blue",
        "material": "cotton/viscose",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "mygglasvinge-duvet-cover-and-2-pillowcases-multicolour__1359694_pe955171_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/mygglasvinge-duvet-cover-and-2-pillowcases-multicolour-30591223/"
    },
    {
        "name": "SLÅNHÖSTMAL 슬론회스트말 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white/black",
        "material": "cotton/viscose",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "slanhoestmal-duvet-cover-and-2-pillowcases-black-white-striped__1241172_pe920850_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/slanhoestmal-duvet-cover-and-2-pillowcases-black-white-striped-50575260/"
    },
    {
        "name": "SLÅNHÖSTMAL 슬론회스트말 이불커버+베개커버2",
        "category": "bedding",
        "style": "cozy",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "orange/pink",
        "material": "cotton/viscose",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "slanhoestmal-duvet-cover-and-2-pillowcases-orange-pink-striped__1241201_pe920867_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/slanhoestmal-duvet-cover-and-2-pillowcases-orange-pink-striped-70575283/#content"
    },
    {
        "name": "SUMPGRÖE 숨프그뢰에 이불커버+베개커버2,",
        "category": "bedding",
        "style": "natural",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "green",
        "material": "polyester/viscose",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "sumpgroee-duvet-cover-and-2-pillowcases-multicolour-striped__1359649_pe955155_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sumpgroee-duvet-cover-and-2-pillowcases-multicolour-striped-90587218/"
    },
    {
        "name": "ÄNGSNEJLIKA 엥스네일리카 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "darkblue",
        "material": "cotton/viscose",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "aengsnejlika-duvet-cover-and-2-pillowcases-dark-blue-light-blue__1317984_pe940785_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/aengsnejlika-duvet-cover-and-2-pillowcases-dark-blue-light-blue-50585339/"
    },
    {
        "name": "BREDVECKLARE 브레드베클라레 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white",
        "material": "cotton/viscose",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "bredvecklare-duvet-cover-and-2-pillowcases-white-blue-check__1279020_pe931231_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/bredvecklare-duvet-cover-and-2-pillowcases-white-blue-check-90579336/"
    },
    {
        "name": "EKTANDVINGE 엑탄드빙에 이불커버+베개커버2",
        "category": "bedding",
        "style": "modern",
        "dimensions": {
            "length": 240,
            "width": 220
        },
        "colortone": "white/black",
        "material": "cotton",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "ektandvinge-duvet-cover-and-2-pillowcases-anthracite-white-check__1315699_pe940532_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ektandvinge-duvet-cover-and-2-pillowcases-anthracite-white-check-80585390/"
    }
];
const rawMattressList = [
    {
        "name": "BRUMMIG 브룸미그 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "pattern",
        "material": "cotton",
        "price": 12900,
        "brand": "IKEA",
        "jpg_file": "brummig-fitted-sheet-acorn-pattern-multicolour__1056523_pe848371_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/brummig-fitted-sheet-acorn-pattern-multicolour-00521175/"
    },
    {
        "name": "SKOGSDUVA 스콕스두바 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "floral",
        "material": "cotton/viscos",
        "price": 12900,
        "brand": "IKEA",
        "jpg_file": "skogsduva-fitted-sheet-white-yellow-flower-pattern__1294227_pe935368_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/skogsduva-fitted-sheet-white-yellow-flower-pattern-90576795/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-white__0604085_pe681026_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-white-00357170/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "blue",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-blue__1243791_pe920940_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-blue-10575709/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "black",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-black__0604086_pe681027_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-black-80357227/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "beige",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-beige__0683329_pe720997_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-beige-60356568/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "pink",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-light-pink__0683341_pe721009_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-light-pink-10357669/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "lightgrey",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-light-grey__0811765_pe771834_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-light-grey-30482460/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "greygreen",
        "material": "cotton",
        "price": 11900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-grey-green__1138546_pe879990_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-grey-green-30549644/#content"
    },
    {
        "name": "TAGGVALLMO 타그발모 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/polyester",
        "price": 7000,
        "brand": "IKEA",
        "jpg_file": "taggvallmo-fitted-sheet-white__0760436_pe750724_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/taggvallmo-fitted-sheet-white-90459819/"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-white__0604092_pe681032_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-white-40343713/"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "lightbeige",
        "material": "cotton/lyocell",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-light-beige__0661402_pe711747_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-light-beige-90442744/#content"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "darkgrey",
        "material": "cotton/lyocell",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-dark-grey__0668967_pe714788_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-dark-grey-70442684/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 14900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-white__0604096_pe681036_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-white-10342729/"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "deepred",
        "material": "cotton/lyocell",
        "price": 14900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-deep-red__1159040_pe888283_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-deep-red-60558095/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "darkblue",
        "material": "cotton/lyocell",
        "price": 14900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-dark-blue__0604098_pe681037_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-dark-blue-40342775/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "greybeige",
        "material": "cotton/lyocell",
        "price": 14900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-grey-beige__1304564_pe938839_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-grey-beige-90590211/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton/lyocell",
        "price": 14900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-grey__0604097_pe681038_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-grey-40335548/#content"
    },
    {
        "name": "RÖNNVECKMAL 뢴베크말 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 90,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 26900,
        "brand": "IKEA",
        "jpg_file": "roennveckmal-fitted-sheet-white__1086540_pe860498_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/roennveckmal-fitted-sheet-white-60532642/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-white__0604085_pe681026_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-white-00357311/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "blue",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-blue__1243791_pe920940_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-blue-20576869/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "black",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-black__0604086_pe681027_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-black-90396780/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "beige",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-beige__0683329_pe720997_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-beige-50396782/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "pink",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-light-pink__0683341_pe721009_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-light-pink-10396779/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "lightgrey",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-light-grey__0811765_pe771834_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-light-grey-40482445/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "greygreen",
        "material": "cotton",
        "price": 13900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-grey-green__1138546_pe879990_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-grey-green-60549628/#content"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "darkgrey",
        "material": "cotton/lyocell",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-dark-grey__0668967_pe714788_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-dark-grey-00442668/"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "lightbeige",
        "material": "cotton/lyocell",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-light-beige__0661402_pe711747_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-light-beige-20442728/#content"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-white__0604092_pe681032_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-white-30547602/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-white__0604096_pe681036_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-white-90345347/"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "greybeige",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-grey-beige__1304564_pe938839_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-grey-beige-60590203/#content"
    },
    {
        "name": "BRUDBORSTE 브루드보르스테 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "grey",
        "material": "nylon",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "brudborste-fitted-sheet-grey__0932913_pe791667_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/brudborste-fitted-sheet-grey-40491987/"
    },
    {
        "name": "RÖNNVECKMAL 뢴베크말 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "roennveckmal-fitted-sheet-white__1086540_pe860498_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/roennveckmal-fitted-sheet-white-10532625/"
    },
    {
        "name": "BALSAMPOPPEL 발삼포펠 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 120,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "balsampoppel-fitted-sheet-white__1158966_pe888245_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/balsampoppel-fitted-sheet-white-80557537/"
    },
    {
        "name": "BRUDBORSTE 브루드보르스테 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "brudborste-fitted-sheet-grey__0932913_pe791667_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/brudborste-fitted-sheet-grey-60491608/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-white__0604085_pe681026_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-white-50357219/"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "blue",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-blue__1243791_pe920940_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-blue-40575703/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "black",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-black__0604086_pe681027_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-black-70357275/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "beige",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-beige__0683329_pe720997_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-beige-70357162/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "pink",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-light-pink__0683341_pe721009_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-light-pink-80357661/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-light-grey__0811765_pe771834_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-light-grey-60482449/#content"
    },
    {
        "name": "DVALA 드발라 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "greygreen",
        "material": "cotton",
        "price": 23900,
        "brand": "IKEA",
        "jpg_file": "dvala-fitted-sheet-grey-green__1138546_pe879990_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dvala-fitted-sheet-grey-green-80549632/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-white__0604096_pe681036_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-white-40342723/"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "grey",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-grey__0604097_pe681038_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-grey-50336953/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "greybeige",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-grey-beige__1304564_pe938839_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-grey-beige-60590203/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "deepred",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-deep-red__1159040_pe888283_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-deep-red-00558084/#content"
    },
    {
        "name": "ULLVIDE 울비데 매트리스커버",
        "category": "mattresscover",
        "style": "natural",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "darkblue",
        "material": "cotton/lyocell",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ullvide-fitted-sheet-dark-blue__0604098_pe681037_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ullvide-fitted-sheet-dark-blue-70342769/#content"
    },
    {
        "name": "FÄRGMÅRA 페리모라 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton",
        "price": 14900,
        "brand": "IKEA",
        "jpg_file": "faergmara-fitted-sheet-white__0604089_pe681028_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/faergmara-fitted-sheet-white-40347725/"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "white",
        "material": "cotton/lyocell",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-white__0604092_pe681032_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-white-80343706/"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "cozy",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "lightbeige",
        "material": "cotton/lyocell",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-light-beige__0661402_pe711747_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-light-beige-20442733/#content"
    },
    {
        "name": "NATTJASMIN 나티아스민 매트리스커버",
        "category": "mattresscover",
        "style": "modern",
        "dimensions": {
            "length": 150,
            "width": 200
        },
        "colortone": "darkgrey",
        "material": "cotton/lyocell",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "nattjasmin-fitted-sheet-dark-grey__0668967_pe714788_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/nattjasmin-fitted-sheet-dark-grey-00442673/#content"
    }
];
const rawCurtainList = 
[
    {
        "name": "HILJA 힐리아 커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "dimming",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "hilja-curtains-1-pair-white-with-heading-tape__0627420_pe693352_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/hilja-curtains-1-pair-white-with-heading-tape-70430817/"
    },
    {
        "name": "TIMJANSMOTT 티미안스모트 커튼한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "floral",
        "opaqueness": "dimming",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "timjansmott-curtains-1-pair-white-floral-pattern__1189139_pe899681_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/timjansmott-curtains-1-pair-white-floral-pattern-80565735/"
    },
    {
        "name": "GINSTMOTT 인스트모트 커튼한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "beige",
        "opaqueness": "dimming",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "ginstmott-curtains-1-pair-beige-with-heading-tape__1308585_pe939896_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/ginstmott-curtains-1-pair-beige-with-heading-tape-60597172/"
    },
    {
        "name": "ALVINE SPETS 알비네 스펫스 망사커튼 한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "sheer",
        "price": 9900,
        "brand": "IKEA",
        "jpg_file": "alvine-spets-net-curtains-1-pair-off-white-with-rod-pocket__0099780_pe242082_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/alvine-spets-net-curtains-1-pair-off-white-with-rod-pocket-40171863/"
    },
    {
        "name": "DYTÅG 뒤토그 커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "dimming",
        "price": 71900,
        "brand": "IKEA",
        "jpg_file": "dytag-curtains-1-pair-white-with-heading-tape__0803894_pe769366_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/dytag-curtains-1-pair-white-with-heading-tape-60466717/"
    },
    {
        "name": "TERESIA 테레시아 속커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "dimming",
        "price": 9900,
        "brand": "IKEA",
        "jpg_file": "teresia-sheer-curtains-1-pair-white-with-rod-pocket__0598868_pe677881_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/teresia-sheer-curtains-1-pair-white-with-rod-pocket-70232332/"
    },
    {
        "name": "VILDPERSILJA 빌드페르실리아 커튼한쌍",
        "category": "curtain",
        "style": "natural",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "floral",
        "opaqueness": "dimming",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "vildpersilja-curtains-1-pair-white-multicolour-floral-pattern-with-heading-tape__1250550_pe923830_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/vildpersilja-curtains-1-pair-white-multicolour-floral-pattern-with-heading-tape-70583400/"
    },
    {
        "name": "HANNALILL 한날릴 커튼한쌍",
        "category": "curtain",
        "style": "natural",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "lightolivegreen",
        "opaqueness": "dimming",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "hannalill-curtains-1-pair-light-olive-green__0949985_pe801237_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/hannalill-curtains-1-pair-light-olive-green-30498461/"
    },
    {
        "name": "STENFRÖ 스텐프뢰 속커튼 한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "pink",
        "opaqueness": "sheer",
        "price": 19900,
        "brand": "IKEA",
        "jpg_file": "stenfroe-sheer-curtains-1-pair-pink-with-heading-tape__1302962_pe938163_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/stenfroe-sheer-curtains-1-pair-pink-with-heading-tape-40594891/"
    },
    {
        "name": "STOCKHOLM 2025 스톡홀름 2025 커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white/black",
        "opaqueness": "dimming",
        "price": 129000,
        "brand": "IKEA",
        "jpg_file": "stockholm-2025-curtains-1-pair-white-black-with-heading-tape__1341405_pe948740_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/stockholm-2025-curtains-1-pair-white-black-with-heading-tape-80601093/"
    },
    {
        "name": "SILVERLÖNN 실벨뢴 속커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "sheer",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "silverloenn-sheer-curtains-1-pair-white-with-heading-tape__0913763_pe783726_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/silverloenn-sheer-curtains-1-pair-white-with-heading-tape-40491039/"
    },
    {
        "name": "MÄSTERROT 메스테로트 커튼한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "beige",
        "opaqueness": "dimming",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "maesterrot-curtains-1-pair-beige-white-dot-pattern-with-heading-tape__1343159_pe952247_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/maesterrot-curtains-1-pair-beige-white-dot-pattern-with-heading-tape-20602566/"
    },
    {
        "name": "MATILDA 마틸다 커튼한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "sheer",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "matilda-sheer-curtains-1-pair-white-with-tab-top__0099832_pe242224_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/matilda-sheer-curtains-1-pair-white-with-tab-top-20172203/"
    },
    {
        "name": "MÄSTERROT 메스테로트 커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "dimming",
        "price": 24900,
        "brand": "IKEA",
        "jpg_file": "maesterrot-curtains-1-pair-white-white-grid-with-heading-tape__1343349_pe949564_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/maesterrot-curtains-1-pair-white-white-grid-with-heading-tape-70602564/"
    },
    {
        "name": "MERETE 메레테 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "blackout",
        "price": 44900,
        "brand": "IKEA",
        "jpg_file": "merete-room-darkening-curtains-1-pair-white-with-eyelets__74221_pe190980_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/merete-room-darkening-curtains-1-pair-white-with-eyelets-70172205/"
    },
    {
        "name": "ANNAKAJSA 안나카이사 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "lightgrey",
        "opaqueness": "blackout",
        "price": 69900,
        "brand": "IKEA",
        "jpg_file": "annakajsa-room-darkening-curtains-1-pair-light-grey-with-heading-tape__1250506_pe923787_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/annakajsa-room-darkening-curtains-1-pair-light-grey-with-heading-tape-00583427/"
    },
    {
        "name": "LENDA 렌다 커튼한쌍+장식띠",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "offwhite",
        "opaqueness": "dimming",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "lenda-curtains-with-tie-backs-1-pair-off-white-with-heading-tape__1136111_pe879297_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/lenda-curtains-with-tie-backs-1-pair-off-white-with-heading-tape-90552884/"
    },
    {
        "name": "KORGMOTT 코리모트 암막커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "blackout",
        "price": 69900,
        "brand": "IKEA",
        "jpg_file": "korgmott-block-out-curtains-1-pair-white-with-heading-tape__1308441_pe939841_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/korgmott-block-out-curtains-1-pair-white-with-heading-tape-50597144/"
    },
    {
        "name": "HÄGGVECKMAL 헤그베크말 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "beige",
        "opaqueness": "blackout",
        "price": 69900,
        "brand": "IKEA",
        "jpg_file": "haeggveckmal-room-darkening-curtains-1-pair-beige-with-heading-tape__1218216_pe913167_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/haeggveckmal-room-darkening-curtains-1-pair-beige-with-heading-tape-80569031/"
    },
    {
        "name": "VILBORG 빌보리 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "beige",
        "opaqueness": "blackout",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "vilborg-room-darkening-curtains-1-pair-beige-with-heading-tape__0598849_pe677835_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/vilborg-room-darkening-curtains-1-pair-beige-with-heading-tape-80297554/"
    },
    {
        "name": "MOALISA 모알리사 커튼한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "palepink",
        "opaqueness": "dimming",
        "price": 29900,
        "brand": "IKEA",
        "jpg_file": "moalisa-curtains-1-pair-pale-pink-pink-with-heading-tape__0950015_pe801217_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/moalisa-curtains-1-pair-pale-pink-pink-with-heading-tape-40499506/"
    },
    {
        "name": "SANELA 사넬라 커튼한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "lightbeige",
        "opaqueness": "dimming",
        "price": 79900,
        "brand": "IKEA",
        "jpg_file": "sanela-curtains-1-pair-light-beige-with-heading-tape__1280039_pe931640_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sanela-curtains-1-pair-light-beige-with-heading-tape-00589877/"
    },
    {
        "name": "MAJGULL 마이굴 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "lightgrey",
        "opaqueness": "blackout",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "majgull-room-darkening-curtains-1-pair-light-grey-with-heading-tape__0598870_pe677879_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/majgull-room-darkening-curtains-1-pair-light-grey-with-heading-tape-10346751/"
    },
    {
        "name": "TIBAST 티바스트 커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "dimming",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "tibast-curtains-1-pair-white-with-heading-tape__0550099_pe658042_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/tibast-curtains-1-pair-white-with-heading-tape-30396759/"
    },
    {
        "name": "ROSENROBINIA 로센로비니아 속커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white",
        "opaqueness": "sheer",
        "price": 34900,
        "brand": "IKEA",
        "jpg_file": "tibast-curtains-1-pair-white-with-heading-tape__0550099_pe658042_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/rosenrobinia-sheer-curtains-1-pair-white-with-heading-tape-90556330/"
    },
    {
        "name": "LÖNNSTÄVMAL 뢴스테브말 암막커튼 한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "beige",
        "opaqueness": "blackout",
        "price": 89900,
        "brand": "IKEA",
        "jpg_file": "loennstaevmal-block-out-curtains-1-pair-beige-with-heading-tape__1166547_pe891165_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/loennstaevmal-block-out-curtains-1-pair-beige-with-heading-tape-00556377/"
    },
    {
        "name": "TIBAST 티바스트 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "darkred",
        "opaqueness": "blackout",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "tibast-room-darkening-curtains-1-pair-dark-red-with-heading-tape__0803922_pe769343_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/tibast-room-darkening-curtains-1-pair-dark-red-with-heading-tape-70466665/"
    },
    {
        "name": "FJÄDERMOTT 피에데르모트 커튼한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "white/grey",
        "opaqueness": "dimming",
        "price": 39900,
        "brand": "IKEA",
        "jpg_file": "fjaedermott-curtains-1-pair-white-grey-with-heading-tape__0973000_pe811853_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/fjaedermott-curtains-1-pair-white-grey-with-heading-tape-40504584/"
    },
    {
        "name": "HÄLLEBRÄCKA 헬레브레카 속커튼 한쌍",
        "category": "curtain",
        "style": "cozy",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "lightbeige",
        "opaqueness": "sheer",
        "price": 44900,
        "brand": "IKEA",
        "jpg_file": "haellebraecka-sheer-curtains-1-pair-with-heading-tape-light-beige__1196904_pe906599_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/haellebraecka-sheer-curtains-1-pair-with-heading-tape-light-beige-90559673/"
    },
    {
        "name": "MAJGULL 마이굴 암막커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "grey",
        "opaqueness": "blackout",
        "price": 49900,
        "brand": "IKEA",
        "jpg_file": "majgull-block-out-curtains-1-pair-grey-with-heading-tape__0597001_pe676987_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/majgull-block-out-curtains-1-pair-grey-with-heading-tape-10417814/"
    },
    {
        "name": "BLÅHUVA 블로후바 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "lightgrey",
        "opaqueness": "blackout",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "blahuva-room-darkening-curtains-1-pair-light-grey__0774620_pe756694_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/blahuva-room-darkening-curtains-1-pair-light-grey-10465452/"
    },
    {
        "name": "SANELA 사넬라 반암막 커튼 한쌍",
        "category": "curtain",
        "style": "natural",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "greygreen",
        "opaqueness": "blackout",
        "price": 79900,
        "brand": "IKEA",
        "jpg_file": "sanela-room-darkening-curtains-1-pair-grey-green__0999849_pe823824_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/sanela-room-darkening-curtains-1-pair-grey-green-50512951/"
    },
    {
        "name": "BLÅHUVA 블로후바 암막 커튼 한쌍",
        "category": "curtain",
        "style": "modern",
        "dimensions": {
            "length": 145,
            "width": 250
        },
        "colortone": "darkgrey",
        "opaqueness": "blackout",
        "price": 59900,
        "brand": "IKEA",
        "jpg_file": "blahuva-block-out-curtains-1-pair-dark-grey__0774601_pe756679_s5.jpg",
        "url": "https://www.ikea.com/kr/ko/p/blahuva-block-out-curtains-1-pair-dark-grey-90465467/"
    }
]
;

// --- 가구 및 데코 아이템 클래스 정의 ---
const furnitureDb = rawFurnitureDb.map(item => new FurnitureItem(item));
const beddingList = rawBeddingList.map(item => new BeddingItem(item));
const mattressList = rawMattressList.map(item => new MattressItem(item));
const curtainList = rawCurtainList.map(item => new CurtainItem(item));

// 사용자가 1, 2, 3, 4 순으로 순위를 부여하면 이를 바탕으로 가중치를 부여
function convertRanksToWeights(rankObj) {
  const baseWeight = 0.1;
  const bonusMap = {
    1: 0.24,
    2: 0.18,
    3: 0.12,
    4: 0.06
  };

  const weightMap = {};
  const keys = ["style", "colortone", "size", "price"];

  keys.forEach(key => {
    const rank = rankObj[key];
    weightMap[key] = baseWeight + (bonusMap[rank] ?? 0);
  });

  // target_style은 그대로 복사
  weightMap["target_style"] = rankObj["target_style"];
  weightMap["desiredCategories"] = rankObj["desiredCategories"]; // 가구 카테고리 선택을 위해 추가된 항목
  return weightMap;
}

// --- 기본 사용자 입력 (순위), 스타일, 원하는 가구 카테고리 ---
const userPreferenceRank = {
  style: 1,
  colortone: 2,
  size: 3,
  price: 4,
  target_style: "cozy", // modern, natural, cozy, donknow
  desiredCategories: ["desk", "bed"] // bed, bookshelf, desk, closet 중 사용자가 선택한 원하는 가구 카테고리. 순서무관.
};

// --- 사용자 입력 (예산, 배치 가능 폭, 포인트 컬러) ---
const budget = 800000;       // 예산 80만 원
const perimeter = 400;       // 배치 가능 폭 400cm
const pointColor = "beige"; // 포인트 컬러 black, white, grey, beige, brown, red, orange, yellow, green, blue, purple, pink

const userWeights = convertRanksToWeights(userPreferenceRank);

/*
// 가공된 후에는 아래와 같이 변경됨
const userWeights = {
  style: 0.3,
  colortone: 0.3,
  size: 0.2,
  price: 0.2,
  target_style: "cozy" // modern, natural, cozy, donknow
};
*/

// --- 추천 실행 ---
const recommended = recommendSets(
  furnitureDb,
  beddingList,
  mattressList,
  curtainList,
  userWeights,
  budget,
  perimeter,
  pointColor
);

// --- 총 가격 계산 함수 ---
function calculateTotalPrice(items) {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (item?.price ?? 0), 0);
}

// --- 결과 출력 ---
recommended.forEach((set, index) => {
  const furniture = set.furnitureSet;
  const deco = set.decorationSet;

  const furniturePrice = calculateTotalPrice(furniture);
  const decoItems = [deco?.bedding, deco?.mattress_cover, deco?.curtain].filter(Boolean);
  const decoPrice = calculateTotalPrice(decoItems);

  console.log(`\n --- 추천 세트 ${index + 1} ---`);
  console.log(`- 가구 가격: ${furniturePrice.toLocaleString()}원`);
  console.log(`- 데코 가격: ${decoPrice.toLocaleString()}원`);

  console.log("\n 가구 세트:");
  furniture.forEach(item => {
    console.log(`- ${item.name} (${item.category}) | 스타일: ${item.style}, 컬러: ${item.colortone}, 가격: ${item.price.toLocaleString()}원`);
    console.log(`  크기: ${item.dimensions.width}mm (가로) × ${item.dimensions.depth}mm (세로)`);
    console.log(`  링크: ${item.url}`);
  });

  if (deco) {
    console.log("\n 데코 세트:");
    if (deco.bedding) {
      console.log(`- 침구: ${deco.bedding.name} | 스타일: ${deco.bedding.style}, 컬러: ${deco.bedding.colortone}, 가격: ${deco.bedding.price.toLocaleString()}원`);
      console.log(`  크기: ${deco.bedding.dimensions.length}mm (가로) × ${deco.bedding.dimensions.width}mm (세로)`);
      console.log(`  링크: ${deco.bedding.url}`);
    }
    if (deco.mattress_cover) {
      console.log(`- 매트리스 커버: ${deco.mattress_cover.name} | 스타일: ${deco.mattress_cover.style}, 컬러: ${deco.mattress_cover.colortone}, 가격: ${deco.mattress_cover.price.toLocaleString()}원`);
      console.log(`  크기: ${deco.mattress_cover.dimensions.length}mm (가로) × ${deco.mattress_cover.dimensions.width}mm (세로)`);
      console.log(`  링크: ${deco.mattress_cover.url}`);
    }
    if (deco.curtain) {
      console.log(`- 커튼: ${deco.curtain.name} | 스타일: ${deco.curtain.style}, 컬러: ${deco.curtain.colortone}, 가격: ${deco.curtain.price.toLocaleString()}원`);
      console.log(`  크기: ${deco.curtain.dimensions.length}mm (가로) × ${deco.curtain.dimensions.width}mm (세로)`);
      console.log(`  링크: ${deco.curtain.url}`);
    }
  } else {
    console.log("\n 데코 세트를 찾을 수 없습니다.");
  }
});
