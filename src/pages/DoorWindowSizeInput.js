// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "./style/DoorWindowSizeInput.css";

// const RoomOpeningsInput = () => {
//     useEffect(() => {
//         document.title = "가구배치 무료견적 | 미니홈즈 인테리어 배치";
//     }, []);

//     const navigate = useNavigate();

//     const [doorCount, setDoorCount] = useState('1');
//     const [doorSizes, setDoorSizes] = useState([{ width: '', height: '' }]);
//     const [windowCount, setWindowCount] = useState('1');
//     const [windowSizes, setWindowSizes] = useState([{ width: '', height: '' }]);

//     const handleCountChange = (type, value) => {
//         if (value === '') {
//             type === 'door' ? setDoorCount('1') : setWindowCount('1');
//             type === 'door'
//                 ? setDoorSizes([{ width: '', height: '' }])
//                 : setWindowSizes([{ width: '', height: '' }]);
//             return;
//         }

//         if (/^\d+$/.test(value)) {
//             let num = Math.max(1, parseInt(value, 10));
//             if (type === 'door') {
//                 setDoorCount(num.toString());
//                 setDoorSizes(Array.from({ length: num }, (_, i) => doorSizes[i] || { width: '', height: '' }));
//             } else {
//                 setWindowCount(num.toString());
//                 setWindowSizes(Array.from({ length: num }, (_, i) => windowSizes[i] || { width: '', height: '' }));
//             }
//         }
//     };

//     const handleSizeChange = (type, index, e) => {
//         const { name, value } = e.target;
//         const filteredValue = value.replace(/[^0-9]/g, '');
//         const updated = type === 'door' ? [...doorSizes] : [...windowSizes];
//         updated[index][name] = filteredValue;

//         type === 'door' ? setDoorSizes(updated) : setWindowSizes(updated);
//     };

//     const handleBack = () => {
//         navigate(-1);
//     };

//     const handleNext = () => {
//         const doorValid = doorSizes.length === parseInt(doorCount, 10) && doorSizes.every(d => d.width && d.height);
//         const windowValid = windowSizes.length === parseInt(windowCount, 10) && windowSizes.every(w => w.width && w.height);

//         if (doorValid && windowValid) {
//             localStorage.setItem("doorSizes", JSON.stringify(doorSizes));
//             localStorage.setItem("windowSizes", JSON.stringify(windowSizes));
//             navigate("/toilet");
//         } else {
//             alert("문과 창문의 크기를 모두 입력해주세요.");
//         }
//     };

//     return (
//         <div className="room-bg">
//             <div className="container">
//                 <h4 className="title">모든 문의 개수를 입력해주세요.</h4>
//                 <h3>(현관문, 방문, 화장실문 모두 해당)</h3>
//                 <input
//                     type="number"
//                     min="1"
//                     value={doorCount}
//                     onChange={(e) => handleCountChange('door', e.target.value)}
//                     className="input-field"
//                 />
//                 {doorSizes.map((door, index) => (
//                     <div key={index} className="door-input-box">
//                         <h5 className="door-title">{index + 1}번째 문 크기 (단위 : cm)</h5>
//                         <div className="dimension-group">
//                             <input
//                                 type="number"
//                                 name="width"
//                                 placeholder="가로"
//                                 value={door.width}
//                                 onChange={(e) => handleSizeChange('door', index, e)}
//                                 className="dim-input"
//                             />
//                             <span className="dim-x">x</span>
//                             <input
//                                 type="number"
//                                 name="height"
//                                 placeholder="세로"
//                                 value={door.height}
//                                 onChange={(e) => handleSizeChange('door', index, e)}
//                                 className="dim-input"
//                             />
//                         </div>
//                     </div>
//                 ))}

//                 <div className="divider" />


//                 <h4 className="title mt-40">모든 창문의 개수를 입력해주세요.</h4>
//                 <h3>(화장실 제외 방에 있는 창문만 해당)</h3>
//                 <input
//                     type="number"
//                     min="1"
//                     value={windowCount}
//                     onChange={(e) => handleCountChange('window', e.target.value)}
//                     className="input-field"
//                 />
//                 {windowSizes.map((win, index) => (
//                     <div key={index} className="window-input-box">
//                         <h5 className="window-title">{index + 1}번째 창문 크기 (단위 : cm)</h5>
//                         <div className="dimension-group">
//                             <input
//                                 type="number"
//                                 name="width"
//                                 placeholder="가로"
//                                 value={win.width}
//                                 onChange={(e) => handleSizeChange('window', index, e)}
//                                 className="dim-input"
//                             />
//                             <span className="dim-x">x</span>
//                             <input
//                                 type="number"
//                                 name="height"
//                                 placeholder="세로"
//                                 value={win.height}
//                                 onChange={(e) => handleSizeChange('window', index, e)}
//                                 className="dim-input"
//                             />
//                         </div>
//                     </div>
//                 ))}

//                 <div className="button-group">
//                     <button className="back-button" onClick={handleBack}>뒤로</button>
//                     <button className="next-button" onClick={handleNext}>다음</button>
//                 </div>
//             </div>
//         </div >
//     );
// };

// export default RoomOpeningsInput;
