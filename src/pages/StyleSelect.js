import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/StyleSelect.css";

const StyleSelect = () => {
    const navigate = useNavigate();
    const [selectedStyle, setSelectedStyle] = useState("");

    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const handleSelect = (style) => {
        setSelectedStyle(style);
    };

    const handleNext = () => {
        if (!selectedStyle) {
            alert("원하는 방 분위기를 선택해주세요.");
            return;
        }
        localStorage.setItem("style", selectedStyle);
        navigate("/furniture");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const styles = ["모던", "코지", "내추럴", "모르겠음"];

    return (
        <div className="container">
            <h1 className="title">원하는 방 분위기를 선택해주세요</h1>

            {/* {selectedStyle && (
                <div className="selected-style">
                    현재 선택: {selectedStyle}
                </div>
            )} */}

            <div className="style-grid">
                {styles.map((style) => (
                    <button
                        key={style}
                        onClick={() => handleSelect(style)}
                        className={`style-button ${selectedStyle === style ? "selected" : ""}`}
                    >
                        {style}
                    </button>
                ))}
            </div>

            <div className="button-group">
                <button className="back-button" onClick={handleBack}>뒤로</button>
                <button className="next-button" onClick={handleNext}>다음</button>
            </div>
        </div>
    );
};

export default StyleSelect;
