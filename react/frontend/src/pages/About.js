import React, { useEffect } from "react";
import "./style/About.css";

const About = () => {
    useEffect(() => {
        document.title = "미니홈즈 소개";
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
        }}>
            <h1 className="about-title">원룸 자취생을 위한 최적의 가구 배치 솔루션, 미니홈즈</h1>
            <h3 className="about-text">
                <p>‘이렇게 살고 싶다’는 꿈, 미니홈즈가 현실로 만들어 드립니다.</p>
                <p>작고 소중한 나만의 원룸, 어디에 가구를 놓아야 할지 막막한 순간<br />
                    가장 효율적이고 최적화된 가구 배치 솔루션을 제공합니다.</p>
                <p>적은 예산으로 가능한 최고의 인테리어<br />
                    내 방 사이즈에 꼭 맞는 가구 추천부터, 최적의 위치까지<br />
                    인테리어 초보도 쉽게 따라 할 수 있도록 도와드립니다.</p>
                <p>미니홈즈는 당신의 작은 공간을 가장 편안하고 스타일리시한 ‘집’으로 바꾸는 여정입니다.</p>
                <p>나만의 라이프스타일에 딱 맞는 가구와 배치를 만나<br />
                    일상이 더 쾌적하고 풍성해지는 경험을 시작해 보세요.</p>
            </h3>
        </div >
    );
};

export default About;
