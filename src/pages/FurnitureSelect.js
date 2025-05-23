import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/FurnitureSelect.css";

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

const FurnitureSelect = () => {
    const navigate = useNavigate();
    const [selectedFurniture, setSelectedFurniture] = useState([]);

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const furnitureOptions = ["침대", "옷장", "책상", "책장"];

    const toggleFurniture = (item) => {
        setSelectedFurniture((prev) =>
            prev.includes(item)
                ? prev.filter((f) => f !== item)
                : [...prev, item]
        );
    };

    const handleNext = () => {
        if (selectedFurniture.length === 0) {
            alert("최소 하나 이상의 가구를 선택해주세요");
            return;
        }
        localStorage.setItem("essentialFurniture", JSON.stringify(selectedFurniture));
        navigate("/order");
    };

    const handleReset = () => {
        if (window.confirm("초기화하시겠습니까?")) {
            setSelectedFurniture([]);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="page-bg">
            <div className="container">
                <ProgressBar currentStep={2} totalSteps={5} />

                <h1 className="title">원하는 가구를 선택해주세요</h1>
                <p className="subtitle">(1개 이상 선택)</p>

                <div className="furniture-list">
                    {furnitureOptions.map((item) => (
                        <button
                            key={item}
                            onClick={() => toggleFurniture(item)}
                            className={`furniture-button ${selectedFurniture.includes(item) ? "selected" : ""}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="button-group">
                    <button className="back-button" onClick={handleBack}>뒤로</button>
                    <button className="reset-button" onClick={handleReset}>초기화</button>
                    <button className="next-button" onClick={handleNext}>다음</button>
                </div>
            </div>
        </div>
    );
};

export default FurnitureSelect;
