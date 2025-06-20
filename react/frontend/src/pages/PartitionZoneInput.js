import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/style/WindowSizeInput.css';

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

const defaultZone = {
  type: 'color',
  wall: 'none',
  width: '',
  depth: '',
  color: '#4CAF50',
  x: '',
  y: '',
};


const PartitionZoneInput = () => {
  const [manualZones, setManualZones] = useState([]);
  const [doorZones, setDoorZones] = useState([]);
  const [input, setInput] = useState(defaultZone);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load manual color zones
    const savedColorZones = localStorage.getItem('colorZones');
    if (savedColorZones) {
      setManualZones(JSON.parse(savedColorZones));
    }
    
    // Load door zones from partitionZones
    const savedPartitionZones = localStorage.getItem('partitionZones');
    if (savedPartitionZones) {
      const partitionZones = JSON.parse(savedPartitionZones);
      const doorColorZones = partitionZones.filter(zone => zone.isDoorZone);
      setDoorZones(doorColorZones);
    }
    
    setIsInitialized(true);
    document.title = '가구배치 무료견적 | 미니홈즈 인테리어 배치';
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('colorZones', JSON.stringify(manualZones));
      
      // Update partitionZones with manual zones while preserving door zones
      const savedPartitionZones = localStorage.getItem('partitionZones');
      const existingPartitionZones = savedPartitionZones ? JSON.parse(savedPartitionZones) : [];
      const nonColorZones = existingPartitionZones.filter(zone => !zone.isDoorZone && zone.type !== 'color');
      const allPartitionZones = [...nonColorZones, ...doorZones, ...manualZones];
      localStorage.setItem('partitionZones', JSON.stringify(allPartitionZones));
    }
  }, [manualZones, doorZones, isInitialized]);

  const getRoomSize = () => {
    const saved = localStorage.getItem('roomSize');
    if (saved) {
      try {
        const { width, length } = JSON.parse(saved);
        return {
          width: Number(width),
          depth: Number(length)
        };
      } catch {
        return { width: 0, depth: 0 };
      }
    }
    return { width: 0, depth: 0 };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // wall, type, color는 문자열로, 나머지는 숫자로 처리
    if (["wall", "type", "color"].includes(name)) {
      setInput((prev) => ({ ...prev, [name]: value }));
    } else {
      const numericValue = value === '' ? '' : parseFloat(value);
      setInput((prev) => ({ ...prev, [name]: numericValue }));
    }
  };


  const handleAdd = () => {
    const { width: roomWidth, depth: roomDepth } = getRoomSize();
    if (input.width === '' || input.depth === '' || input.x === '' || input.y === '') return alert('가로, 세로, x좌표, y좌표를 입력하세요.');
    // 색상 구역이 방 크기를 초과하는지 확인
    if (input.x + input.width > roomWidth) return alert('색상 구역이 방 너비를 초과합니다.');
    if (input.y + input.depth > roomDepth) return alert('색상 구역이 방 깊이를 초과합니다.');
    setManualZones((prev) => [...prev, input]);
    setInput(defaultZone);
  };

  const handleDelete = (idx, isDoorZone = false) => {
    if (isDoorZone) {
      alert('문 구역은 삭제할 수 없습니다. 문 정보를 수정하려면 문 입력 페이지에서 변경해주세요.');
      return;
    }
    setManualZones((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="room-bg">
      <div className="container" style={{ maxWidth: '600px', width: '100%' }}>
        <ProgressBar currentStep={4} totalSteps={4} />
        <h4 className="title">색상 구역을 입력해주세요.</h4>
        
        <div style={{ marginBottom: 32, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* 입력 폼 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '24px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '24px',
            width: '100%',
            maxWidth: '600px' // 일관된 최대 너비 설정
          }}>

            {/* 크기 입력 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px 250px', 
              gap: '30px',
              marginBottom: '24px',
              justifyContent: 'start'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  가로(cm)
                </label>
                <input 
                  type="number" 
                  name="width" 
                  value={input.width} 
                  onChange={handleChange} 
                  min="0.1" 
                  step="0.01" 
                  className="input-field" 
                  style={{ 
                    width: '100%', 
                    height: '45px',
                    fontSize: '15px',
                    paddingLeft: '12px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }}
                  placeholder="예: 300"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  세로(cm)
                </label>
                <input 
                  type="number" 
                  name="depth" 
                  value={input.depth} 
                  onChange={handleChange} 
                  min="0.1" 
                  step="0.01" 
                  className="input-field" 
                  style={{ 
                    width: '100%', 
                    height: '45px',
                    fontSize: '15px',
                    paddingLeft: '12px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }}
                  placeholder="예: 200"
                />
              </div>
            </div>

            {/* 색상 선택 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '20px',
              marginBottom: '24px',
              justifyContent: 'start'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  색상
                </label>
                <input 
                  type="color" 
                  name="color" 
                  value={input.color} 
                  onChange={handleChange} 
                  className="input-field" 
                  style={{ 
                    width: '100px', 
                    height: '45px',
                    padding: '5px',
                    border: '2px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* 위치 입력 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '24px',
              justifyContent: 'start'
            }}>
              <div style={{ 
                gridColumn: '1 / -1', 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ 
                  fontSize: '0.95em', 
                  color: '#666',
                  margin: '0 0 8px 0',
                  lineHeight: '1.5'
                }}>
                  <b>색상 구역 위치 안내</b>
                </p>
                <p style={{ 
                  fontSize: '0.9em', 
                  color: '#666',
                  margin: '0',
                  lineHeight: '1.5'
                }}>
                  • 색상 구역의 <b>왼쪽 아래 모서리</b>가 기준입니다.<br/>
                  • <b>서쪽 벽에서 떨어진 거리(x, cm)</b>와 <b>남쪽 벽에서 떨어진 거리(y, cm)</b>를 입력하세요.<br/>
                  • 예) x=0, y=0이면 방의 남서쪽 모서리에 위치합니다.
                </p>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  서쪽 벽에서 거리(cm)
                </label>
                <input 
                  type="number" 
                  name="x" 
                  value={input.x} 
                  onChange={handleChange} 
                  min="0" 
                  step="0.01" 
                  className="input-field" 
                  style={{ 
                    width: '100%', 
                    height: '45px',
                    fontSize: '15px',
                    paddingLeft: '12px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }}
                  placeholder="예: 150"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  남쪽 벽에서 거리(cm)
                </label>
                <input 
                  type="number" 
                  name="y" 
                  value={input.y} 
                  onChange={handleChange} 
                  min="0" 
                  step="0.01" 
                  className="input-field" 
                  style={{ 
                    width: '100%', 
                    height: '45px',
                    fontSize: '15px',
                    paddingLeft: '12px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }}
                  placeholder="예: 200"
                />
              </div>
            </div>

            {/* 추가 버튼 */}
            <div style={{ textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={handleAdd} 
                style={{
                  background: '#ff6600',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#e55a00'}
                onMouseOut={(e) => e.target.style.background = '#ff6600'}
              >
                추가
              </button>
            </div>
          </div>

          {/* 입력된 구역 목록 */}
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '12px', 
            padding: '20px',
            width: '100%',
            maxWidth: '600px' // 일관된 최대 너비 설정
          }}>
            <h5 style={{ 
              margin: '0 0 16px 0', 
              color: '#333', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              입력된 구역 ({manualZones.length + doorZones.length}개)
            </h5>
            
            {manualZones.length === 0 && doorZones.length === 0 ? (
              <p style={{ 
                color: '#999', 
                textAlign: 'center', 
                margin: '20px 0', 
                fontStyle: 'italic' 
              }}>
                입력된 구역이 없습니다.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Door zones (read-only) */}
                {doorZones.map((zone, idx) => (
                  <div 
                    key={`door-${idx}`} 
                    style={{ 
                      background: '#fff', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '2px solid #ff5722'
                    }}
                  >
                    <div>
                      <span style={{ 
                        background: '#ffebe3',
                        color: '#ff5722',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px'
                      }}>
                        문 구역
                      </span>
                      
                      <span style={{ color: '#666' }}>
                        {`가로 ${zone.width}cm × 세로 ${zone.depth}cm (위치: x=${zone.x}cm, y=${zone.y}cm)`}
                      </span>
                      
                      <span 
                        style={{ 
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          backgroundColor: zone.color,
                          borderRadius: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                    
                    <span style={{ 
                      color: '#999', 
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      자동 생성됨
                    </span>
                  </div>
                ))}
                
                {/* Manual zones (editable) */}
                {manualZones.map((zone, idx) => (
                  <div 
                    key={`manual-${idx}`} 
                    style={{ 
                      background: '#fff', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div>
                      <span style={{ 
                        background: '#fff3e0',
                        color: '#f57c00',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px'
                      }}>
                        색상
                      </span>
                      
                      <span style={{ color: '#666' }}>
                        {`가로 ${zone.width}cm × 세로 ${zone.depth}cm (위치: x=${zone.x}cm, y=${zone.y}cm)`}
                      </span>
                      
                      <span 
                        style={{ 
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          backgroundColor: zone.color,
                          borderRadius: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => handleDelete(idx, false)} 
                      style={{ 
                        color: '#dc3545', 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#ffebee'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="button-group" style={{ maxWidth: '600px', width: '100%' }}>
          <button className="back-button" onClick={() => navigate('/miniholmes/input/window')}>
            뒤로
          </button>
          <button className="next-button" onClick={() => navigate('/miniholmes/step2')}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartitionZoneInput;
