import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/RoomSizeInput.css";

const ProgressBar = ({ currentStep, totalSteps }) => {
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
        let className = 'step';
        if (i < currentStep) className += ' done';
        else if (i === currentStep) className += ' current';

        steps.push(
            <div key={i} className={className}>
                {i}
            </div>
        );
    }

    return <div className="progress-bar">{steps}</div>;
};

const RoomSizeInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [roomSize, setRoomSize] = useState({ width: '', length: '', height: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (value === '') {
            setRoomSize(prev => ({ ...prev, [name]: '' }));
            return;
        }

        const num = Number(value);
        if (!isNaN(num) && num >= 0) {
            setRoomSize(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleNext = () => {
        if (roomSize.width && roomSize.length && roomSize.height) {
            localStorage.setItem('roomSize', JSON.stringify(roomSize));
            navigate('/miniholmes/input/door');
        } else {
            alert("방 크기를 입력해주세요 (가로, 세로, 높이)");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">

                <ProgressBar currentStep={1} totalSteps={5} />

                <h4 className="title">방 크기를 입력해주세요.</h4>
                <h2 style={{ textAlign: "center", marginBottom: "40px" }}>(단위 : cm)</h2>

                <div className="dimension-group">
                    <input
                        type="number"
                        name="width"
                        placeholder="가로"
                        value={roomSize.width}
                        onChange={handleChange}
                        className="input-field dim-input"
                        min="0"
                    />
                    <span className="roomsize-dim-x">x</span>
                    <input
                        type="number"
                        name="length"
                        placeholder="세로"
                        value={roomSize.length}
                        onChange={handleChange}
                        className="input-field dim-input"
                        min="0"
                    />
                    <span className="roomsize-dim-x">x</span>
                    <input
                        type="number"
                        name="height"
                        placeholder="높이"
                        value={roomSize.height}
                        onChange={handleChange}
                        className="input-field dim-input"
                        min="0"
                    />
                </div>

                <div className="button-group">
                    {/* <button className="back-button" onClick={() => navigate(-1)}>뒤로</button> */}
                    <button className="next-button" onClick={handleNext}>다음</button>
                </div>
            </div>
        </div>
    );
};

export default RoomSizeInput;
