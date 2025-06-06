// import { useEffect } from "react";
// import React from "react";

// const User = ({ userData }) => {
//     return (
//         <tr>
//             <td>{userData.name}</td>
//             <td>{userData.email}</td>
//             <td>{userData.tel}</td>
//         </tr>
//     )
// }

// const UserList = () => {
//     useEffect(() => {
//         document.title = "MiniHolmes | List";
//     }, []);

//     const users = [
//         { email: 'hyewon@gmail.com', name: '전혜원', tel: '010-5848-2218' },
//         { email: 'jiyeon@gmail.com', name: '하지연', tel: '010-2222-2222' },
//         { email: 'yewon@gmail.com', name: '김예원', tel: '010-3333-3333' },
//         { email: 'taesun@gmail.com', name: '박태선', tel: '010-4444-4444' },
//         { email: 'sejin@gmail.com', name: '박세진', tel: '010-5555-5555' },
//     ]

//     return (
//         <table>
//             <thead>
//                 <tr>
//                     <th>이름</th>
//                     <th>이메일</th>
//                     <th>전화번호</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 {users.map(user => <User userData={user} />)}
//             </tbody>
//         </table>
//     )
// }

// export default UserList;
