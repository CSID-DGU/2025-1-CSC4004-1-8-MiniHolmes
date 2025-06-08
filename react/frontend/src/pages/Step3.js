import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Step3.css";

const Step3 = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleNext = () => {
        navigate("/miniholmes/visualizer"); // Navigate to RoomVisualizer
    };

    const handleBack = () => {
        navigate("/miniholmes/order"); // Navigate to ImportanceOrder
    };

    return (
        <div className="step-bg">
            <div className="step-container">
                <h1 className="step-title">STEP 3</h1>
                <p className="step-subtitle">이제부터는 선택하신 내용을 바탕으로 미리보기를 보여드릴게요.</p>
                <p className="step-description">
                    앞에서 입력하신 정보를 바탕으로<br />
                    문과 창문, 빌트인 가구의 위치를 직접 설정할 수 있어요.<br />
                    내가 고른 인테리어 스타일이 실제로 어떻게 보일지 확인해보세요.<br />
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
