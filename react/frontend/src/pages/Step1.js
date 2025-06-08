import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Step1.css";

const Step1 = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleNext = () => {
        navigate("/miniholmes/input");  // 방 크기 입력으로 이동
    };

    return (
        <div className="step-bg">
            <div className="step-container">
                <h1 className="step-title">STEP 1</h1>
                <p className="step-subtitle">공간의 크기와 구조를 먼저 입력해주세요.</p>
                <p className="step-description">
                    지금부터는 당신의 공간에 대한 정보를 입력하는 단계입니다.<br />
                    방의 크기, 창문과 문 위치, 화장실 크기, 고정된 빌트인 가구까지<br />
                    순서대로 간단히 입력해주시면 됩니다.
                </p>
                <button className="step-next-button" onClick={handleNext}>
                    시작하기
                </button>
            </div>
        </div>
    );
};

export default Step1;
