# [설명]
# 이 파일은 백엔드에서 실행되는 가구 배치 알고리즘(Python, 프로토타입 버전)입니다.
# 추천된 가구 목록과 방 크기를 입력받아, 각 가구의 2D 위치/회전 정보를 계산해 반환합니다.
# 실제 서비스용 배치 로직은 추후 별도 구현/병합 예정입니다.

from typing import Dict, List, Any, Tuple
import json
import sys
import logging
import random
from dataclasses import dataclass

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Position:
    x: float
    y: float
    width: float
    height: float
    is_horizontal: bool = False

@dataclass
class Furniture:
    type: str
    x: float
    y: float
    width: float
    height: float
    is_horizontal: bool = False

def is_within_room_bounds(x: float, y: float, width: float, height: float, room_width: float, room_height: float) -> bool:
    """가구가 방의 경계 내에 있는지 확인 (벽과의 간격 고려)"""
    MARGIN = 5  # 벽과의 최소 간격 (cm)
    return (x >= MARGIN and 
            y >= MARGIN and 
            x + width <= room_width - MARGIN and 
            y + height <= room_height - MARGIN)

def is_overlapping(a: Furniture, b: Furniture) -> bool:
    return not (
        a.x + a.width <= b.x or
        b.x + b.width <= a.x or
        a.y + a.height <= b.y or
        b.y + b.height <= a.y
    )

def get_wall_tightness_score(pos: Position, room_width: float, room_height: float) -> int:
    score = 0
    if pos.x == 0 or pos.x + pos.width == room_width:
        score += 1
    if pos.y == 0 or pos.y + pos.height == room_height:
        score += 1
    return score

def find_available_walls(elements: List[Furniture], room_width: float, room_height: float) -> List[str]:
    window_walls = []
    for el in elements:
        if el.type == "window":
            if el.y == 0:
                window_walls.append("top")
            elif el.x == 0:
                window_walls.append("left")
            elif el.x + el.width == room_width:
                window_walls.append("right")
            elif el.y + el.height == room_height:
                window_walls.append("bottom")
    return [w for w in ["top", "bottom", "left", "right"] if w not in window_walls]

def generate_wall_positions(furniture: Dict[str, Any], room_width: float, room_height: float, step: int = 10) -> List[Position]:
    positions = []
    walls = ["top", "bottom", "left", "right"]
    width = furniture["dimensions"]["width"]
    height = furniture["dimensions"]["height"]

    # 벽과의 최소 간격 (cm)
    WALL_MARGIN = 5

    for wall in walls:
        for is_horizontal in [False, True]:
            w = height if is_horizontal else width
            h = width if is_horizontal else height

            # 방의 경계를 벗어나지 않도록 조정 (벽과의 간격 고려)
            if wall == "bottom":
                y = room_height - h - WALL_MARGIN
                for x in range(WALL_MARGIN, int(room_width - w - WALL_MARGIN), step):
                    if is_within_room_bounds(x, y, w, h, room_width, room_height):
                        positions.append(Position(x, y, w, h, is_horizontal))
            elif wall == "top":
                y = WALL_MARGIN
                for x in range(WALL_MARGIN, int(room_width - w - WALL_MARGIN), step):
                    if is_within_room_bounds(x, y, w, h, room_width, room_height):
                        positions.append(Position(x, y, w, h, is_horizontal))
            elif wall == "left":
                x = WALL_MARGIN
                for y in range(WALL_MARGIN, int(room_height - h - WALL_MARGIN), step):
                    if is_within_room_bounds(x, y, w, h, room_width, room_height):
                        positions.append(Position(x, y, w, h, is_horizontal))
            elif wall == "right":
                x = room_width - w - WALL_MARGIN
                for y in range(WALL_MARGIN, int(room_height - h - WALL_MARGIN), step):
                    if is_within_room_bounds(x, y, w, h, room_width, room_height):
                        positions.append(Position(x, y, w, h, is_horizontal))

    return positions

def filter_valid_positions(positions: List[Position], elements: List[Furniture], furniture: Dict[str, Any], room_width: float, room_height: float) -> List[Position]:
    valid = []
    for pos in positions:
        width = furniture["dimensions"]["height"] if pos.is_horizontal else furniture["dimensions"]["width"]
        height = furniture["dimensions"]["width"] if pos.is_horizontal else furniture["dimensions"]["height"]

        # 방의 경계 체크
        if not is_within_room_bounds(pos.x, pos.y, width, height, room_width, room_height):
            continue

        trial = Furniture(
            type=furniture["category"],
            x=pos.x,
            y=pos.y,
            width=width,
            height=height,
            is_horizontal=pos.is_horizontal
        )

        overlaps = any(is_overlapping(trial, el) for el in elements if el.type != "room")
        if not overlaps:
            valid.append(pos)

    return valid

def select_random_from_best_scored(positions: List[Position], room_width: float, room_height: float) -> Position:
    if not positions:
        return None

    scored = [(p, get_wall_tightness_score(p, room_width, room_height)) for p in positions]
    max_score = max(score for _, score in scored)
    top_candidates = [p for p, score in scored if score == max_score]
    return random.choice(top_candidates)

def check_overlaps(placed_furniture):
    overlaps = []
    for i in range(len(placed_furniture)):
        a = placed_furniture[i]
        for j in range(i+1, len(placed_furniture)):
            b = placed_furniture[j]
            # 2D 겹침 체크
            if not (
                a['position']['x'] + a['width'] <= b['position']['x'] or
                b['position']['x'] + b['width'] <= a['position']['x'] or
                a['position']['y'] + a['height'] <= b['position']['y'] or
                b['position']['y'] + b['height'] <= a['position']['y']
            ):
                overlaps.append((a['_id'], b['_id']))
    return overlaps

def place_furniture(furniture_list: List[Dict[str, Any]], room_width: float, room_height: float) -> List[Dict[str, Any]]:
    elements = [Furniture(type="room", x=0, y=0, width=room_width, height=room_height)]
    placed_furniture = []
    placement_order = ["bed", "wardrobe", "desk", "bookshelf"]
    furniture_by_category = {category: [] for category in placement_order}
    
    # 가구 분류
    for item in furniture_list:
        if item["category"] in furniture_by_category:
            furniture_by_category[item["category"].lower()].append(item)
    
    # 각 카테고리별로 랜덤하게 가구 선택
    for category in placement_order:
        if not furniture_by_category[category]:
            continue
            
        # 해당 카테고리의 가구 중 랜덤하게 하나 선택
        furniture = random.choice(furniture_by_category[category])
        
        positions = generate_wall_positions(furniture, room_width, room_height)
        valid_positions = filter_valid_positions(positions, elements, furniture, room_width, room_height)
        
        if not valid_positions:
            logger.warning(f"{category} 카테고리의 가구를 배치할 수 있는 유효한 위치가 없습니다.")
            continue
            
        chosen_position = select_random_from_best_scored(valid_positions, room_width, room_height)
        
        if chosen_position:
            width = furniture["dimensions"]["height"] if chosen_position.is_horizontal else furniture["dimensions"]["width"]
            height = furniture["dimensions"]["width"] if chosen_position.is_horizontal else furniture["dimensions"]["height"]
            
            # 최종 위치가 방의 경계 내에 있는지 한 번 더 확인
            if not is_within_room_bounds(chosen_position.x, chosen_position.y, width, height, room_width, room_height):
                logger.warning(f"{category} 가구가 방의 경계를 벗어났습니다. 배치를 건너뜁니다.")
                continue
            
            placed = Furniture(
                type=category,
                x=chosen_position.x,
                y=chosen_position.y,
                width=width,
                height=height,
                is_horizontal=chosen_position.is_horizontal
            )
            elements.append(placed)
            placed_furniture.append({
                "_id": furniture["_id"],
                "position": {
                    "x": chosen_position.x,
                    "y": chosen_position.y,
                    "z": 0
                },
                "width": width,
                "height": height,
                "rotation": {
                    "x": 0,
                    "y": 0 if not chosen_position.is_horizontal else 1.57,
                    "z": 0
                }
            })
    
    # 겹침 체크
    overlaps = check_overlaps(placed_furniture)
    if overlaps:
        logger.warning(f"겹치는 가구 쌍이 있습니다: {overlaps}")
    else:
        logger.info("겹치는 가구 없음.")
    
    # 배치 결과 상세 로그
    for item in placed_furniture:
        logger.info(
            f"배치결과: id={item['_id']}, x={item['position']['x']}, y={item['position']['y']}, "
            f"width={item['width']}, height={item['height']}, rot_y={item['rotation']['y']}"
        )
    
    return placed_furniture

def main():
    try:
        # 표준 입력에서 JSON 데이터 읽기
        input_data = json.loads(sys.stdin.read())
        
        # 입력 데이터 파싱
        furniture_list = input_data["furniture_list"]
        room_width = input_data["room_width"]
        room_height = input_data["room_height"]
        
        logger.info(f"\n=== 가구 배치 시작 ===")
        logger.info(f"방 크기: {room_width}x{room_height}")
        logger.info(f"배치할 가구 수: {len(furniture_list)}")
        
        # 가구 배치 실행
        placed_furniture = place_furniture(furniture_list, room_width, room_height)
        
        # 결과를 JSON 형식으로 변환
        result = {
            "placements": placed_furniture
        }
        
        # JSON 출력
        print(json.dumps(result))
        
    except Exception as e:
        logger.error(f"가구 배치 중 오류 발생: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main() 