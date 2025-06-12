# 데이터 구조 설계
class FurnitureItem:
    def __init__(self, data: Dict[str, Any]):
        self.oid = str(uuid.uuid4()) #어떤 DB는 아이디가 있고 어떤 DB는 없어서 확인 필요
        self.name = data["name"]
        self.category = data["category"]
        self.style = data["style"]
        self.dimensions = data["dimensions"]
        self.colortone = data["colortone"]
        self.price = data["price"]
        self.brand = data["brand"]
        self.glb_file = data["glb_file"]
        self.url = data["url"]

        # 가로 길이로 가구의 크기 등급을 계산
    def size_grade(self) -> int:
        width = self.dimensions["width"]
        category = self.category.lower()

        # 가구 카테고리에 따라 크기 등급을 다르게 설정, 1등급으로 갈수록 크기가 큼
        # 침대는 더블, 슈퍼싱글, 싱글 3등급으로 나눔
        if category == "bed":
            if width >= 1350:
                return 1  # 더블
            elif width >= 1100:
                return 2  # 슈퍼싱글
            else:
                return 3  # 싱글
        # 책장은 3단계로 나누고, 책상은 3단계로 나누고, 옷장은 대략적으로 나눔
        elif category == "bookshelf":
            if width >= 80:
                return 1
            elif width >= 60:
                return 2
            else:
                return 3

        elif category == "desk":
            if width >= 160:
                return 1
            elif width >= 140:
                return 2
            else:
                return 3

        elif category == "closet":
            # 옷장은 명확한 기준이 없으므로 대략적으로 나눔
            if width >= 120:
                return 1
            elif width >= 90:
                return 2
            else:
                return 3

        else:
            return 3  # 기본값

    #가격 등급을 계산
    def price_grade(self) -> int:
        price = self.price / 1000  # 천 단위로 변환 (가격은 원 단위)

        category = self.category.lower()

        # 침대는 70~100 1등급, 50~70 2등급, 35~50 3등급, 25~35 4등급, 15~25 5등급 (만원 단위)
        if category == "bed":
            if 700 <= price <= 1000:
                return 1
            elif 500 <= price < 700:
                return 2
            elif 350 <= price < 500:
                return 3
            elif 250 <= price < 350:
                return 4
            elif 150 <= price < 250:
                return 5
            else:
                return 6

        # 책장은 20~30 1등급, 12~20 2등급, 8~12 3등급, 5~8 4등급, 3~5 5등급 (만원 단위)
        elif category == "bookshelf":
            if price >= 20:
                return 1
            elif 12 <= price < 20:
                return 2
            elif 8 <= price < 12:
                return 3
            elif 5 <= price < 8:
                return 4
            elif 3 <= price < 5:
                return 5
            else:
                return 6

        # 책상은 40~50 1등급, 30~40 2등급, 20~30 3등급, 10~20 4등급, 6~10 5등급 (만원 단위)
        elif category == "desk":
            if 40 <= price <= 50:
                return 1
            elif 30 <= price < 40:
                return 2
            elif 20 <= price < 30:
                return 3
            elif 10 <= price < 20:
                return 4
            elif 6 <= price < 10:
                return 5
            else:
                return 6

        # 옷장은 40~50 1등급, 30~40 2등급, 20~30 3등급, 10~20 4등급, 5~10 5등급 (만원 단위)
        elif category == "closet":
            if price >= 40:
                return 1
            elif 30 <= price < 40:
                return 2
            elif 20 <= price < 30:
                return 3
            elif 10 <= price < 20:
                return 4
            else:
                return 5

        else:
            return 5  # 기본값
        
# 추천 메인 함수
def recommend_sets(furniture_db: List[FurnitureItem], user_weights: Dict[str, float], max_budget: int, perimeter: float) -> List[List[FurnitureItem]]:
    # 함수의 입력값은 (가구 DB,                          사용자 선호도,                    예산,             가구 배치 면적)
    recommended_sets = []
    available_items = furniture_db.copy() # available_items 는 furniture_db 의 복사본으로 시작(몇몇 가구를 진행 과정에서 제외하기 위함)

    for _ in range(3):  # 3회 반복
        selected = select_items(available_items, user_weights, max_budget, perimeter) # 가구 선택 함수 실행, selected 생성
        recommended_sets.append(selected) #recommended_sets 에 선택된 가구 추가
        for item in selected:
            available_items.remove(item)  # 선택한 가구는 available_items 에서 제외

    return recommended_sets # 추천된 가구 세트 리스트 3개 반환

""""
def filter_and_sort(furniture_db: List[FurnitureItem], user_style: str, user_colortone: str, max_price_grade: int) -> List[FurnitureItem]:
    filtered = [f for f in furniture_db if f.price_grade() <= max_price_grade]
    # 가격 오름차순
    filtered.sort(key=lambda x: (
        x.price,
        0 if x.style == user_style else 1,
        0 if x.colortone == user_colortone else 1
    ))
    return filtered
    """"

# 가구 선택 함수
def select_items(furniture_db: List[FurnitureItem], weights: Dict[str, float], budget: int, perimeter: float) -> List[FurnitureItem]:
    #함수의 입력값은(가구 DB,                          사용자 선호도,               예산,         가구 배치 면적)
    categories = ["bed", "closet", "desk", "bookshelf"]
    selected_items = []

    for category in categories:
        candidates = [f for f in furniture_db if f.category == category] # 카테고리별 후보군
        if not candidates:
            continue
        sorted_candidates = sorted(candidates, key=lambda f: ( #sorted_candidates 는 후보군을 정렬한 리스트
            # 1을 각 4가지 조건에 따라 소수점으로 나누어 나눠진 가중치에 곱셈 통해 정렬
            weights["style"] * (f.style == weights["target_style"]), # 스타일 가중치, 0~1 사이 값
            weights["colortone"] * (f.colortone == weights["target_colortone"]), # 컬러톤 가중치, 0~1 사이 값
            -weights["size"] * f.size_grade(), # 사이즈 가중치, 0~1 사이 값, 1에 가까울수록 큰 가구 선호, 등급 높아질수록 커지므로 음수로 설정
            -weights["price"] * f.price_grade() # 가격 가중치, 0~1 사이 값, 1에 가까울수록 비싸도 상관없음, 등급 높아질수록 비싸지므로 음수로 설정
        ), reverse=True)

        selected_items.append(sorted_candidates[0])

    # 크기 조건 검사, 전체적인 가구들의 크기가 너무 클 경우 가장 큰 가구를 다음 우선순위 가구로 교체해가며 조건 만족할 때까지 반복
    while total_width(selected_items) > perimeter * 0.75: # 총 폭이 가구 전체 길이의 75%를 넘을 경우 반복문 실행
        largest = max(selected_items, key=lambda x: x.size_grade())  # 선택된 가구들 중 가장 큰 가구 찾기
        category = largest.category # 가장 큰 가구의 카테고리 찾기
        alt_candidates = [f for f in furniture_db if f.category == category and f != largest]
        if not alt_candidates: # 대체 후보가 없으면 반복문 종료
            break
        selected_items[selected_items.index(largest)] = alt_candidates[0] # 가장 큰 가구를 같은 카테고리의 다음 우선순위 후보로 교체

    # 가격 조건 검사, 전체 가격이 예산을 초과할 경우 가장 비싼 가구를 다음 우선순위 가구로 교체해가며 조건 만족할 때까지 반복
    while total_price(selected_items) > budget:
        expensive = max(selected_items, key=lambda x: x.price_grade())
        category = expensive.category
        alt_candidates = [f for f in furniture_db if f.category == category and f != expensive]
        if not alt_candidates:
            break
        selected_items[selected_items.index(expensive)] = alt_candidates[0]

    return selected_items

# 가구의 총 폭과 가격을 계산하는 함수
def total_width(items: List[FurnitureItem]) -> float:
    return sum(item.dimensions["width"] for item in items)

# 가구의 총 가격을 계산하는 함수
def total_price(items: List[FurnitureItem]) -> int:
    return sum(item.price for item in items)
