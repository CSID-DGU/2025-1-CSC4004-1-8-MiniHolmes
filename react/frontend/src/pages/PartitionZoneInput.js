import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/style/WindowSizeInput.css';

const defaultZone = {
  type: 'partition', // 'partition' or 'color'
  wall: 'north', // 'north', 'south', 'east', 'west', 'none'
  length: '', // m (partition only)
  height: '', // m (partition only)
  width: '', // m (color only)
  depth: '', // m (color only)
  color: '#4CAF50', // color only
  wallOffset: '', // 벽에서의 거리 (m) (partition only)
  x: '', // 바닥 x 좌표 (m) (color only)
  y: '', // 바닥 y 좌표 (m) (color only)
};

const wallOptions = [
  { value: 'north', label: '북쪽 벽' },
  { value: 'south', label: '남쪽 벽' },
  { value: 'west', label: '서쪽 벽' },
  { value: 'east', label: '동쪽 벽' },
  { value: 'none', label: '벽 없음/바닥' },
];

const PartitionZoneInput = () => {
  const [zones, setZones] = useState([]);
  const [input, setInput] = useState(defaultZone);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('partitionZones');
    if (saved) {
      setZones(JSON.parse(saved));
    }
    document.title = '가구배치 무료견적 | 미니홈즈 인테리어 배치';
  }, []);

  useEffect(() => {
    localStorage.setItem('partitionZones', JSON.stringify(zones));
  }, [zones]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setInput((prev) => ({
      ...defaultZone,
      type,
      wall: type === 'partition' ? 'north' : 'none',
    }));
  };

  const handleAdd = () => {
    if (input.type === 'partition') {
      if (!input.length || !input.height || !input.wallOffset) return alert('길이, 높이, 벽에서의 거리를 입력하세요.');
    } else {
      if (!input.width || !input.depth || !input.x || !input.y) return alert('가로, 세로, x좌표, y좌표를 입력하세요.');
    }
    setZones((prev) => [...prev, input]);
    setInput(defaultZone);
  };

  const handleDelete = (idx) => {
    setZones((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="room-bg">
      <div className="container">
        <h4 className="title">가벽/색상 구역을 입력해주세요.</h4>
        
        <div style={{ marginBottom: 32 }}>
          {/* 입력 폼 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '24px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '24px',
            minWidth: '500px' // 최소 너비 설정으로 겹침 방지
          }}>
            {/* 첫 번째 줄: 종류와 벽/바닥 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px 250px', 
              gap: '30px', // 간격을 넓게 설정
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
                  종류
                </label>
                <select 
                  name="type" 
                  value={input.type} 
                  onChange={handleTypeChange} 
                  className="input-field" 
                  style={{ 
                    width: '100%', 
                    height: '50px',
                    fontSize: '15px',
                    paddingLeft: '12px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }}
                >
                  <option value="partition">가벽</option>
                  <option value="color">색상 구역</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  벽/바닥
                </label>
                <select 
                  name="wall" 
                  value={input.wall} 
                  onChange={handleChange} 
                  className="input-field" 
                  style={{ 
                    width: '100%', 
                    height: '50px',
                    fontSize: '15px',
                    paddingLeft: '12px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }}
                >
                  {wallOptions.filter(opt => 
                    input.type === 'partition' ? opt.value !== 'none' : true
                  ).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 두 번째 줄: 치수 입력 (통일된 스타일 적용) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px 250px', 
              gap: '30px', // 간격을 넓게 설정
              marginBottom: '24px',
              justifyContent: 'start'
            }}>
              {input.type === 'partition' ? (
                <>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      marginBottom: '8px', 
                      color: '#333',
                      fontSize: '14px'
                    }}>
                      길이(m)
                    </label>
                    <input 
                      type="number" 
                      name="length" 
                      value={input.length} 
                      onChange={handleChange} 
                      min="0.1" 
                      step="0.01" 
                      className="input-field" 
                      style={{ 
                        width: '84%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 2.5"
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
                      높이(m)
                    </label>
                    <input 
                      type="number" 
                      name="height" 
                      value={input.height} 
                      onChange={handleChange} 
                      min="0.1" 
                      step="0.01" 
                      className="input-field" 
                      style={{ 
                        width: '86%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 2.4"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      marginBottom: '8px', 
                      color: '#333',
                      fontSize: '14px'
                    }}>
                      가로(m)
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
                        width: '84%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 3.0"
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
                      세로(m)
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
                        width: '86%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 2.0"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 세 번째 줄: 위치 입력 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px 250px', 
              gap: '30px',
              marginBottom: '24px',
              justifyContent: 'start'
            }}>
              {input.type === 'partition' ? (
                <>
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
                      <b>가벽 설치 안내</b>
                    </p>
                    <p style={{ 
                      fontSize: '0.9em', 
                      color: '#666',
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      • 선택한 벽에 <b>평행</b>하게 가벽이 설치됩니다.<br/>
                      • 벽에서의 거리는 <b>벽에서 떨어진 거리</b>이며, 각 벽의 왼쪽 끝에서부터 측정합니다.<br/>
                      • 가벽의 길이는 선택한 벽과 <b>평행</b>한 방향의 길이입니다.
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
                      벽에서 거리(m)
                    </label>
                    <input 
                      type="number" 
                      name="wallOffset" 
                      value={input.wallOffset} 
                      onChange={handleChange} 
                      min="0" 
                      step="0.01" 
                      className="input-field" 
                      style={{ 
                        width: '84%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 1.5"
                    />
                  </div>
                </>
              ) : (
                <>
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
                      • <b>서쪽 벽에서 떨어진 거리(x)</b>와 <b>남쪽 벽에서 떨어진 거리(y)</b>를 입력하세요.<br/>
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
                      서쪽 벽에서 거리(m)
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
                        width: '84%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 1.5"
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
                      남쪽 벽에서 거리(m)
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
                        width: '86%', 
                        height: '45px',
                        fontSize: '15px',
                        paddingLeft: '12px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}
                      placeholder="예: 2.0"
                    />
                  </div>
                </>
              )}
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
            padding: '20px' 
          }}>
            <h5 style={{ 
              margin: '0 0 16px 0', 
              color: '#333', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              입력된 구역 ({zones.length}개)
            </h5>
            
            {zones.length === 0 ? (
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
                {zones.map((zone, idx) => (
                  <div 
                    key={idx} 
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
                        background: zone.type === 'partition' ? '#e3f2fd' : '#fff3e0',
                        color: zone.type === 'partition' ? '#1976d2' : '#f57c00',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px'
                      }}>
                        {zone.type === 'partition' ? '가벽' : '색상'}
                      </span>
                      
                      <span style={{ fontWeight: '500', marginRight: '8px' }}>
                        {wallOptions.find(w => w.value === zone.wall)?.label || ''}
                      </span>
                      
                      <span style={{ color: '#666' }}>
                        {zone.type === 'partition'
                          ? `길이 ${zone.length}m × 높이 ${zone.height}m (거리: ${zone.wallOffset}m)`
                          : `가로 ${zone.width}m × 세로 ${zone.depth}m (위치: x=${zone.x}m, y=${zone.y}m)`}
                      </span>
                      
                      {zone.type === 'color' && (
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
                      )}
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => handleDelete(idx)} 
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

        <div className="button-group">
          <button className="back-button" onClick={() => navigate('/miniholmes/input/window')}>
            뒤로
          </button>
          <button 
            type="button"
            style={{
              background: '#ff6600',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              margin: '0 16px',
              transition: 'background 0.2s'
            }}
            onClick={() => navigate('/miniholmes/input/partition-door')}
            onMouseOver={e => e.target.style.background = '#e55a00'}
            onMouseOut={e => e.target.style.background = '#ff6600'}
          >
            문 추가
          </button>
          <button className="next-button" onClick={() => navigate('/miniholmes/input/style')}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartitionZoneInput;