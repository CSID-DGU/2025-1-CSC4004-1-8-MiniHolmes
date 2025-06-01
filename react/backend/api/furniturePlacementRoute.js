const express = require('express');
const router = express.Router();
const { recommendFurniture } = require('../algorithm/furnitureplacement/recommendFurniture');

// 숫자를 안전하게 파싱하는 헬퍼 함수, NaN일 경우 0으로 기본 설정
const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const safeParseInt = (value) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
};

router.post('/furniture-placement', async (req, res) => {
    try {
        const frontendPayload = req.body;
        console.log("Received payload from frontend:", JSON.stringify(frontendPayload, null, 2));

        // 1. Prepare `currentBudget`
        const budgetString = frontendPayload.preferences?.budget || "0만원";
        const currentBudget = safeParseInt(budgetString.replace('만원', '')) * 10000;

        // 2. Prepare `currentPointColor`
        const currentPointColor = frontendPayload.preferences?.pointcolor || "beige";

        // 3. Prepare `roomInfo`
        const roomData = frontendPayload.roomSize || {};
        const doorData = frontendPayload.doorSizes || [];
        const windowData = frontendPayload.windowSizes || [];
        const partitionData = frontendPayload.partitionZones || [];

        const roomInfo = {
            width: safeParseInt(roomData.width),
            depth: safeParseInt(roomData.length), // 프론트엔드에서는 방의 깊이에 'length'를 사용
            doors: doorData.map(d => ({
                width: safeParseInt(d.width),
                height: safeParseInt(d.height),
                wall: d.wall, // 'north', 'south', 'east', 'west' (북, 남, 동, 서)
                offset: safeParseInt(d.offset), // 벽 한쪽 끝으로부터의 거리
                // 참고: 배치 알고리즘은 방 크기에 따라 wall 및 offset을 x,y 좌표로 변환해야 함
            })),
            windows: windowData.map(w => ({
                width: safeParseInt(w.width),
                height: safeParseInt(w.height),
                wall: w.wall,
                offset: safeParseInt(w.offset),
                altitude: safeParseInt(w.altitude) // 창문에 고도(altitude) 값이 있다고 가정
            })),
            roomDividers: partitionData.filter(z => z.type === 'partition').map(p => ({
                type: 'partition_wall',
                wall: p.wall,
                length: safeParseFloat(p.length),
                height: safeParseFloat(p.height),
                wallOffset: safeParseFloat(p.wallOffset),
                doors: (p.doors || []).map(pd => ({
                    width: safeParseFloat(pd.width),
                    height: safeParseFloat(pd.height),
                    offset: safeParseFloat(pd.offset),
                }))
            })),
            colorZones: partitionData.filter(z => z.type === 'color').map(c => ({
                type: 'color_zone',
                x: safeParseFloat(c.x),
                y: safeParseFloat(c.y),
                width: safeParseFloat(c.width),
                depth: safeParseFloat(c.depth),
                color: c.color
            }))
        };
        console.log("Processed roomInfo for algorithm:", JSON.stringify(roomInfo, null, 2));

        // 4. Prepare `perimeter` (예시: 방 둘레 (cm))
        // 로그에서 값 400이 사용된 것으로 보임, 고정값인지 계산된 값인지 명확히 해야 함.
        // 계산된 값일 경우: const perimeter = (roomInfo.width + roomInfo.depth) * 2;
        const perimeter = 400; // 현재 로그 값을 사용 중, 의도된 값인지 확인 필요.

        // 5. Prepare `userPreferenceRank` for recommendFurniture
        const fePreferences = frontendPayload.preferences || {};
        const feImportanceOrder = fePreferences.importanceOrder || {};

        const styleMap = { '모던': 'modern', '내추럴': 'natural', '코지': 'cozy', '모르겠음': 'donknow' };
        const colortoneMap = { '밝은색': 'light', '중간색': 'medium', '어두운색': 'dark' };

        // 중요도 순서를 숫자 순위로 변환
        const userPreferenceRankForAlgo = {
            style: feImportanceOrder["스타일(ex. 모던)"] || 4,
            colortone: feImportanceOrder["가구 톤(ex. 밝은색 가구)"] || 4,
            size: feImportanceOrder["가구 사이즈(ex. 퀸사이즈 침대)"] || 4,
            price: feImportanceOrder["예산 내 가격"] || 4,
            target_style: styleMap[fePreferences.style] || 'donknow',
            target_colortone: colortoneMap[fePreferences.colortone] || 'light',
            essentialFurniture: fePreferences.essentialFurniture || []
        };

        console.log("Processed userPreferenceRankForAlgo:", JSON.stringify(userPreferenceRankForAlgo, null, 2));
        console.log("Processed roomInfo:", JSON.stringify(roomInfo, null, 2));

        // 메인 추천 함수 호출
        const result = await recommendFurniture(
            userPreferenceRankForAlgo,
            currentBudget,
            perimeter,
            currentPointColor,
            roomInfo
        );

        console.log("Result from recommendFurniture:", JSON.stringify(result, null, 2));
        res.json(result);

    } catch (error) {
        console.error("[API /furniture-placement] Error:", error);
        res.status(500).json({ message: "Error processing furniture placement request.", details: error.message });
    }
});

module.exports = router; 
