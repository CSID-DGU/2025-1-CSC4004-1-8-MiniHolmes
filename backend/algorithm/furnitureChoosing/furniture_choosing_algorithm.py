# [설명]
# 이 파일은 백엔드에서 실행되는 가구 추천 알고리즘(Python)입니다.
# 프론트엔드/서버에서 API로 호출되며, 사용자 선호도/예산/방 크기 등을 입력받아
# 최적의 가구 조합을 추천하는 로직이 구현되어 있습니다.

import os
from typing import Dict, List, Any
import json
import sys
import logging

# [로깅 환경 분기] 개발 환경 또는 LOG_LEVEL/DEBUG 환경변수에 따라 로깅 레벨 결정
log_level = logging.ERROR
if os.environ.get('LOG_LEVEL', '').lower() == 'debug' or \
   os.environ.get('DEBUG', '').lower() == '1' or \
   os.environ.get('NODE_ENV', '').lower() == 'development':
    log_level = logging.INFO

logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger(__name__)

# 데이터 구조 설계
class FurnitureItem:
    def __init__(self, data: Dict[str, Any]):
        self._id = data.get("_id")  # [변경] MongoDB의 _id 사용, 없으면 None. 원본은 uuid 혼용
        self.name = data["name"]
        self.category = data["category"]
        self.style = data.get("style")  # [변경] 선택적 필드로 처리 (원본은 필수)
        self.dimensions = data["dimensions"]
        self.colortone = data.get("colortone")  # [변경] 선택적 필드로 처리
        self.price = data.get("price")  # [변경] 선택적 필드로 처리
        self.brand = data.get("brand")  # [변경] 선택적 필드로 처리
        self.glb_file = data["glb_file"]
        self.url = data.get("url")  # [변경] 선택적 필드로 처리

    def to_dict(self) -> Dict[str, Any]:
        # [추가] JSON 변환용 메서드. API 응답/저장에 활용
        return {
            "_id": str(self._id),
            "name": self.name,
            "category": self.category,
            "style": self.style,
            "dimensions": self.dimensions,
            "colortone": self.colortone,
            "price": self.price,
            "brand": self.brand,
            "glb_file": self.glb_file,
            "url": self.url
        }

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
        if self.price is None:
            return 5  # [추가] 가격 정보가 없는 경우 기본값 반환
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
# [동일] 추천 세트 3개 생성
# [변경] available_items에서 선택된 가구를 제외하는 방식 유지

def recommend_sets(furniture_db: List[FurnitureItem], user_weights: Dict[str, float], max_budget: int, perimeter: float) -> List[List[FurnitureItem]]:
    recommended_sets = []
    available_items = furniture_db.copy() # available_items 는 furniture_db 의 복사본으로 시작(몇몇 가구를 진행 과정에서 제외하기 위함)

    for _ in range(3):  # 3회 반복
        selected = select_items(available_items, user_weights, max_budget, perimeter) # 가구 선택 함수 실행, selected 생성
        recommended_sets.append(selected) #recommended_sets 에 선택된 가구 추가
        for item in selected:
            available_items.remove(item)  # 선택한 가구는 available_items 에서 제외

    return recommended_sets # 추천된 가구 세트 리스트 3개 반환

# 가구 선택 함수
# [변경] 점수 계산 및 로깅 추가, 선택/교체 이유 기록

def select_items(furniture_db: List[FurnitureItem], weights: Dict[str, float], budget: int, perimeter: float) -> List[FurnitureItem]:
    categories = ["bed", "closet", "desk", "bookshelf"]
    selected_items = []
    selection_reasons = []  # [추가] 선택 이유 기록

    for category in categories:
        candidates = [f for f in furniture_db if f.category == category]
        if not candidates:
            logger.warning(f"{category} 카테고리의 가구를 찾을 수 없습니다.")
            continue
        # [변경] 점수 계산 및 상세 로깅
        scored_candidates = []
        for candidate in candidates:
            style_score = weights["style"] * (1.0 if candidate.style == weights["target_style"] else 0.0)
            color_score = weights["colortone"] * (1.0 if candidate.colortone == weights["target_colortone"] else 0.0)
            size_score = -weights["size"] * candidate.size_grade()
            price_score = -weights["price"] * candidate.price_grade()
            total_score = style_score + color_score + size_score + price_score
            scored_candidates.append((candidate, total_score))
            logger.debug(f"{candidate.name} 점수 분석:")
            logger.debug(f"- 스타일 점수: {style_score:.2f} ({candidate.style} vs {weights['target_style']})")
            logger.debug(f"- 컬러톤 점수: {color_score:.2f} ({candidate.colortone} vs {weights['target_colortone']})")
            logger.debug(f"- 크기 점수: {size_score:.2f} (등급: {candidate.size_grade()})")
            logger.debug(f"- 가격 점수: {price_score:.2f} (등급: {candidate.price_grade()})")
            logger.debug(f"- 총점: {total_score:.2f}")

        # 점수순으로 정렬
        sorted_candidates = sorted(scored_candidates, key=lambda x: x[1], reverse=True)
        selected = sorted_candidates[0][0]
        selected_items.append(selected)
        # [추가] 선택 이유 기록
        reason = f"{category} 선택: {selected.name}\n"
        reason += f"- 스타일: {selected.style} (목표: {weights['target_style']}, {'일치' if selected.style == weights['target_style'] else '불일치'})\n"
        reason += f"- 컬러톤: {selected.colortone} (목표: {weights['target_colortone']}, {'일치' if selected.colortone == weights['target_colortone'] else '불일치'})\n"
        reason += f"- 크기: {selected.dimensions['width']}x{selected.dimensions['depth']}x{selected.dimensions['height']}cm (등급: {selected.size_grade()})\n"
        reason += f"- 가격: {selected.price:,}원 (등급: {selected.price_grade()})" if selected.price is not None else "- 가격: 정보 없음 (등급: 5)"
        selection_reasons.append(reason)
        logger.info(f"\n{reason}")

    # [변경] 크기 조건 검사 및 교체 시 로깅
    while total_width(selected_items) > perimeter * 0.75:
        largest = max(selected_items, key=lambda x: x.size_grade())
        category = largest.category
        alt_candidates = [f for f in furniture_db if f.category == category and f != largest]
        if not alt_candidates:
            logger.warning(f"{category}의 대체 가구를 찾을 수 없습니다.")
            break
        new_item = alt_candidates[0]
        selected_items[selected_items.index(largest)] = new_item
        logger.info(f"\n크기 제한으로 인한 가구 교체:")
        logger.info(f"- 기존: {largest.name} (크기 등급: {largest.size_grade()})")
        logger.info(f"- 교체: {new_item.name} (크기 등급: {new_item.size_grade()})")

    # [변경] 가격 조건 검사 및 교체 시 로깅
    while total_price(selected_items) > budget:
        expensive = max(selected_items, key=lambda x: x.price_grade())
        category = expensive.category
        alt_candidates = [f for f in furniture_db if f.category == category and f != expensive]
        if not alt_candidates:
            logger.warning(f"{category}의 대체 가구를 찾을 수 없습니다.")
            break
        new_item = alt_candidates[0]
        selected_items[selected_items.index(expensive)] = new_item
        logger.info(f"\n예산 초과로 인한 가구 교체:")
        logger.info(f"- 기존: {expensive.name} (가격: {expensive.price:,}원, 등급: {expensive.price_grade()})" if expensive.price is not None else f"- 기존: {expensive.name} (가격: 정보 없음, 등급: 5)")
        logger.info(f"- 교체: {new_item.name} (가격: {new_item.price:,}원, 등급: {new_item.price_grade()})" if new_item.price is not None else f"- 교체: {new_item.name} (가격: 정보 없음, 등급: 5)")

    return selected_items

# 가구의 총 폭과 가격을 계산하는 함수
def total_width(items: List[FurnitureItem]) -> float:
    return sum(item.dimensions["width"] for item in items)

# 가구의 총 가격을 계산하는 함수
def total_price(items: List[FurnitureItem]) -> int:
    return sum(item.price if item.price is not None else 0 for item in items)

# [추가] main 함수: 표준 입력/출력, JSON 입출력, 예외처리, 전체 파이프라인 구현

def main():
    try:
        # 표준 입력에서 JSON 데이터 읽기
        input_data = json.loads(sys.stdin.read())
        # 입력 데이터 파싱
        furniture_db = [FurnitureItem(item) for item in input_data["furniture_db"]]
        user_weights = input_data["user_weights"]
        max_budget = input_data["max_budget"]
        perimeter = input_data["perimeter"]
        logger.info(f"\n=== 가구 추천 시작 ===")
        logger.info(f"예산: {max_budget:,}원")
        logger.info(f"방 둘레: {perimeter}cm")
        logger.info(f"사용자 선호도:")
        logger.info(f"- 스타일: {user_weights['target_style']} (가중치: {user_weights['style']})")
        logger.info(f"- 컬러톤: {user_weights['target_colortone']} (가중치: {user_weights['colortone']})")
        logger.info(f"- 크기: {user_weights['size']}")
        logger.info(f"- 가격: {user_weights['price']}")
        # 가구 추천 실행
        recommended_sets = recommend_sets(furniture_db, user_weights, max_budget, perimeter)
        # 결과 요약
        total_items = sum(len(s) for s in recommended_sets)
        category_counts = {}
        for set_items in recommended_sets:
            for item in set_items:
                category_counts[item.category] = category_counts.get(item.category, 0) + 1
        logger.info(f"\n=== 추천 결과 요약 ===")
        logger.info(f"총 {total_items}개의 가구 추천")
        for category, count in category_counts.items():
            logger.info(f"- {category}: {count}개")
        # 결과를 JSON 형식으로 변환
        result = {
            "recommended_sets": [
                [item.to_dict() for item in set_items]
                for set_items in recommended_sets
            ]
        }
        # JSON 출력
        print(json.dumps(result))
    except Exception as e:
        logger.error(f"가구 추천 중 오류 발생: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
