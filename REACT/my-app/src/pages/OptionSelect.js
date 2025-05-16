import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OptionSelect = () => {
    const navigate = useNavigate();
    const [selectedFurniture, setSelectedFurniture] = useState([]);

    useEffect(() => {
        document.title = "MiniHolmes | 가구 선택";
    }, []);

    const furnitureOptions = ["침대", "옷장", "책상", "책장"];

    const toggleFurniture = (item) => {
        setSelectedFurniture((prev) =>
            prev.includes(item)
                ? prev.filter((f) => f !== item)
                : [...prev, item]
        );
    };

    const handleFinish = () => {
        if (selectedFurniture.length === 0) {
            alert("최소 하나 이상의 가구를 선택해주세요");
            return;
        }
        localStorage.setItem("furniture", JSON.stringify(selectedFurniture));
        navigate("/result");
    };

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">특별히 컸으면 하는 가구를 선택해주세요</h1>

            {/* [수정] 선택한 가구 목록을 실시간으로 화면에 출력하는 부분 추가 */}
            {selectedFurniture.length > 0 && (
                <div className="text-blue-600 font-semibold">
                    현재 선택: {selectedFurniture.join(", ")}
                </div>
            )}
        
            <div className="flex flex-col gap-2">
                {furnitureOptions.map((item) => (
                    <button
                        key={item}
                        onClick={() => toggleFurniture(item)}
                        className={`border p-2 rounded w-full ${selectedFurniture.includes(item) ? "bg-blue-600 text-white" : ""}`}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <button
                onClick={handleFinish}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                완료
            </button>
        </div>
    );
};

export default OptionSelect;
