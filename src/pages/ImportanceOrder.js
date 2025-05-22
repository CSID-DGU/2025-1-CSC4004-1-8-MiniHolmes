import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/ImportanceOrder.css";

const ProgressBar = ({ currentStep, totalSteps }) => {
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
        let className = 'step';
        if (i < currentStep) className += ' done';
        else if (i === currentStep) className += ' current';

        steps.push(
            <div key={i} className={className}>
                {i}
            </div>
        );
    }

    return <div className="progress-bar">{steps}</div>;
};

const ImportanceOrder = () => {
    const navigate = useNavigate();
    const [furnitureList, setFurnitureList] = useState([]);
    const [rankedFurniture, setRankedFurniture] = useState({});

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
        const stored = localStorage.getItem("essentialFurniture");
        if (stored) {
            const parsed = JSON.parse(stored);
            setFurnitureList(parsed);

            // 초기 순위 설정: 모두 null
            const initialRanked = {};
            for (let i = 1; i <= parsed.length; i++) {
                initialRanked[i] = null;
            }
            setRankedFurniture(initialRanked);
        } else {
            alert("선택된 가구가 없습니다. 이전 페이지로 이동합니다.");
            navigate(-1);
        }
    }, [navigate]);

    const handleChange = (rank, selectedFurniture) => {
        // 현재 선택된 다른 랭크에서 이 가구가 선택돼있으면 제거
        const updated = { ...rankedFurniture };
        for (let key in updated) {
            if (Number(key) !== rank && updated[key] === selectedFurniture) {
                updated[key] = null;
            }
        }
        updated[rank] = selectedFurniture;
        setRankedFurniture(updated);
    };

    const handleNext = () => {
        const selected = Object.values(rankedFurniture);
        if (selected.includes(null)) {
            alert("모든 순위를 선택해주세요.");
            return;
        }

        // 저장 형식: {가구이름: 순위}
        const importanceOrder = {};
        Object.entries(rankedFurniture).forEach(([rank, name]) => {
            importanceOrder[name] = Number(rank);
        });

        localStorage.setItem("importanceOrder", JSON.stringify(importanceOrder));
        navigate("/colortone");
    };

    const handleReset = () => {
        if (window.confirm("초기화하시겠습니까?")) {
            const initial = {};
            for (let i = 1; i <= furnitureList.length; i++) {
                initial[i] = null;
            }
            setRankedFurniture(initial);
            localStorage.removeItem("importanceOrder");
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="page-bg">
            <div className="container">

                {/* 1/5단계 ProgressBar 추가 */}
                <ProgressBar currentStep={2} totalSteps={5} />

                <h1 className="title">중요도 순서 설정</h1>
                <p className="subtitle">가구의 중요도를 순서대로 선택해주세요.</p>

                <div className="criteria-list">
                    {Array.from({ length: furnitureList.length }, (_, i) => {
                        const rank = i + 1;
                        const selected = Object.values(rankedFurniture).filter(v => v !== null && rankedFurniture[rank] !== v);
                        const available = furnitureList.filter(item => !selected.includes(item) || item === rankedFurniture[rank]);

                        return (
                            <div key={rank} className="criteria-item">
                                <span className="criteria-name">{rank}순위</span>
                                <select
                                    value={rankedFurniture[rank] || ""}
                                    onChange={(e) => handleChange(rank, e.target.value)}
                                    className="select-rank"
                                >
                                    <option value="">선택</option>
                                    {available.map(item => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>

                <div className="button-group">
                    <button className="back-button" onClick={handleBack}>뒤로</button>
                    <button className="reset-button" onClick={handleReset}>초기화</button>
                    <button className="next-button" onClick={handleNext}>저장 및 다음</button>
                </div>
            </div>
        </div>
    );
};

export default ImportanceOrder;
