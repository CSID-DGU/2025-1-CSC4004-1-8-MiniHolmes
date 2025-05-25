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

    const criteria = ["스타일(ex. 모던)", "가구 톤(ex. 밝은색 가구)", "가구 사이즈(ex. 퀸사이즈 침대)", "저렴한 가격"];

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
        updated[rank] = selected;
        setRankedCriteria(updated);
    };

    const handleNext = () => {
        const selected = Object.values(rankedCriteria);
        if (selected.includes(null)) {
            alert("모든 순위를 선택해주세요.");
            return;
        }

        const importanceOrder = {};
        Object.entries(rankedCriteria).forEach(([rank, name]) => {
            importanceOrder[name] = Number(rank);
        });

        localStorage.setItem("importanceOrder", JSON.stringify(importanceOrder));
        navigate("/step3");
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
        navigate(-1);
    };

    return (
        <div className="page-bg">
            <div className="container">
                <ProgressBar currentStep={5} totalSteps={5} />

                <h1 className="title">중요도 순서 설정</h1>
                <p className="subtitle">스타일, 가구 톤, 가구 사이즈, 가격을<br />중요한 순서대로 선택해주세요.</p>

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
