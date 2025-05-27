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

const PointcolorSelect = () => {
    const navigate = useNavigate();
    const [selectedPointcolor, setSelectedPointcolor] = useState("");

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleSelect = (color) => {
        setSelectedPointcolor(color);
    };

    const handleNext = () => {
        if (!selectedPointcolor) {
            alert("원하는 포인트 색상을 선택해주세요.");
            return;
        }
        localStorage.setItem("pointcolor", selectedPointcolor);
        navigate("/order");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const colorOptions = [
        { value: "black", label: "검정색" },
        { value: "white", label: "하얀색" },
        { value: "grey", label: "회색" },
        { value: "beige", label: "베이지색" },
        { value: "brown", label: "갈색" },
        { value: "red", label: "빨간색" },
        { value: "orange", label: "주황색" },
        { value: "yellow", label: "노란색" },
        { value: "green", label: "초록색" },
        { value: "blue", label: "파란색" },
        { value: "purple", label: "보라색" },
        { value: "pink", label: "분홍색" },
    ];

    return (
        <div className="page-bg">
            <div className="container">

                <ProgressBar currentStep={5} totalSteps={6} />

                <h1 className="title">원하는 포인트 색상을 선택해주세요</h1>
                <p className="subtitle">(1개 선택)</p>

                <div className="colortone-grid pointcolor-grid">
                    {colorOptions.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => handleSelect(value)}
                            className={`colortone-button ${selectedPointcolor === value ? "selected" : ""}`}
                        >
                            <span
                                className="color-circle"
                                style={{ backgroundColor: value }}
                            ></span>
                            {label}
                            <span
                                style={{
                                    color: value,
                                    marginLeft: 6,
                                    fontWeight: "bold",
                                    textShadow: value === "white" ? "0 0 0 1px black" : "none",
                                    WebkitTextStroke: value === "white" ? "1px black" : "none",
                                }}
                            > ■
                            </span>
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

export default PointcolorSelect;
