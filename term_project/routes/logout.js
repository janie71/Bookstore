import cookieParser from "cookie-parser";
import express from "express";
import expressSession from 'express-session';

const router = express.Router();

router.use(cookieParser());
router.use(expressSession({
    secret: 'dilab',
    resave: true,
    saveUninitialized: true,
}));

// Logout
router.get('/', (req, res) => {
    try {
        // 세션 삭제
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Error during logout. Please try again.');
            }

            // 쿠키 삭제
            res.clearCookie('user');
            res.clearCookie('role');
                        
            // 로그인 페이지로 리다이렉트
            res.redirect('/');
        });
    } catch (error) {
        console.error('Error during logout:', error.message);
        res.status(500).send('Internal server error.');
    }
});

module.exports = router;
