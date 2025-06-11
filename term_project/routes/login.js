// login page
import cookieParser from "cookie-parser";
import express from "express";
import expressSession from 'express-session';
import { selectSql } from "../database/sql";

const router = express.Router();

router.use(cookieParser());
router.use(expressSession({
    secret: 'dilab',
    resave: true,
    saveUninitialized: true,
}));

// Login page GET
router.get('/', (req, res) => {
    if (req.session.user && req.session.user.checkLogin) {
        // 로그인된 상태에서 역할에 따라 리다이렉트
        if (req.session.user.role === 'customer') {
            return res.redirect('/home');
        } else if (req.session.user.role === 'super') {
            return res.redirect('/administer');
        }
    }
    // 로그인 페이지 렌더링
    res.render('login');
});

// Login POST
router.post('/', async (req, res) => {
    try {
        const { id, password } = req.body;
        const users = await selectSql.getUsers();
        let checkLogin = false;
        let role = null;

        // 사용자 인증
        users.forEach((user) => {
            if (id === user.Id && password === user.Password) {
                checkLogin = true;
                role = user.Role;
                req.session.user = { id: user.Id, role: user.Role, checkLogin: true }; // 세션 설정
            }
        });

        if (checkLogin) {
            // 로그인 성공: 쿠키 설정 및 리다이렉트
            res.cookie('user', id, {
                expires: new Date(Date.now() + 3600000), // 1시간 유효
                httpOnly: true,
            });
            res.cookie('role', role, {
                expires: new Date(Date.now() + 3600000), // 1시간 유효
                httpOnly: true,
            });
 
            // 역할에 따라 리다이렉트
            if (role === 'customer') {
                return res.redirect('/home');
            } else if (role === 'super') {
                return res.redirect('/administer');
            }
        } else {
            // 로그인 실패
            return res.send('<script>alert("Invalid ID or Password."); window.location="/";</script>');
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send('Internal server error.');
    }
});

module.exports = router;
