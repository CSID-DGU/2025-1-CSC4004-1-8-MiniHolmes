import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StyleSelect = () => {
    const navigate = useNavigate();
    const [selectedStyle, setSelectedStyle] = useState("");

    useEffect(() => {
        document.title = "MiniHolmes | 스타일 선택";
    }, []);

    const handleSelect = (style) => {
        setSelectedStyle(style);
    };

    const handleNext = () => {
        if (!selectedStyle) {
            alert("원하는 방 분위기를 선택해주세요(1개)");
            return;
        }
        localStorage.setItem("style", selectedStyle);
        navigate("/furnitureselect")
    };

    const styles = ["모던", "코지", "내추럴"];

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">원하는 방 분위기를 선택해주세요</h1>
            <div className="flex flex-col gap-2">
                {styles.map((style) => (
                    <button
                        key={style}
                        onClick={() => handleSelect(style)}
                        className={`border p-2 rounded w-full ${selectedStyle === style ? "bg-blue-600 text-white" : ""}`}
                    >
                        {style}
                    </button>
                ))}
            </div>
            <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                다음
            </button>
        </div>
    );
};

export default StyleSelect;
