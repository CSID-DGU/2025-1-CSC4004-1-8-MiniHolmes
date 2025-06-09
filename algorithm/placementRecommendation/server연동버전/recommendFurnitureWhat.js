/*
// 원본이랑 달라진 점
// 1. DB 접근할 때 roomviz DB 하나에서 컬렉션만 바꿔서 씀
//    (원본은 컬렉션마다 DB 따로 썼음)
// 2. mattress 컬렉션명이 mattresscover로 바뀜
// 3. 클래스 생성자에서 oid 처리 방식이 살짝 다름
//    (원본은 _id.$oid, 변경본은 oid 우선)
// 4. cozy 스타일 관련 로직, 주석이 더 추가됨
// 5. 함수/클래스 생성자 파라미터명이 data → item으로 바뀐 것도 있음
*/
console.log("=== Script Started ===");
const crypto = require('crypto');
// 기존 코드와 달라진 부분 : 
// 1. style 에 cozy 추가. 이제 cozy는 natural 가구를 우선 추천하고 데코는 cozy를 우선 추천함
// 2. 모르겠음은 style 에 donknow 입력하면 된다.
// 3. cozy를 natural 로 변환하는 normalizeStyleForFurniture(style) 함수가 추가되어 가구선택함수 selectItems()에서 사용됨
// 4. userPreferenceRank에서 1, 2, 3, 4 순위로 입력된 값을 가중치로 변경해주도록 함.
// MongoDB 연동을 위한 설정
const { MongoClient } = require("mongodb");

async function fetchFromMongo() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db("roomviz"); // 'roomviz' 데이터베이스 사용

    const furnitureDb = await db.collection("furniture").find({}).toArray();
    const beddingList = await db.collection("bedding").find({}).toArray();
    const mattressList = await db.collection("mattresscover").find({}).toArray(); // 'mattresscover'로 변경됨
    const curtainList = await db.collection("curtain").find({}).toArray();

    return { furnitureDb, beddingList, mattressList, curtainList };
  } catch (error) {
    console.error("MongoDB 불러오기 실패:", error);
    return null;
  } finally {
    await client.close();
  }
}

function selectCategory(furnitureDb, userWeights, maxBudget, perimeter) {
  const koreanToEnglish = {
    "침대": "bed",
    "책상": "desk",
    "옷장": "closet",
    "책장": "bookshelf"
  };

  // 🟡 진짜 입력 확인
  const desiredCategoriesKorean = Array.isArray(userWeights.essentialFurniture)
    ? userWeights.essentialFurniture
    : [];


  const desiredCategories = desiredCategoriesKorean
    .map(kor => koreanToEnglish[kor])
    .filter(val => typeof val === "string")
    .map(str => str.toLowerCase().trim());


  // 매칭 여부 로그
  furnitureDb.forEach(item => {
    const raw = item.category;
    const normalized = typeof raw === "string" ? raw.toLowerCase().trim() : "(invalid)";
    const matched = desiredCategories.includes(normalized);
  });

  // 필터링
  let filteredItems = [];
  try {
    filteredItems = furnitureDb.filter(item =>
      typeof item.category === "string" &&
      desiredCategories.includes(item.category.toLowerCase().trim())
    );
  } catch (error) {
    console.error("❌ [selectCategory] 필터링 중 에러 발생:", error);
  }

  return filteredItems;
}


// 가구 클래스 정의(데이터 구조 설계)
class FurnitureItem {
    constructor(item) {
        // console.log(`[FurnitureItem Constructor] Received item: name=${item.name}, _id=${item._id}, oid=${item.oid}`);
        if (!item._id) {
            console.warn(`[FurnitureItem Constructor] Item '${item.name}' (oid: ${item.oid}) is MISSING _id. Full item:`, JSON.stringify(item));
        }
        this._id = item._id; // ObjectId 저장
        this.oid = item.oid || crypto.randomUUID(); // OID 존재 확인, 없으면 생성
        this.name = item.name;
        this.category = item.category;
        this.style = item.style;
        this.dimensions = item.dimensions;
        this.colortone = item.colortone;
        this.price = item.price;
        this.brand = item.brand;
        this.glb_file = item.glb_file;
        this.url = item.url;
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

//가구 선택 함수
function selectItems(furnitureDb, weights, budget, perimeter) {
  
  console.log("[selectItems] DB 항목 샘플:");
    furnitureDb.slice(0, 5).forEach(f => {
    console.log(`- ${f.name}: ${f.category}`);
    });
  
  
  //함수의 입력값은 (가구 DB, 사용자 선호도(가중치), 예산, 가구 배치 면적적)
  const categories = ["bed", "closet", "desk", "bookshelf"];//카테고리별 후보군
  const selectedItems = [];

  for (const category of categories) {
    const candidates = furnitureDb.filter(
  f => f.category?.toLowerCase().trim() === category
);//카테고리별 후보군
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
  console.log("📏 침대 너비:", bedWidth);
  console.log("📚 침구 전체 개수:", beddingList.length);
  // 1. 침대보다 큰 사이즈의 침구 필터링
  let candidates = beddingList.filter(item => {
    return (
      item.dimensions.length >= bedWidth
    );
  });
  console.log("📌 크기 통과 후보:", candidates.map(i => `${i.name} (${i.dimensions.length})`)); 
  if (candidates.length === 0) return null; // 적절한 크기의 침구 없음

  // 2. pointcolor 일치 확인
  const colorMatched = candidates.filter(item =>
    item.colortone?.toLowerCase().includes(pointColor.toLowerCase())
  );

  if (colorMatched.length > 0) {
    candidates = colorMatched;
  }
  console.log("🎨 색상 일치 후보:", colorMatched.map(i => `${i.name} (${i.colortone})`));
  // 3. pointcolor만 일치하는 침구가 하나면 바로 return
  if (candidates.length === 1) {
    return candidates[0];
  }

  // 4. style 일치로 필터링
  const styleMatched = candidates.filter(
    item => item.style === selectedBed.style
  );
  console.log("🎭 스타일 일치 후보:", styleMatched.map(i => `${i.name} (${i.style})`));
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
    const filteredItems = selectCategory(availableItems, userWeights, maxBudget, perimeter);
    const selectedFurniture = selectItems(filteredItems, userWeights, maxBudget, perimeter);

    // 2. 침대 추출
    const selectedBed = selectedFurniture.find(item => item.category === "bed");
    console.log("침대 정보", selectedBed);
    if (!selectedBed) {
      console.warn("선택된 가구 세트에 침대가 없습니다. 데코레이션을 건너뜁니다.");
      recommendedSets.push({ furnitureSet: selectedFurniture, decorationSet: null });
      continue;
    }

    // 3. 데코 추천
    const recommendedBedding = recommendBedding(beddingList, selectedBed, pointColor);
    const recommendedMattressCover = recommendMattressCover(mattressList, selectedBed, pointColor);
    const recommendedCurtain = recommendCurtain(curtainList, pointColor, selectedBed.style);
    console.log("데코레이션 세트",recommendedBedding,recommendedMattressCover,recommendedCurtain);
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
  weightMap["essentialFurniture"] = rankObj["essentialFurniture"]; // 가구 카테고리 선택을 위해 추가된 항목
  return weightMap;
}


// printRecommendationsFromMongo(userPreferenceRank, budget, perimeter, pointColor);

// (async () => {
//   const result = await fetchFromMongo();
//   if (!result) {
//     console.log("❌ MongoDB에서 데이터를 가져오지 못했습니다.");
//     return;
//   }

//   console.log("✅ MongoDB 데이터 불러오기 성공!");

//   console.log(`- furniture: ${result.furnitureDb.length}개`);
//   console.log(`- bedding: ${result.beddingList.length}개`);
//   console.log(`- mattress: ${result.mattressList.length}개`);
//   console.log(`- curtain: ${result.curtainList.length}개`);

//   // 일부 샘플 출력 (각 항목에서 첫 번째만 보기)
//   console.log("\n📦 가구 샘플:", result.furnitureDb[0]);
//   console.log("🛏️ 침구 샘플:", result.beddingList[0]);
//   console.log("🧼 매트리스 샘플:", result.mattressList[0]);
//   console.log("🪟 커튼 샘플:", result.curtainList[0]);
// })();

module.exports = { recommendSets,
  convertRanksToWeights,
  fetchFromMongo,
  FurnitureItem,
  BeddingItem,
  MattressItem,
  CurtainItem };
