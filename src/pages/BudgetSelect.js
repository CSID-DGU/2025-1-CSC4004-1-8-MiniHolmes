import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/BudgetSelect.css";

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

const BudgetSelect = () => {
    const navigate = useNavigate();
    const [selectedBudget, setSelectedBudget] = useState("");

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleSelect = (budget) => {
        setSelectedBudget(budget);
    };

    const handleNext = () => {
        if (!selectedBudget) {
            alert("원하는 예산을 선택해주세요.");
            return;
        }
        localStorage.setItem("budget", selectedBudget);
        navigate("/furniture");
    };

    const handleBack = () => {
        navigate("/Step2");
    };

    const budgetOptions = [
        "30만원", "40만원", "50만원", "60만원", "70만원",
        "80만원", "90만원", "100만원", "100만원 이상"
    ];

    return (
        <div className="page-bg">
            <div className="container">
                <ProgressBar currentStep={1} totalSteps={6} />

                <h1 className="title">예산을 선택해주세요.</h1>
                <p className="subtitle">(1개 선택)</p>

                <div className="budget-grid">
                    {budgetOptions.map((budget) => (
                        <button
                            key={budget}
                            onClick={() => handleSelect(budget)}
                            className={`budget-button ${selectedBudget === budget ? "selected" : ""}`}
                        >
                            {budget}
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

export default BudgetSelect;
