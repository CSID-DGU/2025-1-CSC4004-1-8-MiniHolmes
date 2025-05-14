import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RoomSizeInput = () => {
    useEffect(() => {
        document.title = "MiniHolmes | 방 크기 입력";
    }, []);

    const navigate = useNavigate();
    const [roomSize, setRoomSize] = useState({ width: '', length: '', height: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoomSize(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (roomSize.width && roomSize.length && roomSize.height) {
            localStorage.setItem('roomSize', JSON.stringify(roomSize));
            navigate('/style');
        } else {
            alert("모든 방 크기를 입력해주세요 (가로, 세로, 높이)");
        }
    };

    return (
        <div className="p-4 space-y-4">
            <h4 className="text-xl font-bold">방 크기를 입력해주세요 (단위: cm)</h4>
            <input
                type="number"
                name="width"
                placeholder="가로"
                value={roomSize.width}
                onChange={handleChange}
                className="border p-2 rounded w-full"
            />
            <input
                type="number"
                name="length"
                placeholder="세로"
                value={roomSize.length}
                onChange={handleChange}
                className="border p-2 rounded w-full"
            />
            <input
                type="number"
                name="height"
                placeholder="높이"
                value={roomSize.height}
                onChange={handleChange}
                className="border p-2 rounded w-full"
            />
            <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded">
                다음
            </button>
        </div>
    );
};

export default RoomSizeInput;
