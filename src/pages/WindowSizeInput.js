import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/WindowSizeInput.css";

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

const WindowInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [windowCount, setWindowCount] = useState("1");
    const [windowSizes, setWindowSizes] = useState([{ width: "", height: "" }]);

    const handleCountChange = (e) => {
        let value = e.target.value;

        if (value === "") {
            setWindowCount("");
            setWindowSizes([]);
            return;
        }

        if (/^\d+$/.test(value)) {
            let num = parseInt(value, 10);
            if (num < 1) num = 1;
            setWindowCount(num.toString());
            setWindowSizes(
                Array.from({ length: num }, (_, i) => windowSizes[i] || { width: "", height: "" })
            );
        }
    };

    const handleSizeChange = (index, e) => {
        const { name, value } = e.target;
        // 빈값 허용, 숫자만 필터링, 음수 방지
        if (value === "") {
            const updated = [...windowSizes];
            updated[index][name] = "";
            setWindowSizes(updated);
            return;
        }
        const filteredValue = value.replace(/[^0-9]/g, "");
        if (filteredValue === "") return;
        const num = Number(filteredValue);
        if (num >= 0) {
            const updated = [...windowSizes];
            updated[index][name] = filteredValue;
            setWindowSizes(updated);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleNext = () => {
        const allFilled =
            windowSizes.length === parseInt(windowCount, 10) &&
            windowSizes.every((w) => w.width && w.height);
        if (allFilled) {
            localStorage.setItem("windowSizes", JSON.stringify(windowSizes));
            navigate("/toilet");
        } else {
            alert("창문의 크기를 입력해주세요.");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                {/* 진행 상태 표시 (3/5단계) */}
                <ProgressBar currentStep={3} totalSteps={5} />

                <h4 className="title">모든 창문 개수를 입력해주세요.</h4>
                <input
                    type="number"
                    min="1"
                    value={windowCount || ""}
                    onChange={handleCountChange}
                    className="input-field"
                />

                {windowSizes.map((win, index) => (
                    <div key={index} className="window-input-box">
                        <h5 className="window-title">{index + 1}번째 창문 크기 (단위 : cm)</h5>
                        <div className="dimension-group">
                            <input
                                type="number"
                                name="width"
                                placeholder="가로"
                                value={win.width}
                                onChange={(e) => handleSizeChange(index, e)}
                                className="dim-input"
                                min="0"
                            />
                            <span className="dim-x">x</span>
                            <input
                                type="number"
                                name="height"
                                placeholder="세로"
                                value={win.height}
                                onChange={(e) => handleSizeChange(index, e)}
                                className="dim-input"
                                min="0"
                            />
                        </div>
                    </div>
                ))}

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

export default WindowInput;
