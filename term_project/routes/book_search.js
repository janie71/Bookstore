import express from 'express';
import { selectSql, transactionSql } from '../database/sql';

const router = express.Router();

router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.redirect('/logout');
    } else if (req.session.user.id) {
        console.log('Rendering book_search page');
        res.render('book_search', {
            title: "Search for Books", 
        }); 
    } else { 
        res.redirect('/'); 
    }

})

router.post('/', async (req, res) => {
    const { searchType, searchValue } = req.body;
    let books = [];

    try {
        await transactionSql.startTransaction();
        // 검색 조건에 따라 쿼리 실행
        if (searchType === 'book') {
            books = await selectSql.searchByBookTitle(searchValue);
        } else if (searchType === 'author') {
            books = await selectSql.searchByAuthorName(searchValue);
        } else if (searchType === 'award') {
            books = await selectSql.searchByAwardName(searchValue);
        }
        await transactionSql.commitTransaction();

    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error during search:', error.message);
    }

    // 검색 결과 렌더링
    res.render('book_search_results', {
        title: `Search Results for "${searchValue}"`,
        books,
        searchType,
        searchValue,
    });
});

router.post('/reserve', async (req, res) => {
    console.log('요청 데이터:', req.body);
    const { ISBN } = req.body;
    const userId = req.session.user.id;
    console.log(userId);
    await transactionSql.startTransaction();

        // Fetch customer email using userId
        const customer = await selectSql.getCustomerByEmail(userId);
        console.log('고객 정보:', customer);
        try {
        if (!customer) {
            return res.status(400).send('Invalid user session.');
        }
 
        const customerEmail = customer.Email;

        // Check if the book is already reserved by this customer
        const existingReservation = await selectSql.getReservationByCustomerEmail(customerEmail);

        if (existingReservation) {
            return res.send(`<script>alert('You already have a reservation.'); window.location='/book_search';</script>`);
        }

        // Check total inventory
        const book = await selectSql.getBookInventory(ISBN);
        console.log('책 정보:', book);
        if (!book || book.total_inventory <= 0) {
            return res.send(`<script>alert('This book is not available for reservation.'); window.location='/book_search';</script>`);
        }

        // Make the reservation
        await selectSql.makeReservation({
            ID: ISBN,
            pickup_date: null,
            pickup_time: null,
            ISBN: ISBN,
            Email: customerEmail,
        });

        await transactionSql.commitTransaction();
        return res.send(`<script>alert('Reservation successful!'); window.location='/book_search';</script>`);
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error while reserving:', error.message);
        return res.status(500).send('Internal server error.');
    }
});

router.post('/add_to_basket', async (req, res) => {
    const { ISBN } = req.body;
    const userId = req.session.user?.id;

    try {
        await transactionSql.startTransaction();

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in.' });
        }
    
        // Get customer email
        const customer = await selectSql.getCustomerByEmail(userId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
    
        const customerEmail = customer.Email;
    
        // Check total inventory
        const book = await selectSql.getBookInventory(ISBN);
        if (!book || book.total_inventory <= 0) {
            return res.json({ success: false, message: 'This book is out of stock.' });
        }
    
        // Check if adding the book exceeds total inventory
        let basket = await selectSql.getShoppingBasketByCustomerEmail(customerEmail, ISBN);
    
        if (basket) {
            const basketID = basket.basketID;
            const containsEntry = await selectSql.getContainsEntry(ISBN, basketID);
            if (containsEntry && containsEntry.number + 1 > book.total_inventory) {
                return res.send(`<script>alert('총 수량을 초과할 수 없습니다.'); window.location='/book_search';</script>`);
            }
            else if(basket.order_date){
                return res.send(`<script>alert('구매내역이 있는 책입니다.'); window.location='/book_search';</script>`);
            }
            else{
                // If the book is already in the basket, increment the quantity
            await selectSql.updateContainsQuantity(ISBN, basketID, containsEntry.number + 1);
            }
            console.log('basket',basket);
            console.log('containsEntry: ',containsEntry,'book:',book);
        }
    
        else {
            // Create a new shopping basket
            await selectSql.createShoppingBasket(customerEmail,ISBN);
        }

        await transactionSql.commitTransaction();
        return res.send(`<script>alert('장바구니로 이동하였습니다!'); window.location='/book_search';</script>`);
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred.' });
    }    
});


module.exports = router;

