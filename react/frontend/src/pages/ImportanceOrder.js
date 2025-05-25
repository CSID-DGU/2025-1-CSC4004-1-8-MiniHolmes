import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/ImportanceOrder.css";

const ImportanceOrder = () => {
    const navigate = useNavigate();
    const criteria = ["스타일", "컬러톤", "사이즈", "가격"];

    const [order, setOrder] = useState({
        스타일: 1,
        컬러톤: 2,
        사이즈: 3,
        가격: 4,
    });

    const ranks = [1, 2, 3, 4];

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleChange = (criteriaName, newRank) => {
        newRank = Number(newRank);
        const currentRank = order[criteriaName];

        if (Object.values(order).includes(newRank)) {
            const swapKey = Object.keys(order).find(key => order[key] === newRank);
            setOrder(prev => ({
                ...prev,
                [criteriaName]: newRank,
                [swapKey]: currentRank,
            }));
        } else {
            setOrder(prev => ({
                ...prev,
                [criteriaName]: newRank,
            }));
        }
    };

    const handleNext = () => {
        const selectedRanks = Object.values(order);
        if (new Set(selectedRanks).size !== 4) {
            alert("순위가 중복되지 않도록 설정해주세요.");
            return;
        }
        localStorage.setItem("importanceOrder", JSON.stringify(order));
        navigate('/miniholmes/visualizer');
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="container">
            <h1 className="title">중요도 순서 설정</h1>
            <p className="subtitle">가장 중요한 가구부터 1순위부터 4순위까지 지정해주세요.</p>

            <div className="criteria-list">
                {criteria.map((item) => (
                    <div key={item} className="criteria-item">
                        <span className="criteria-name">{item}</span>
                        <select
                            value={order[item]}
                            onChange={(e) => handleChange(item, e.target.value)}
                            className="select-rank"
                        >
                            {ranks.map(rank => (
                                <option key={rank} value={rank}>
                                    {rank} 순위
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            <div className="button-group">
                <button className="back-button" onClick={handleBack}>뒤로</button>
                <button className="next-button" onClick={handleNext}>저장 및 다음</button>
            </div>
        </div>
    );
};

export default ImportanceOrder;
