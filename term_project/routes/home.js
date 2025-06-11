import express from 'express';

const router = express.Router();

// 초기화면 라우트
router.get('/', (req, res) => {
    // 로그인 세션 확인
    const userId = req.session.user?.id
    if (req.session.user == undefined) {
        res.redirect('/'); // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    } else if (req.session.user.id) {
        console.log('Rendering home page with title:', "Welcome to the Library System");
        res.render('home', {
            title: "Welcome to the Library System",
            userId, // 제목 전달
        });
    } else {
        res.redirect('/'); // 기본적으로 로그인 페이지로 이동
    }
});

export default router;
 