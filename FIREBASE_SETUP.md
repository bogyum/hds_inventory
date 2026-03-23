# Firebase 환경 변수 설정 가이드

## .env.local 파일 생성 위치
`/home/bogyum/Projects/Inventory/frontend/.env.local`

## 설정 방법
1. Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트 생성
2. 프로젝트 설정 > 일반 > 내 앱에서 웹 앱 추가
3. 아래 값들을 복사하여 `.env.local` 파일에 붙여넣기

## 환경 변수 목록
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 활성화 필요 서비스
- Authentication: 이메일/비밀번호 + Google 로그인
- Firestore Database: 프로덕션 모드로 생성
