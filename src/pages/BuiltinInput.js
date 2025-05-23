import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/BuiltinInput.css";

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

const BuiltinInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [builtinCount, setBuiltinCount] = useState("1");
    const [builtinItems, setBuiltinItems] = useState([{ name: "", width: "", height: "" }]);

    const handleCountChange = (e) => {
        let value = e.target.value;

        if (value === "") {
            setBuiltinCount("");
            setBuiltinItems([]);
            return;
        }

        if (/^\d+$/.test(value)) {
            let num = parseInt(value, 10);
            if (num < 1) num = 1;
            setBuiltinCount(num.toString());
            setBuiltinItems(Array.from({ length: num }, (_, i) => builtinItems[i] || { name: "", width: "", height: "" }));
        }
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updated = [...builtinItems];
        if (name === "name") {
            updated[index][name] = value;
        } else {
            // 숫자만 허용 (빈값도 허용)
            if (value === "" || /^\d*$/.test(value)) {
                updated[index][name] = value;
            }
        }
        setBuiltinItems(updated);
    };

    const handleReset = () => {
        if (window.confirm("초기화하시겠습니까?")) {
            setBuiltinCount("1");
            setBuiltinItems([{ name: "", width: "", height: "" }]);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleNext = () => {
        const allFilled =
            builtinItems.length === parseInt(builtinCount, 10) &&
            builtinItems.every((item) => item.name && item.width && item.height);

        if (allFilled) {
            localStorage.setItem("builtinItems", JSON.stringify(builtinItems));
            navigate("/step2");
        } else {
            alert("모든 빌트인의 이름과 크기를 입력해주세요.");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                {/* 진행 상태 표시 (5/5단계) */}
                <ProgressBar currentStep={5} totalSteps={5} />

                <h4 className="title">빌트인 가구의 개수를 입력해주세요.</h4>
                <input
                    type="number"
                    min="1"
                    value={builtinCount || ""}
                    onChange={handleCountChange}
                    className="input-field"
                />

                {builtinItems.map((item, index) => (
                    <div key={index} className="builtin-input-box">
                        <h5 className="builtin-title">{index + 1}번째 빌트인 가구</h5>
                        <input
                            type="text"
                            name="name"
                            placeholder="예: 냉장고"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, e)}
                            className="name-input"
                        />
                        <div className="dimension-group">
                            <input
                                type="number"
                                min="0"
                                name="width"
                                placeholder="가로 (cm)"
                                value={item.width}
                                onChange={(e) => handleItemChange(index, e)}
                                className="dim-input"
                            />
                            <span className="dim-x">x</span>
                            <input
                                type="number"
                                min="0"
                                name="height"
                                placeholder="세로 (cm)"
                                value={item.height}
                                onChange={(e) => handleItemChange(index, e)}
                                className="dim-input"
                            />
                        </div>
                    </div>
                ))}

                <div className="button-group">
                    <button className="back-button" onClick={handleBack}>
                        뒤로
                    </button>
                    <button className="reset-button" onClick={handleReset}>
                        초기화
                    </button>
                    <button className="next-button" onClick={handleNext}>
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuiltinInput;
