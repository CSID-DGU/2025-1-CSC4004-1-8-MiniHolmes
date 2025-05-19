import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/DoorSizeInput.css";

const DoorInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [doorCount, setDoorCount] = useState('1');
    const [doorSizes, setDoorSizes] = useState([{ width: '', height: '' }]);

    const handleCountChange = (e) => {
        let value = e.target.value;

        if (value === '') {
            setDoorCount('');
            setDoorSizes([]);
            return;
        }

        if (/^\d+$/.test(value)) {
            let num = parseInt(value, 10);
            if (num < 1) num = 1;
            setDoorCount(num.toString());
            setDoorSizes(Array.from({ length: num }, (_, i) => doorSizes[i] || { width: '', height: '' }));
        }
    };

    const handleSizeChange = (index, e) => {
        const { name, value } = e.target;
        const filteredValue = value.replace(/[^0-9]/g, '');
        const updated = [...doorSizes];
        updated[index][name] = filteredValue;
        setDoorSizes(updated);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleNext = () => {
        const allFilled = doorSizes.length === parseInt(doorCount, 10) && doorSizes.every(d => d.width && d.height);
        if (allFilled) {
            localStorage.setItem("doorSizes", JSON.stringify(doorSizes));
            navigate("/window");
        } else {
            alert("문의 크기를 입력해주세요.");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                <h4 className="title">모든 문의 개수를 입력해주세요.</h4>
                <input
                    type="number"
                    min="1"
                    value={doorCount || ''}
                    onChange={handleCountChange}
                    className="input-field"
                />

                {doorSizes.map((door, index) => (
                    <div key={index} className="door-input-box">
                        <h5 className="door-title">{index + 1}번째 문 크기 (단위 : cm)</h5>
                        <div className="dimension-group">
                            <input
                                type="number"
                                name="width"
                                placeholder="가로"
                                value={door.width}
                                onChange={(e) => handleSizeChange(index, e)}
                                className="dim-input"
                            />
                            <span className="dim-x">x</span>
                            <input
                                type="number"
                                name="height"
                                placeholder="세로"
                                value={door.height}
                                onChange={(e) => handleSizeChange(index, e)}
                                className="dim-input"
                            />
                        </div>
                    </div>
                ))}

                <div className="button-group">
                    <button className="back-button" onClick={handleBack}>뒤로</button>
                    <button className="next-button" onClick={handleNext}>다음</button>
                </div>
            </div>
        </div>
    );
};

export default DoorInput;
