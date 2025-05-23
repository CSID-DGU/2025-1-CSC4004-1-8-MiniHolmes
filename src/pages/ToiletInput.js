import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/ToiletInput.css";

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

const ToiletInput = () => {
    useEffect(() => {
        document.title = "화장실 크기 입력 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [toiletSize, setToiletSize] = useState({ width: "", length: "", height: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (value === "" || /^\d*$/.test(value)) {
            setToiletSize((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleNext = () => {
        if (toiletSize.width && toiletSize.length && toiletSize.height) {
            localStorage.setItem("toiletSize", JSON.stringify(toiletSize));
            navigate("/builtin");
        } else {
            alert("화장실 크기를 입력해주세요 (가로, 세로, 높이)");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                {/* 진행 상태 표시 (4/5단계) */}
                <ProgressBar currentStep={4} totalSteps={5} />

                <h4 className="title">화장실 크기를 입력해주세요.</h4>
                <h2 style={{ textAlign: "center", marginBottom: "40px" }}>(단위 : cm)</h2>


                <div className="dimension-group">
                    <input
                        type="number"
                        min="0"
                        name="width"
                        placeholder="가로"
                        value={toiletSize.width}
                        onChange={handleChange}
                        className="input-field dim-input"
                    />
                    <span className="toilet-dim-x">x</span>
                    <input
                        type="number"
                        min="0"
                        name="length"
                        placeholder="세로"
                        value={toiletSize.length}
                        onChange={handleChange}
                        className="input-field dim-input"
                    />
                    <span className="toilet-dim-x">x</span>
                    <input
                        type="number"
                        min="0"
                        name="height"
                        placeholder="높이"
                        value={toiletSize.height}
                        onChange={handleChange}
                        className="input-field dim-input"
                    />
                </div>

                <div className="button-group">
                    <button className="back-button" onClick={handleBack}>
                        뒤로
                    </button>
                    <button className="next-button" onClick={handleNext}>
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToiletInput;
