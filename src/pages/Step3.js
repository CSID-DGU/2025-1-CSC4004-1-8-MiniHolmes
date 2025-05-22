import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Step3.css";

const Step3 = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "STEP 3 - 미리보기 | 미니홈즈";
    }, []);

    const handleNext = () => {
        navigate("/finalize"); // 다음 페이지 수정 필요
    };

    const handleBack = () => {
        navigate("/step2");
    };

    return (
        <div className="step-bg">
            <div className="step-container">
                <h1 className="step-title">STEP 3</h1>
                <p className="step-subtitle">이제부터는 선택하신 내용을 바탕으로 미리보기를 보여드릴게요.</p>
                <p className="step-description">
                    앞에서 입력하신 가구 크기와 구조, 인테리어 스타일을 기반으로<br />
                    실제 방에 배치된 모습을 미리 확인할 수 있어요.<br />
                    원하는 부분을 조정하거나 다시 돌아가서 변경할 수도 있습니다.<br />
                    멋진 공간을 만드는 여정, 함께 해요!
                </p>
                <div className="button-group">
                    <button className="step-back-button" onClick={handleBack}>
                        뒤로
                    </button>
                    <button className="step-next-button" onClick={handleNext}>
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step3;
