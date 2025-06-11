import express from 'express';
import { selectSql, insertSql, updateSql, deleteSql,getPrimaryKeyColumns, transactionSql} from '../database/sql'; // SQL 함수 import

const router = express.Router();

// 관리자 페이지 GET
router.get('/', async (req, res) => {
    try {
        await transactionSql.startTransaction();

        // 테이블 목록 가져오기
        const tables = ['book', 'author', 'award', 'warehouse', 'inventory', 'contains'];
        res.render('administer', { title: 'Administer Page', tables });
        await transactionSql.commitTransaction();
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error fetching tables:', error.message);
        res.status(500).send('Internal server error.');
    }
});

// 특정 테이블의 데이터 조회
router.post('/select', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const { table } = req.body;
        const data = await selectSql.getTableData(table); // 테이블 데이터 가져오기
        res.render('administer', {
            title: `Administer - ${table}`,
            table,
            data,
        });        
        await transactionSql.commitTransaction();
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error fetching table data:', error.message);
        res.status(500).send('Internal server error.');
    }
});

// 데이터 삽입
router.post('/insert', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const { table, ...data } = req.body;
        if (table === 'warehouse') {
            const { code, phone, address, book_ISBN, number } = data;

            // warehouse와 inventory 동시에 삽입
            await insertSql.insertWarehouse(code, phone, address);
            await insertSql.insertInventory(book_ISBN, code, number);
        } else {
            await insertSql.insertData(table, data);
        }
        await transactionSql.commitTransaction();
        res.send('<script>alert("Insert successful!"); window.location="/administer";</script>');
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error inserting data:', error.message);
        res.status(500).send('Internal server error.');
    }
});
 
// 데이터 수정
router.post('/update', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const { table, ...data } = req.body;

        // 테이블의 기본키 컬럼 가져오기
        const primaryKeyColumns = getPrimaryKeyColumns(table);
        const primaryKeyValues = {};
        primaryKeyColumns.forEach((column) => {
            if (!data[column]) {
                return res.send(`<script>alert("Primary key value for column ${column} is missing."); window.location="/administer";</script>`);
            }
            primaryKeyValues[column] = data[column];
            delete data[column]; // 기본키 컬럼은 수정 대상에서 제거
        });

        // 첫 번째 기본키 컬럼만 잠금 키로 사용
        const lockKey = primaryKeyValues[primaryKeyColumns[0]];
        if (!lockKey) {
            return res.send('<script>alert("Primary key value for the first column is missing."); window.location="/administer";</script>');
        }

        console.log('Primary key columns:', primaryKeyColumns, 'Values:', primaryKeyValues, 'Data:', data);

        // 잠금 시도
        const lockAcquired = await updateSql.acquireLock(table, lockKey);
        if (!lockAcquired) {
            return res.send('<script>alert("Data is being edited by another admin."); window.location="/administer";</script>');
        }

        // 업데이트 호출
        await updateSql.updateData(table, primaryKeyValues, data);

        // 잠금 해제
        await updateSql.releaseLock(table, lockKey);

        await transactionSql.commitTransaction();
        res.send('<script>alert("Update successful!"); window.location="/administer";</script>');
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error updating data:', error.message);
        res.status(500).send('Internal server error.');
    }
});


// 데이터 삭제
router.post('/delete', async (req, res) => {
    try {
        await transactionSql.startTransaction();
        const { table, ...data } = req.body;

        // 테이블의 기본키 컬럼 가져오기
        const primaryKeyColumns = getPrimaryKeyColumns(table);
        const primaryKeyValues = {};
        primaryKeyColumns.forEach((column) => {
            if (!data[column]) {
                return res.send(`<script>alert("Primary key value for column ${column} is missing."); window.location="/administer";</script>`);
            }
            primaryKeyValues[column] = data[column];
            delete data[column]; // 기본키 컬럼은 수정 대상에서 제거
        });

        // 첫 번째 기본키 컬럼만 잠금 키로 사용
        const lockKey = primaryKeyValues[primaryKeyColumns[0]];
        // DELETE 호출
        await deleteSql.deleteData(table, lockKey);

        await transactionSql.commitTransaction();
        res.send('<script>alert("Delete successful!"); window.location="/administer";</script>');
    } catch (error) {
        await transactionSql.rollbackTransaction();
        console.error('Error deleting data:', error.message);
        res.status(500).send('Internal server error.');
    }
});



export default router;
