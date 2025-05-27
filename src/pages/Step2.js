import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Step2.css";

const Step2 = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleNext = () => {
        navigate("/budget");
    };

    const handleBack = () => {
        navigate("/builtin");
    };

    return (
        <div className="step-bg">
            <div className="step-container">
                <h1 className="step-title">STEP 2</h1>
                <p className="step-subtitle">가구의 크기와 구조를 먼저 입력해주세요.</p>
                <p className="step-description">
                    이제부터 가구에 대해 차근차근 입력해볼게요.<br />
                    필요한 가구부터 원하는 스타일, 포인트 컬러까지<br />
                    차례대로 쉽고 빠르게 설정할 수 있어요.<br />
                </p>
                <div className="button-group">
                    <button className="step-back-button" onClick={handleBack}>
                        뒤로
                    </button>
                    <button className="step-next-button" onClick={handleNext}>
                        시작하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step2;
