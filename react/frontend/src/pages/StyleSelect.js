import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/StyleSelect.css";

const ProgressBar = ({ currentStep, totalSteps }) => {
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
        let className = "step";
        if (i < currentStep) className += " done";
        else if (i === currentStep) className += " current";

        steps.push(
            <div key={i} className={className}>
                {i}
            </div>
        );
    }
    return <div className="progress-bar">{steps}</div>;
};

const StyleSelect = () => {
    const navigate = useNavigate();
    const [selectedStyle, setSelectedStyle] = useState("");

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleSelect = (style) => {
        setSelectedStyle(style);
    };

    const handleNext = () => {
        if (!selectedStyle) {
            alert("원하는 스타일을 선택해주세요.");
            return;
        }
        localStorage.setItem("style", selectedStyle);
        navigate("/miniholmes/colortone");
    };

    const handleBack = () => {
        navigate("/miniholmes/furniture");
    };

    const styles = ["모던", "내추럴", "코지", "모르겠음"];

    return (
        <div className="page-bg">
            <div className="container">

                <ProgressBar currentStep={3} totalSteps={6} />

                <h1 className="title">원하는 스타일을 선택해주세요</h1>
                <p className="subtitle">(1개 선택)</p>

                <div className="style-grid">
                    {styles.map((style) => (
                        <button
                            key={style}
                            onClick={() => handleSelect(style)}
                            className={`style-button ${selectedStyle === style ? "selected" : ""}`}
                        >
                            {style}
                        </button>
                    ))}
                </div>

                <div className="button-group">
                    <button className="back-button" onClick={handleBack}>뒤로</button>
                    <button className="next-button" onClick={handleNext}>다음</button>
                </div>
            </div>
        </div>
    );
};

export default StyleSelect;
