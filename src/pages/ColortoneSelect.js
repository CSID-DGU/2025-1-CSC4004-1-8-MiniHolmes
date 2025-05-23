import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/ColortoneSelect.css";

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
            alert("원하는 방 분위기를 선택해주세요.");
            return;
        }
        localStorage.setItem("colortone", selectedColortone);
        navigate("/style");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const colortones = ["밝은색", "중간색", "어두운색"];

    return (
        <div className="page-bg">
            <div className="container">
                <h1 className="title">원하는 방 분위기를 선택해주세요</h1>

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
