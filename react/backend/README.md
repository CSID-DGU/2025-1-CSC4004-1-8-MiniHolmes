<div align="center">

### 백엔드 알고리즘 🖍️

[<img src="https://img.shields.io/badge/-readme.md-important?style=flat&logo=google-chrome&logoColor=white" />]
<br/> [<img src="https://img.shields.io/badge/프로젝트 기간-2025.03.18~2025.06.16-fab2ac?style=flat&logo=&logoColor=white" />]()

</div> 

## 📝 소개

본 프로젝트인 '미니홈즈'의 node.js 백엔드입니다.

<br />

### 알고리즘 구성

|:---:|
|<img src="https://user-images.githubusercontent.com/80824750/208456048-acbf44a8-cd71-4132-b35a-500047adbe1c.gif" width="450"/>|
|화면에 대한 설명을 입력합니다.|


## 가구 추천 알고리즘
<br />

### 사용자의 입력을 받아 가중치 계산을 기반으로 추천을 진행함.

const userPreferenceRank = {

  style: 1, // 사용자 순위 설정
  
  colortone: 2,
  
  size: 3,
  
  price: 4,
  
  target_style: "cozy", // modern, natural, cozy, donknow 중 선택

  target_colortone: "light" //light, medium, dark
  
  desiredCategories: ["closet", "desk", "bookshelf"] // bed, closet, desk, bookshelf 중 사용자가 선택한 원하는 가구 카테고리. 순서무관.
  
};

// --- 사용자 입력 (예산, 배치 가능 폭, 포인트 컬러) ---

const budget = 800000;      // 예산 

const perimeter = 400;       // 배치 가능 폭 400cm

const pointColor = "beige"; // 포인트 컬러 black, white, grey, beige, brown, red, orange, yellow, green, blue, purple, pink

<br />
### <프로그램 구성>
1. 가격 및 사이즈에 따라 데이터베이스 구성 ex) 각 가격/크기 범위마다 등급 부여. 침대는 70~100 1등급, 50~70 2등급, 35~50 3등급, 25~35 4등급, 15~25 5등급(단위 만원)
2. 사용자가 입력한 순위에 따라 가중치 계산
3. 스타일, 컬러톤, 가격, 크기를 가중치와 함께 고려하여 선택
4. 가구별 정렬된 상태에서 1순위 품목 하나씩 선택 → 가로값 합이 둘레 * 3/4 넘는지 확인
    1. 넘을 경우 : 가장 크기 등급이 높은 가구 종류의 가구를 선택 변경, 넘지 않을 때까지 3 반복.
    2. 넘지 않을 경우 : 다음 단계(4) 진행
5. 선택된 가구들이 가격대 조건을 만족하는지 확인
    1. 만족하지 않는 경우 : 가장 가격 등급이 높은 가구를 선택 변경, 만족할 때까지 4 반복.
    2. 넘지 않을 경우 : 다음 단계(5) 진행
6. 4, 5 를 동시 만족해야 루프 통과, 일정 이상 반복해도 조건 만족하지 않을 경우 return
6. 3-4 과정을 통해 선택된 가구들 저장 및 추천 후보에서 제외 후 다시 3-4 진행. 전체 과정(2~4)을 총 3회 진행함.
7. 진행 후에는 총 3가지의 가구 추천 조합이 생성됨.

### 프로그램 출력 결과
가구 추천 세트 3개(데코 3종 포함, 침대 선택되지 않았을 경우 미포함), 가격, 링크 정보

<br />

### 일부 문제점
1. 가구 크기 초과 / 예산 초과 시 가장 작은/싼 것부터 대체추천하는 과정에서 해당 가구의 적합성이 낮아짐
2. 가구 DB의 가격대가 높고 크기가 커서 예산이 작거나(80만원 이하) 방이 작을 경우(둘래 약 650cm) 그에 맞는 추천이 어려움.






## 배치 알고리즘
| 구조도 | 설명 |
|:------:|:----:|
|<img src="https://github.com/user-attachments/assets/3ff445c8-ae09-4bc0-b339-0f8fc80ce73b" width="450"/>|가구 배치 알고리즘 구조도입니다.|
|<img src="https://github.com/user-attachments/assets/60344c7f-62d8-4896-93c5-ca35e2fda9b1" width="450"/>|배치 알고리즘에 사용되는 코드들 구조도입니다.|
|<img src="https://github.com/user-attachments/assets/a5ea0b3e-6cff-4312-a408-7a00ba3be012" width="450"/>|각 place함수들의 알고리즘 구조도입니다.|




<br />

## ⚙ 기술 스택
> 사용한 기술 스택들입니다.
### back-end
<div>
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/JavaScript.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/NodeJS.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/ExpressJS.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/MongoDB.png?raw=true" width="80">
</div>

### Tools
<div>
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/Github.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/Notion.png?raw=true" width="80">
</div>

<br />

## 🤔 기술적 이슈와 해결 과정
- 가구 배치 데이터셋의 부족
    - 사용자가 입력한 방의 정보와 가구 배치를 x,y 좌표와 추천된 가구의 가로,세로를 이용하여 추천하는 방식으로 수정.
 
- 배치 알고리즘과 Three.js 시각화 좌표계 이슈
    - 배치 알고리즘의 추천된 결과를 바탕으로 수학적 계산을 통해 추천된 결과의 좌표계를 Three.js에 맞게 변환 시킴으로써 해결

- 배치된 가구의 모호성
    - 가구를 배치 시 가중치를 기반으로 원칙을 정하여 각 원칙에 부합하면 가중치를 부여하는데 각 가중치가 추가될 때 원칙과 이유를 알려주는 reasons 배열을 만들어
      해당 배열에 삽입하여 전달함으로써 사용자들에게 직관적이고 교육적인 배치정보 전달 가능하게 설계.


<br />

