-- 관리자 페이지 인덱스
-- Book, Author, Award, Warehouse, Inventory, Contains 테이블에서 데이터를 빠르게 조회 및 수정
CREATE INDEX idx_book_isbn ON Book(ISBN);
CREATE INDEX idx_author_name ON Author(name);
CREATE INDEX idx_award_name ON Award(name);
CREATE INDEX idx_warehouse_code ON Warehouse(code);
CREATE INDEX idx_inventory_keys ON Inventory(book_ISBN, warehouse_code); -- 복합 키
CREATE INDEX idx_contains_keys ON Contains(book_ISBN, shopping_basket_basketID); -- 복합 키

-- Customer 페이지 인덱스
-- 검색 및 수량 확인
CREATE INDEX idx_book_title ON Book(title);
CREATE INDEX idx_book_category ON Book(category);
CREATE INDEX idx_author_name1 ON Author(name);
CREATE INDEX idx_award_name1 ON Award(name);
CREATE INDEX idx_inventory_book_isbn ON Inventory(book_ISBN);

-- Reservation과 Shopping_basket 관련 인덱스
-- 고객별 예약 및 쇼핑 바구니 조회, 업데이트
CREATE INDEX idx_reservation_customer ON Reservation(Email); -- 고객 이메일로 조회
CREATE INDEX idx_reservation_keys ON Reservation(book_ISBN, reservation_date, pickup_date, pickup_time); -- 예약 관련 복합 키
CREATE INDEX idx_shopping_basket_customer ON Basket_of(customer_Email, shopping_basket_basketID); -- 고객의 쇼핑 바구니 연결
CREATE INDEX idx_contains_shopping_basket ON Contains(shopping_basket_basketID, book_ISBN); -- 쇼핑 바구니와 책 연결

-- 예약 및 구매 충돌 방지
CREATE UNIQUE INDEX idx_reservation_conflict ON Reservation(pickup_date, pickup_time); -- 예약 시간 충돌 방지
CREATE INDEX idx_inventory_check ON Inventory(book_ISBN, warehouse_code, number); -- 책의 수량 확인

-- 고객 정보 조회
CREATE INDEX idx_customer_email ON Customer(Email); -- 고객 이메일로 검색
