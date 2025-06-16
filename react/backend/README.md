<div align="center">

### 백엔드 알고리즘 🖍️

[<img src="https://img.shields.io/badge/-readme.md-important?style=flat&logo=google-chrome&logoColor=white" />]
<br/> [<img src="https://img.shields.io/badge/프로젝트 기간-2025.03.18~2025.06.16-fab2ac?style=flat&logo=&logoColor=white" />]()

</div> 

## 📝 소개

본 프로젝트인 '미니홈즈'의 node.js 백엔드입니다.

<br />

### 알고리즘 구성

|:---:|
|<img src="https://user-images.githubusercontent.com/80824750/208456048-acbf44a8-cd71-4132-b35a-500047adbe1c.gif" width="450"/>|
|화면에 대한 설명을 입력합니다.|


## 배치 알고리즘
| 구조도 | 설명 |
|:------:|:----:|
|<img src="https://github.com/user-attachments/assets/3ff445c8-ae09-4bc0-b339-0f8fc80ce73b" width="450"/>|가구 배치 알고리즘 구조도입니다.|
|<img src="https://github.com/user-attachments/assets/60344c7f-62d8-4896-93c5-ca35e2fda9b1" width="450"/>|배치 알고리즘에 사용되는 코드들 구조도입니다.|
|<img src="https://github.com/user-attachments/assets/a5ea0b3e-6cff-4312-a408-7a00ba3be012" width="450"/>|각 place함수들의 알고리즘 구조도입니다.|




<br />

## ⚙ 기술 스택
> skills 폴더에 있는 아이콘을 이용할 수 있습니다.
### back-end
<div>
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/JavaScript.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/NodeJS.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/ExpressJS.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/MongoDB.png?raw=true" width="80">
</div>

### Tools
<div>
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/Github.png?raw=true" width="80">
<img src="https://github.com/yewon-Noh/readme-template/blob/main/skills/Notion.png?raw=true" width="80">
</div>

<br />

## 🤔 기술적 이슈와 해결 과정
- 가구 배치 데이터셋의 부족
    - 사용자가 입력한 방의 정보와 가구 배치를 x,y 좌표와 추천된 가구의 가로,세로를 이용하여 추천하는 방식으로 수정.
 
- 배치 알고리즘과 Three.js 시각화 좌표계 이슈
    - 배치 알고리즘의 추천된 결과를 바탕으로 수학적 계산을 통해 추천된 결과의 좌표계를 Three.js에 맞게 변환 시킴으로써 해결

- 배치된 가구의 모호성
    - 가구를 배치 시 가중치를 기반으로 원칙을 정하여 각 원칙에 부합하면 가중치를 부여하는데 각 가중치가 추가될 때 원칙과 이유를 알려주는 reasons 배열을 만들어
      해당 배열에 삽입하여 전달함으로써 사용자들에게 직관적이고 교육적인 배치정보 전달 가능하게 설계.


<br />

