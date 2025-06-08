import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/DoorSizeInput.css";

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

const DoorSizeInput = () => {
    useEffect(() => {
        document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [doorCount, setDoorCount] = useState('1');
    const [doorSizes, setDoorSizes] = useState([{ width: '', height: '', wall: '', offset: '', distance: '' }]);

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
            setDoorSizes(Array.from({ length: num }, (_, i) => doorSizes[i] || { width: '', height: '', wall: '', offset: '', distance: '' }));
        }
    };

    const handleSizeChange = (index, e) => {
        const { name, value } = e.target;
        const filteredValue = value.replace(/[^0-9]/g, '');
        const updated = [...doorSizes];
        updated[index][name] = filteredValue;
        setDoorSizes(updated);
    };

    const handleWallChange = (index, e) => {
        const updated = [...doorSizes];
        updated[index].wall = e.target.value;
        setDoorSizes(updated);
    };

    const handleOffsetChange = (index, e) => {
        const filteredValue = e.target.value.replace(/[^0-9]/g, '');
        const updated = [...doorSizes];
        updated[index].offset = filteredValue;
        setDoorSizes(updated);
    };

    const handleBack = () => {
        navigate('/miniholmes/input');
    };

    const handleNext = () => {
        const allFilled = doorSizes.length === parseInt(doorCount, 10) && doorSizes.every(d => d.width && d.height && d.wall && d.offset !== '' && d.distance !== '');
        if (allFilled) {
            localStorage.setItem("doorSizes", JSON.stringify(doorSizes));
            // Create color zones for door areas
            const doorColorZones = doorSizes.map((door, index) => {
                // For north/south walls: width = door width, depth = door distance
                // For east/west walls: width = door distance, depth = door width
                const isNorthSouth = door.wall === 'north' || door.wall === 'south';
                return {
                    type: 'color',
                    wall: 'none',
                    width: isNorthSouth ? door.width : door.distance,
                    depth: isNorthSouth ? door.distance : door.width,
                    color: '#FF5722', // Orange color for door zones
                    x: calculateDoorZoneX(door),
                    y: calculateDoorZoneY(door),
                    isDoorZone: true,
                    doorIndex: index
                };
            });
            
            // Get existing partition zones and add door zones
            const existingZones = JSON.parse(localStorage.getItem('partitionZones') || '[]');
            const updatedZones = [...existingZones.filter(z => !z.isDoorZone), ...doorColorZones];
            localStorage.setItem('partitionZones', JSON.stringify(updatedZones));
            
            navigate('/miniholmes/input/window');
        } else {
            alert("문의 크기, 위치, 그리고 문 앞 거리를 모두 입력해주세요.");
        }
    };
    
    const getRoomSize = () => {
        const saved = localStorage.getItem('roomSize');
        if (saved) {
            try {
                const { width, length } = JSON.parse(saved);
                return { width: Number(width), depth: Number(length) };
            } catch { return { width: 400, depth: 400 }; }
        }
        return { width: 400, depth: 400 };
    };
    
    const calculateDoorZoneX = (door) => {
        const { width: roomWidth } = getRoomSize();
        const doorWidth = Number(door.width);
        const offset = Number(door.offset);
        
        switch (door.wall) {
            case 'north': // 북쪽 벽
                return roomWidth - offset - doorWidth;
            case 'south': // 남쪽 벽  
                return offset;
            case 'west': // 서쪽 벽
                return 0;
            case 'east': // 동쪽 벽
                return roomWidth - Number(door.distance);
            default:
                return 0;
        }
    };
    
    const calculateDoorZoneY = (door) => {
        const { depth: roomDepth } = getRoomSize();
        const doorWidth = Number(door.width);
        const offset = Number(door.offset);
        
        switch (door.wall) {
            case 'north': // 북쪽 벽
                return roomDepth - Number(door.distance);
            case 'south': // 남쪽 벽
                return 0;
            case 'west': // 서쪽 벽 - 왼쪽 끝은 남쪽에서부터
                return roomDepth - doorWidth - offset;
            case 'east': // 동쪽 벽 - 왼쪽 끝은 북쪽에서부터
                return offset;
            default:
                return 0;
        }
    };

    return (
        <div className="room-bg">
            <div className="container">
                <ProgressBar currentStep={1} totalSteps={3} />
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
                                onChange={e => handleSizeChange(index, e)}
                                className="dim-input"
                            />
                            <span className="dim-x">x</span>
                            <input
                                type="number"
                                name="height"
                                placeholder="세로"
                                value={door.height}
                                onChange={e => handleSizeChange(index, e)}
                                className="dim-input"
                            />
                        </div>
                        <div style={{ fontSize: '0.95em', color: '#888', margin: '0 0 20px 0' }}>
                            ※ 벽에서 거리는 <b>각 벽을 바라볼 때의 왼쪽 끝</b>에서부터 측정합니다.
                        </div>
                        <div className="dimension-group">
                            <select
                                name="wall"
                                value={door.wall || ""}
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
                                value={door.offset || ""}
                                onChange={e => handleOffsetChange(index, e)}
                                className="dim-input"
                                min={0}
                            />
                        </div>
                        <div style={{ fontSize: '0.95em', color: '#888', margin: '10px 0' }}>
                            ※ 문 앞 거리: 가구를 배치하지 않을 영역의 깊이입니다.
                        </div>
                        <div className="dimension-group">
                            <span style={{ minWidth: '80px', fontSize: '0.9em', color: '#333' }}>문 앞 거리</span>
                            <input
                                type="number"
                                name="distance"
                                placeholder="깊이(cm)"
                                value={door.distance || ""}
                                onChange={e => {
                                    const filteredValue = e.target.value.replace(/[^0-9]/g, '');
                                    const updated = [...doorSizes];
                                    updated[index].distance = filteredValue;
                                    setDoorSizes(updated);
                                }}
                                className="dim-input"
                                min={0}
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

export default DoorSizeInput;
