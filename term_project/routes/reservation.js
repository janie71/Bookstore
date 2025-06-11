const express = require('express');
const router = express.Router();
const { selectSql, transactionSql } = require('../database/sql');

// 예약 페이지 GET (조회)
router.get('/', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const userId = req.session.user?.id; // 현재 로그인된 사용자 ID
        console.log(userId);
        if (!userId) {
            return res.redirect('/logout');
        }

        // 사용자 이메일 가져오기
        const customer = await selectSql.getCustomerByEmail(userId);
        if (!customer) {
            return res.status(404).send('Customer not found.');
        }
        const customerEmail = customer.Email;

        // 예약 조회
        const reservations = await selectSql.getReservations(customerEmail);
        res.render('reservation', {
            title: 'Manage Reservations',
            reservations,
        });
        await transactionSql.commitTransaction();
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error fetching reservations:', error.message);
        res.status(500).send('Internal server error.');
    }
});


// 예약 업데이트 (수정)
router.post('/update', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const { reservationId, reservationDate, pickupTime } = req.body;

        // 시간 충돌 확인
        const conflict = await selectSql.checkTimeConflict(reservationDate, pickupTime);
        if (conflict) {
            return res.send('<script>alert("Cannot update: Time conflict with another reservation."); window.location="/reservation";</script>');
        }

        // 예약 업데이트
        await selectSql.updateReservation(reservationId, reservationDate, pickupTime);

        await transactionSql.commitTransaction();
        res.send('<script>alert("Reservation updated successfully!"); window.location="/reservation";</script>');
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error updating reservation:', error.message);
        res.status(500).send('Internal server error.');
    }
});


// 예약 삭제
router.post('/delete', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const { reservationId } = req.body;
        console.log(req.body);
        // 예약 삭제
        await selectSql.deleteReservation(reservationId);

        await transactionSql.commitTransaction();
        res.send('<script>alert("Reservation cancelled successfully!"); window.location="/reservation";</script>');
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error deleting reservation:', error.message);
        res.status(500).send('Internal server error.');
    }
});


module.exports = router;
