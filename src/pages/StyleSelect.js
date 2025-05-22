import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/StyleSelect.css";  // 스타일은 따로 만드시면 됩니다.

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
        document.title = "가구배치 무료견적 | 스타일 선택";
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
        navigate("/pointcolor");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const styles = ["모던", "내추럴", "모르겠음"];

    return (
        <div className="page-bg">
            <div className="container">

                <ProgressBar currentStep={3} totalSteps={5} />

                <h1 className="title">원하는 스타일을 선택해주세요</h1>

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
