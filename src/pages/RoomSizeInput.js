// RoomSizeInput.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/RoomSizeInput.css";

const RoomSizeInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [roomSize, setRoomSize] = useState({ width: '', length: '', height: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoomSize(prev => ({ ...prev, [name]: value }));
    };

    const handleBack = () => {
        navigate(-1);
    };


    const handleNext = () => {
        if (roomSize.width && roomSize.length && roomSize.height) {
            localStorage.setItem('roomSize', JSON.stringify(roomSize));
            navigate('/door');
        } else {
            alert("방 크기를 입력해주세요 (가로, 세로, 높이)");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                <h4 className="title">방 크기를 입력해주세요. (단위 : cm)</h4>

                <div className="dimension-group">
                    <input
                        type="number"
                        name="width"
                        placeholder="가로"
                        value={roomSize.width}
                        onChange={handleChange}
                        className="input-field dim-input"
                    />
                    <span className="dim-x">x</span>
                    <input
                        type="number"
                        name="length"
                        placeholder="세로"
                        value={roomSize.length}
                        onChange={handleChange}
                        className="input-field dim-input"
                    />
                    <span className="dim-x">x</span>
                    <input
                        type="number"
                        name="height"
                        placeholder="높이"
                        value={roomSize.height}
                        onChange={handleChange}
                        className="input-field dim-input"
                    />
                </div>
                <div className="button-group">
                    {/* <button className="back-button" onClick={handleBack}>뒤로</button> */}
                    <button className="next-button" onClick={handleNext}>다음</button>
                </div>
            </div>
        </div >
    );
};

export default RoomSizeInput;
