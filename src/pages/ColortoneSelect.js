import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/ColortoneSelect.css";

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

const ColortoneSelect = () => {
    const navigate = useNavigate();
    const [selectedColortone, setSelectedColortone] = useState("");

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleSelect = (colortone) => {
        setSelectedColortone(colortone);
    };

    const handleNext = () => {
        if (!selectedColortone) {
            alert("원하는 가구 톤을 선택해주세요.");
            return;
        }
        localStorage.setItem("colortone", selectedColortone);
        navigate("/pointcolor");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const colortones = ["밝은색", "중간색", "어두운색"];

    return (
        <div className="page-bg">
            <div className="container">
                <ProgressBar currentStep={3} totalSteps={5} />

                <h1 className="title">원하는 가구 톤을 선택해주세요</h1>
                <p className="subtitle">(1개 선택)</p>

                <div className="colortone-grid">
                    {colortones.map((colortone) => (
                        <button
                            key={colortone}
                            onClick={() => handleSelect(colortone)}
                            className={`colortone-button ${selectedColortone === colortone ? "selected" : ""}`}
                        >
                            {colortone}
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

export default ColortoneSelect;
