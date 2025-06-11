import mysql from 'mysql2';

require("dotenv").config();

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'dldbwls64',
    database: 'term-project',
});
 
const promisePool = pool.promise(); 

// select query 
export const selectSql = {
    getUsers: async () => {
        const sql = `select * from user`;
        const [result] = await promisePool.query(sql);
        return result;
    }, 
    //특정 고객의 예약 정보를 조회 ->reservation 화면에 띄울 column들만 select
    getReservations: async (customerEmail) => {
        const [rows] = await promisePool.query(
            `SELECT book.title, customer.name, 
                DATE_FORMAT(reservation.reservation_date, '%Y-%m-%d') AS reservation_date,
                DATE_FORMAT(reservation.pickup_date, '%Y-%m-%d') AS pickup_date, 
                reservation.pickup_time, 
                reservation.book_ISBN
             FROM book
             JOIN reservation ON book.ISBN = reservation.book_ISBN
             JOIN customer ON reservation.Email = customer.Email
             WHERE reservation.Email = ?`,
            [customerEmail]
        );
        return rows;
    },    
    
    checkTimeConflict: async (pickupDate, pickupTime) => {
        const [rows] = await promisePool.query(
            `SELECT COUNT(*) AS conflict
             FROM reservation
             WHERE pickup_date = ?
             AND ABS(TIME_TO_SEC(TIMEDIFF(pickup_time, ?))) <= 600`,
            [pickupDate, pickupTime]
        );
        return rows[0].conflict > 0; // 충돌이 있으면 true 반환
    },
    updateReservation: async (reservationId, pickupDate, pickupTime) => {
        await promisePool.query(
            `UPDATE reservation
             SET pickup_date = ?, pickup_time = ?
             WHERE book_ISBN = ?`,
            [pickupDate, pickupTime, reservationId]
        );
    },
    deleteReservation: async (reservationId) => {
        await promisePool.query(
            `DELETE FROM reservation
             WHERE book_ISBN = ?`,
            [reservationId]
        );
    },
    
    searchByBookTitle: async (title) => {
        const [rows] = await promisePool.query(
            `SELECT book.*, COALESCE(SUM(inventory.number), 0) AS total_inventory
             FROM book
             LEFT JOIN inventory ON book.ISBN = inventory.book_ISBN
             WHERE book.title = ?
             GROUP BY book.ISBN`,
            [title]
        );
    // total_inventory 숫자로 처리
        return rows.map(row => ({
            ...row,
            total_inventory: Number(row.total_inventory),
        }));
    },
    searchByAuthorName: async (name) => {
        const [rows] = await promisePool.query(
            `SELECT book.*, COALESCE(SUM(inventory.number), 0) AS total_inventory
             FROM book
             INNER JOIN written_by ON written_by.book_ISBN = book.ISBN
             LEFT JOIN inventory ON book.ISBN = inventory.book_ISBN
             WHERE written_by.author_name = ?
             GROUP BY book.ISBN`,
            [name]
        );
            // total_inventory 숫자로 처리
        return rows.map(row => ({
            ...row,
            total_inventory: Number(row.total_inventory),
        }));
    },
    searchByAwardName: async (name) => {
        const [rows] = await promisePool.query(
            `SELECT book.*, COALESCE(SUM(inventory.number), 0) AS total_inventory
             FROM book
             INNER JOIN awarded_to ON awarded_to.book_ISBN = book.ISBN
             LEFT JOIN inventory ON book.ISBN = inventory.book_ISBN
             WHERE awarded_to.award_name = ?
             GROUP BY book.ISBN`,
            [name]
        );
            // total_inventory 숫자로 처리
        return rows.map(row => ({
            ...row,
            total_inventory: Number(row.total_inventory),
        }));
    },
//현재 login하고있는 customer의 Email을 추출 => userId로 사용
    getCustomerByEmail: async (userId) => {
        const [rows] = await promisePool.query(
            `SELECT customer.Email FROM customer, user WHERE user.Id= customer.name and user.Id = ?`,
            [userId]
        );
        return rows[0];
    },
    //해당customer에 대한 예약 조회
    getReservationByCustomerEmail: async (Email) => {
        const [rows] = await promisePool.query(
            `SELECT * FROM reservation WHERE Email = ?`,
            [Email]
        );
        return rows[0];
    },
    //특정 책(book_ISBN)의 전체 재고 수량을 조회
    //책의 ISBN을 기준으로 inventory 테이블에서 모든 창고에 있는 재고 수량 합계를 계산하여 반환
    getBookInventory: async (ISBN) => {
        const [rows] = await promisePool.query(
            `SELECT book_ISBN AS ISBN, SUM(number) AS total_inventory
             FROM inventory
             WHERE book_ISBN = ?
             GROUP BY book_ISBN`,
            [ISBN]
        );
        return rows[0];
    },
    //설정한 pickup_date, pickup_time으로 예약
    makeReservation: async ({ pickup_date, pickup_time, ISBN, Email }) => {
        try {
            await promisePool.query(
                `INSERT INTO reservation ( reservation_date, pickup_date, pickup_time, book_ISBN, Email)
                 VALUES (CURRENT_DATE, ?, ?, ?, ?)`,
                [ pickup_date, pickup_time, ISBN, Email]
            );
        } catch (error) {
            console.error('예약 등록 중 에러:', error.message);
            throw error;
        }
    },

//특정 고객(customer_Email)과 특정 책(book_ISBN)에 대해 쇼핑 바구니(shopping_basket) 정보를 조회
    getShoppingBasketByCustomerEmail: async (customerEmail,ISBN) => {
        const [rows] = await promisePool.query(
            `SELECT shopping_basket.*, contains.book_ISBN
            FROM shopping_basket
            JOIN basket_of ON shopping_basket.basketID = basket_of.shopping_basket_basketID
            JOIN contains ON contains.shopping_basket_basketID = shopping_basket.basketID
            WHERE basket_of.customer_Email = ?
            AND contains.book_ISBN = ?
            `,
            [customerEmail,ISBN]
        );
        return rows[0];
    },
//새로운 쇼핑 바구니(Shopping Basket)**를 생성하고, 해당 바구니를 특정 고객과 연결한 뒤, 책을 추가
    createShoppingBasket: async (customerEmail, bookISBN) => {
        // Step 1: Get the next basketID
        const [rows] = await promisePool.query(`SELECT COALESCE(MAX(basketID), 0) AS maxBasketID FROM shopping_basket`);
        const nextBasketID = rows[0].maxBasketID + 1;
    
        // Step 2: Insert new shopping basket with the calculated basketID
        await promisePool.query(
            `INSERT INTO shopping_basket (basketID, order_date) VALUES (?, NULL)`,
            [nextBasketID]
        );
    
        // Step 3: Link shopping basket to customer
        await promisePool.query(
            `INSERT INTO basket_of (customer_Email, shopping_basket_basketID)
             VALUES (?, ?)`,
            [customerEmail, nextBasketID]
        );
    
        // Step 4: Add book to the shopping basket
        await promisePool.query(
            `INSERT INTO contains (book_ISBN, shopping_basket_basketID, number)
             VALUES (?, ?, ?)`,
            [bookISBN, nextBasketID, 1]
        );
    },
    
//contains 테이블에서 특정 book_ISBN과 basketID를 가진 행을 조회
    getContainsEntry: async (bookISBN, basketID) => {
        const [rows] = await promisePool.query(
            `SELECT * FROM contains WHERE book_ISBN = ? AND shopping_basket_basketID = ?`,
            [bookISBN, basketID]
        );
        return rows[0];
    },
//contains 테이블에서 특정 book_ISBN과 basketID를 가진 행의 수량(number)을 업데이트
    updateContainsQuantity: async (bookISBN, basketID, newQuantity) => {
        await promisePool.query(
            `UPDATE contains SET number = ? WHERE book_ISBN = ? AND shopping_basket_basketID = ?`,
            [newQuantity, bookISBN, basketID]
        );
    },
//contains 테이블에 새로운 행을 삽입
    insertIntoContains: async (bookISBN, basketID, quantity) => {
        await promisePool.query(
            `INSERT INTO contains (book_ISBN, shopping_basket_basketID, number)
             VALUES (?, ?, ?)`,
            [bookISBN, basketID, quantity]
        );
    },
    
    //쇼핑 바구니의 책, 수량, 재고 정보
    //order_date없는것만 조회
    getShoppingBasketItems: async (customerEmail) => {
        const [rows] = await promisePool.query(
            `SELECT book.title AS book_name, 
                    contains.book_ISBN, 
                    contains.number AS contains_number, 
                    COALESCE(SUM(inventory.number), 0) AS inventory_number,
                    GROUP_CONCAT(DISTINCT inventory.warehouse_code) AS warehouse_codes
             FROM basket_of
             JOIN shopping_basket ON basket_of.shopping_basket_basketID = shopping_basket.basketID
             JOIN contains ON contains.shopping_basket_basketID = shopping_basket.basketID
             JOIN book ON book.ISBN = contains.book_ISBN
             LEFT JOIN inventory ON book.ISBN = inventory.book_ISBN
             WHERE basket_of.customer_Email = ?
               AND shopping_basket.order_date IS NULL
             GROUP BY shopping_basket.order_date, contains.book_ISBN, contains.number, book.title`,
            [customerEmail]
        ); 

        return rows.map(row => ({
            ...row,
            warehouse_codes: row.warehouse_codes ? row.warehouse_codes.split(',') : []
        }));
    },
    //inventory 테이블에서 특정 book_ISBN과 warehouseCode를 가진 행을 조회
    getInventory: async (bookISBN, warehouseCode) => {
        console.log('get inventory:', bookISBN, warehouseCode);
        const [rows] = await promisePool.query(
            `SELECT * FROM inventory WHERE book_ISBN = ? AND warehouse_code = ?`,
            [bookISBN, warehouseCode]
        );
        return rows[0];
    },

    //재고 정보를 업데이트
    updateInventory: async (bookISBN, warehouseCode, newNumber) => {
        console.log('Updating Inventory:', bookISBN, warehouseCode, newNumber);
        await promisePool.query(
            `UPDATE inventory SET number = ? WHERE book_ISBN = ? AND warehouse_code = ?`,
            [newNumber, bookISBN, warehouseCode]
        );
    },
    //contains 테이블의 구매 수량을 업데이트
    updateContainsNumber: async (bookISBN, newNumber) => {
        console.log('Updating Contains:', bookISBN, newNumber);
        await promisePool.query(
            `UPDATE contains SET number = ? WHERE book_ISBN = ?`,
            [newNumber, bookISBN]
        );
    },
    //shopping_basket.order_date를 현재 날짜로 업데이트
    updateOrderDate: async () => {
        await promisePool.query(
            `UPDATE shopping_basket SET order_date = CURRENT_DATE`
        );
    },
    getTableData: async (table) => {
        const [rows] = await promisePool.query(`SELECT * FROM ${table}`);
        return rows;
    },
    
};
export const insertSql = {
    //주어진 테이블에 새로운 데이터를 삽입
    insertData: async (table, data) => {
        const columns = Object.keys(data).join(',');
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(',');
    
        await promisePool.query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
            values
        );
    },
    insertWarehouse: async (code, phone, address) => {
        await promisePool.query(
            `INSERT INTO warehouse (code, phone, address) VALUES (?, ?, ?)`,
            [code, phone, address]
        );
    },
    insertInventory: async (book_ISBN, warehouse_code, number) => {
        await promisePool.query(
            `INSERT INTO inventory (book_ISBN, warehouse_code, number) VALUES (?, ?, ?)`,
            [book_ISBN, warehouse_code, number]
        );
    },
    
};
export const updateSql = {
    updateData: async (table, primaryKeyValues, data) => {
        try {
            // 기본키 조건 생성
            const whereClause = Object.keys(primaryKeyValues)
                .map((key) => `${key} = ?`)
                .join(' AND ');
            const whereValues = Object.values(primaryKeyValues);
    
            // 업데이트 쿼리 생성
            const updates = Object.entries(data)
                .map(([key]) => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(data), ...whereValues];
    
            // 최종 SQL 쿼리
            const query = `UPDATE ${table} SET ${updates} WHERE ${whereClause}`;
            console.log('Generated Query:', query, 'with values:', values);
    
            // MySQL 쿼리 실행
            const [result] = await promisePool.query(query, values);
            console.log('Update Result:', result);
        } catch (error) {
            console.error('Error updating data:', error.message);
            throw error;
        } 
    },
//MySQL의 GET_LOCK 함수를 사용해 특정 테이블과 키에 대해 락(Lock)
//데이터를 업데이트하거나 읽는 동안 다른 작업이 동일한 데이터에 접근하지 못하게 방지.
    acquireLock: async (table, lockKey) => {
        const [rows] = await promisePool.query(
            `SELECT GET_LOCK(?, 10) AS lockAcquired`,
            [`${table}_${lockKey}`]
        );
        return rows[0].lockAcquired === 1;
    },
    //MySQL의 RELEASE_LOCK 함수를 사용해 특정 테이블과 키에 대해 획득한 락을 해제
    releaseLock: async (table, lockKey) => {
        const [rows] = await promisePool.query(
            `SELECT RELEASE_LOCK(?) AS lockReleased`,
            [`${table}_${lockKey}`]
        );
        return rows[0].lockReleased === 1;
    },
};
export const deleteSql = {
    deleteData: async (table, primaryKey) => {
        try {
            // 테이블의 첫 번째 컬럼 이름 가져오기
            const primaryKeyColumn = getPrimaryKeyColumns(table);

            // DELETE 쿼리 실행
            const query = `DELETE FROM ${table} WHERE ${primaryKeyColumn} = ?`;
            console.log('Generated Query:', query, 'with primaryKey:', primaryKey);

            const [result] = await promisePool.query(query, [primaryKey]);
            console.log('Delete Result:', result);
            } catch (error) {
            console.error('Error deleting data:', error.message);
            throw error;
        }
    },
};
export const getPrimaryKeyColumns = (table) => {
    switch (table) {
        case 'inventory':
            return ['book_ISBN', 'warehouse_code'];
        case 'contains':
            return ['book_ISBN', 'shopping_basket_basketID'];
        default:
            return [getPrimaryKeyColumn(table)];
    }
};
export const getPrimaryKeyColumn = (table) => {
    switch (table) {
        case 'book':
            return 'ISBN';
        case 'author':
            return 'name';
        case 'warehouse':
            return 'code';
        default:
            throw new Error(`Unknown table: ${table}`);
    }
};

export const transactionSql = {
    // 트랜잭션 시작
    startTransaction: async () => {
        try {
            await promisePool.query('START TRANSACTION');
            console.log('Transaction started');
        } catch (error) {
            console.error('Error starting transaction:', error.message);
            throw error;
        }
    },

    // 트랜잭션 커밋
    commitTransaction: async () => {
        try {
            await promisePool.query('COMMIT');
            console.log('Transaction committed');
        } catch (error) {
            console.error('Error committing transaction:', error.message);
            throw error;
        }
    },

    // 트랜잭션 롤백
    rollbackTransaction: async () => {
        try {
            await promisePool.query('ROLLBACK');
            console.log('Transaction rolled back');
        } catch (error) {
            console.error('Error rolling back transaction:', error.message);
            throw error;
        }
    },
};
