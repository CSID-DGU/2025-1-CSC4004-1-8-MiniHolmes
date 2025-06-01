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
    const [isLoading, setIsLoading] = useState(false);
    const criteria = ["스타일(ex. 모던)", "가구 톤(ex. 밝은색 가구)", "가구 사이즈(ex. 퀸사이즈 침대)", "예산 내 가격"];
    const [rankedCriteria, setRankedCriteria] = useState({});

    useEffect(() => {
        document.title = "중요도 순위 선택 | 미니홈즈 인테리어 배치";
        const initialRanked = {};
        for (let i = 1; i <= criteria.length; i++) {
            initialRanked[i] = null;
        }
        setRankedCriteria(initialRanked);
    }, []);

    const handleChange = (rank, selected) => {
        const updated = { ...rankedCriteria };
        for (let key in updated) {
            if (Number(key) !== rank && updated[key] === selected) {
                updated[key] = null;
            }
        }
        updated[rank] = selected || null;
        setRankedCriteria(updated);
    };

    const handleNext = async () => {
        const selectedValues = Object.values(rankedCriteria);
        if (selectedValues.some(val => val === null) || selectedValues.length < criteria.length) {
            alert("모든 순위를 선택해주세요.");
            return;
        }

        const currentImportanceOrder = {};
        Object.entries(rankedCriteria).forEach(([rank, name]) => {
            if (name) {
                currentImportanceOrder[name] = Number(rank);
            }
        });
        localStorage.setItem("importanceOrder", JSON.stringify(currentImportanceOrder));
        
        setIsLoading(true);
        try {
            const payload = {
                roomSize: JSON.parse(localStorage.getItem('roomSize') || '{}'),
                doorSizes: JSON.parse(localStorage.getItem('doorSizes') || '[]'),
                windowSizes: JSON.parse(localStorage.getItem('windowSizes') || '[]'),
                partitionZones: JSON.parse(localStorage.getItem('partitionZones') || '[]'),
                preferences: {
                    budget: localStorage.getItem('budget') || '',
                    essentialFurniture: JSON.parse(localStorage.getItem('essentialFurniture') || '[]'),
                    style: localStorage.getItem('style') || '',
                    colortone: localStorage.getItem('colortone') || '',
                    pointcolor: localStorage.getItem('pointcolor') || '',
                    importanceOrder: currentImportanceOrder,
                }
            };
            
            console.log("Frontend: Sending payload to backend:", JSON.stringify(payload, null, 2));

            const response = await fetch('/api/furniture-placement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const resultData = await response.json();
            localStorage.setItem('placementResult', JSON.stringify(resultData));
            navigate("/miniholmes/step3");

        } catch (error) {
            console.error("Frontend: Failed to get furniture placement:", error);
            alert(`가구 배치 정보를 가져오는데 실패했습니다: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("초기화하시겠습니까?")) {
            const initial = {};
            for (let i = 1; i <= criteria.length; i++) {
                initial[i] = null;
            }
            setRankedCriteria(initial);
            localStorage.removeItem("importanceOrder");
        }
    };

    const handleBack = () => {
        navigate("/miniholmes/pointcolor");
    };

    return (
        <div className="page-bg">
            <div className="container">
                <ProgressBar currentStep={6} totalSteps={6} />

                <h1 className="title">중요도 순서 설정</h1>
                <p className="subtitle">스타일, 가구 톤, 가구 사이즈, 가격 정확도를<br />중요한 순서대로 선택해주세요.</p>

                <div className="criteria-list">
                    {Array.from({ length: criteria.length }, (_, i) => {
                        const rank = i + 1;
                        const selected = Object.values(rankedCriteria).filter(
                            (v) => v !== null && rankedCriteria[rank] !== v
                        );
                        const available = criteria.filter(
                            (item) => !selected.includes(item) || item === rankedCriteria[rank]
                        );

                        return (
                            <div key={rank} className="criteria-item">
                                <span className="criteria-name">{rank}순위</span>
                                <select
                                    value={rankedCriteria[rank] || ""}
                                    onChange={(e) => handleChange(rank, e.target.value)}
                                    className="select-rank"
                                >
                                    <option value="">선택</option>
                                    {available.map((item) => (
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
