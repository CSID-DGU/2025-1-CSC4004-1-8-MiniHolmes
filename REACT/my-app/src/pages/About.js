import React, { useEffect } from "react";

const About = () => {
    useEffect(() => {
        document.title = "MiniHolmes | About";
    }, []);

    return (
        < div >
            <h1>About 화면입니다.</h1>
        </div >
    );
};

export default About;