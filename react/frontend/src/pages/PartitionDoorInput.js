import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/DoorSizeInput.css";

const PartitionDoorInput = () => {
    const [partitionZones, setPartitionZones] = useState([]);
    useEffect(() => {
        const saved = localStorage.getItem('partitionZones');
        if (saved) {
            setPartitionZones(JSON.parse(saved));
        }
        document.title = "가벽 문 입력 | 미니홈즈 인테리어 배치";
    }, []);

    const navigate = useNavigate();
    const [doorCount, setDoorCount] = useState('1');
    const [doorSizes, setDoorSizes] = useState([{ width: '', height: '', partitionIdx: '', offset: '' }]);

    // 가벽 목록 준비
    const partitionOptions = partitionZones.map((zone, idx) => ({
        value: idx,
        label: `가벽 ${idx + 1} (길이: ${zone.length}m)`
    }));

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
            setDoorSizes(Array.from({ length: num }, (_, i) => doorSizes[i] || { width: '', height: '', partitionIdx: '', offset: '' }));
        }
    };

    const handleSizeChange = (index, e) => {
        const { name, value } = e.target;
        const updated = [...doorSizes];
        updated[index][name] = value;
        setDoorSizes(updated);
    };

    const handlePartitionChange = (index, e) => {
        const updated = [...doorSizes];
        updated[index].partitionIdx = e.target.value;
        setDoorSizes(updated);
    };

    const handleOffsetChange = (index, e) => {
        const updated = [...doorSizes];
        updated[index].offset = e.target.value;
        setDoorSizes(updated);
    };

    const handleBack = () => {
        navigate('/miniholmes/input/partition');
    };

    const handleNext = () => {
        // 문 정보 partitionZones에 반영
        const updatedZones = [...partitionZones];
        // 먼저 모든 가벽의 doors를 빈 배열로 초기화 (중복 방지)
        updatedZones.forEach(z => { if (z.type === 'partition') z.doors = []; });
        doorSizes.forEach(door => {
            const idx = Number(door.partitionIdx);
            if (!isNaN(idx) && updatedZones[idx] && updatedZones[idx].type === 'partition') {
                updatedZones[idx].doors.push({
                    width: door.width,
                    height: door.height,
                    offset: door.offset
                });
            }
        });
        // localStorage에 저장
        localStorage.setItem('partitionZones', JSON.stringify(updatedZones));
        navigate('/miniholmes/step2');
    };

    return (
        <div className="room-bg">
            <div className="container">
                <h4 className="title">가벽에 설치할 문의 개수를 입력해주세요.</h4>
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
                                placeholder="예: 70"
                                value={door.width}
                                onChange={e => handleSizeChange(index, e)}
                                className="dim-input"
                                min="0"
                            />
                            <span className="dim-x">x</span>
                            <input
                                type="number"
                                name="height"
                                placeholder="예: 200"
                                value={door.height}
                                onChange={e => handleSizeChange(index, e)}
                                className="dim-input"
                                min="0"
                            />
                        </div>
                        <div style={{ fontSize: '0.95em', color: '#888', margin: '0 0 20px 0' }}>
                            ※ 문 위치는 가벽의 <b>왼쪽(또는 아래쪽) 끝</b>에서부터 <b>cm 단위</b>로 측정합니다.
                        </div>
                        <div className="dimension-group">
                            <select
                                name="partitionIdx"
                                value={door.partitionIdx || ""}
                                onChange={e => handlePartitionChange(index, e)}
                                className="dim-input"
                            >
                                <option value="">가벽 선택</option>
                                {partitionOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label.replace('m', 'cm')}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                name="offset"
                                placeholder="문 위치(거리, cm)"
                                value={door.offset || ""}
                                onChange={e => handleOffsetChange(index, e)}
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

export default PartitionDoorInput; 