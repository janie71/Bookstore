import express from 'express';
import { selectSql,transactionSql } from '../database/sql';

const router = express.Router();

// 쇼핑 바구니 페이지 렌더링
router.get('/', async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
        return res.redirect('/logout'); // 로그아웃 처리
    }

    try {
        await transactionSql.startTransaction();
        // 현재 로그인된 사용자의 이메일 가져오기
        const customer = await selectSql.getCustomerByEmail(userId);
        if (!customer) {
            return res.status(404).send('Customer not found.');
        }
        const customerEmail = customer.Email;

        // 쇼핑 바구니 조회
        const shoppingBasket = await selectSql.getShoppingBasketItems(customerEmail);

        res.render('shopping_basket', {
            title: 'Shopping Basket',
            shoppingBasket,
        });
        await transactionSql.commitTransaction();
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error fetching shopping basket:', error.message);
        res.status(500).send('Internal server error.');
    }
});

//구매버튼눌렀을때
router.post('/purchase', async (req, res) => {
    const bookISBN = req.body.bookISBN;
    const warehouseCode = parseInt(req.body.warehouseCode, 10) || 0;
    const purchaseQuantity = parseInt(req.body.purchaseQuantity, 10) || 0;
    console.log('Request Body:', req.body);

    try {
        await transactionSql.startTransaction();
        // 구매하려는 수량, 창고 정보 확인
        const inventory = await selectSql.getInventory(bookISBN, warehouseCode);
        console.log(inventory);
        if (!inventory || inventory.total_inventory <= 0) {
            return res.send('<script>alert("Out of stock! Cannot purchase."); window.location="/shopping_basket";</script>');
        } 

        const updatedInventory = Math.max(inventory.number - purchaseQuantity, 0);

        // 쇼핑 바구니 및 재고 업데이트 inventory,contains 테이블의 number 업데이트
        await selectSql.updateInventory(bookISBN, warehouseCode, updatedInventory);
        await selectSql.updateContainsNumber(bookISBN, 0);

        // 주문 날짜 업데이트
        await selectSql.updateOrderDate();

        await transactionSql.commitTransaction();
        return res.send('<script>alert("Purchase successful!"); window.location="/shopping_basket";</script>');
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error during purchase:', error.message);
        res.status(500).send('Internal server error.');
    }
});

module.exports = router;

