import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/WindowSizeInput.css";

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

const WindowSizeInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [windowCount, setWindowCount] = useState('1');
    const [windowSizes, setWindowSizes] = useState([{ width: '', height: '', wall: 'north', offset: '', altitude: '' }]);

    const handleCountChange = (e) => {
        let value = e.target.value;

        if (value === '') {
            setWindowCount('');
            setWindowSizes([]);
            return;
        }

        if (/^\d+$/.test(value)) {
            let num = parseInt(value, 10);
            if (num < 1) num = 1;
            setWindowCount(num.toString());
            setWindowSizes(Array.from({ length: num }, (_, i) => windowSizes[i] || { width: '', height: '', wall: 'north', offset: '', altitude: '' }));
        }
    };

    const handleSizeChange = (index, e) => {
        const { name, value } = e.target;
        const filteredValue = (name === 'offset' || name === 'altitude') ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');
        const updated = [...windowSizes];
        updated[index][name] = filteredValue;
        setWindowSizes(updated);
    };

    const handleWallChange = (index, e) => {
        const updated = [...windowSizes];
        updated[index].wall = e.target.value;
        setWindowSizes(updated);
    };

    const handleOffsetChange = (index, e) => {
        const filteredValue = e.target.value.replace(/[^0-9]/g, '');
        const updated = [...windowSizes];
        updated[index].offset = filteredValue;
        setWindowSizes(updated);
    };

    const handleBack = () => {
        navigate('/miniholmes/input/door');
    };

    const handleNext = () => {
        const count = parseInt(windowCount, 10);
        if (isNaN(count) || count <= 0) {
            alert("창문 개수를 올바르게 입력해주세요.");
            return;
        }

        const allFilled = windowSizes.length === count && 
                          windowSizes.every(w => w.width && w.height && w.wall && w.offset && w.altitude);
        if (allFilled) {
            localStorage.setItem("windowSizes", JSON.stringify(windowSizes));
            navigate('/miniholmes/input/partition');
        } else {
            alert("모든 창문의 크기, 벽, 간격, 높이 정보를 입력해주세요.");
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                <ProgressBar currentStep={3} totalSteps={4} />
                <h4 className="title">모든 창문의 개수를 입력해주세요.</h4>
                <input
                    type="number"
                    min="1"
                    value={windowCount || ''}
                    onChange={handleCountChange}
                    className="input-field"
                />

                {windowSizes.map((win, index) => (
                    <div key={index} className="window-input-box">
                        <h5 className="window-title">{index + 1}번째 창문 크기 및 위치 (단위: cm)</h5>
                        <div className="dimension-group">
                            <input
                                type="number"
                                name="width"
                                placeholder="너비 (cm)"
                                value={win.width}
                                onChange={(e) => handleSizeChange(index, e)}
                                className="dim-input"
                            />
                            <span className="dim-x">x</span>
                            <input
                                type="number"
                                name="height"
                                placeholder="높이 (cm)"
                                value={win.height}
                                onChange={(e) => handleSizeChange(index, e)}
                                className="dim-input"
                            />
                        </div>
                        <div style={{ fontSize: '0.95em', color: '#888', margin: '0 0 20px 0' }}>
                            ※ 벽에서 거리는 <b>각 벽을 바라볼 때의 왼쪽 끝</b>에서부터 측정합니다.
                        </div>
                        <div className="dimension-group">
                            <select
                                name="wall"
                                value={win.wall || ""}
                                onChange={e => handleWallChange(index, e)}
                                className="dim-input"
                            >
                                <option value="">벽 선택</option>
                                <option value="north">북쪽</option>
                                <option value="south">남쪽</option>
                                <option value="east">동쪽</option>
                                <option value="west">서쪽</option>
                            </select>
                            <input
                                type="number"
                                name="offset"
                                placeholder="거리"
                                value={win.offset || ""}
                                onChange={e => handleOffsetChange(index, e)}
                                className="dim-input"
                                min={0}
                            />
                        </div>
                        <div className="altitude-group">
                            <label htmlFor={`altitude-${index}`} className="label-altitude">바닥으로부터 높이 (cm):</label>
                            <input
                                type="number"
                                name="altitude"
                                placeholder="예: 90"
                                value={win.altitude}
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

export default WindowSizeInput;
