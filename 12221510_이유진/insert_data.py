import random
import string
from datetime import datetime

# ISBN 생성기
def generate_isbn():
    return ''.join(random.choices(string.digits, k=13))

# 랜덤 제목 생성기
def generate_title():
    titles = ["Great Adventure", "Mystery Tales", "Science Wonders", "Fantasy World", "Classic Love Story"]
    return random.choice(titles) + " " + ''.join(random.choices(string.ascii_letters, k=5))

# 랜덤 카테고리 생성기
def generate_category():
    categories = ["Fiction", "Non-Fiction", "Science", "Fantasy", "Mystery", "History", "Biography"]
    return random.choice(categories)

# 랜덤 가격 생성기
def generate_price():
    return random.randint(1000, 50000)

# 랜덤 연도 생성기
def generate_year():
    return random.randint(1980, datetime.now().year)

# SQL 파일 생성
def generate_sql_file(file_name, total_records):
    try:
        with open(file_name, 'w', encoding='utf-8') as file:
            # SQL 파일 헤더
            file.write("-- SQL Script to Insert Data into Book Table\nSTART TRANSACTION;\n")
            file.write("INSERT INTO Book (ISBN, title, category, price, year) VALUES\n")

            for i in range(total_records):
                isbn = generate_isbn()
                title = generate_title()
                category = generate_category()
                price = generate_price()
                year = generate_year()

                # INSERT 데이터 생성
                row = f"('{isbn}', '{title}', '{category}', '{price}', {year})"

                # 마지막 줄이 아닌 경우 쉼표 추가
                if i < total_records - 1:
                    row += ",\n"
                else:
                    row += ";\n"  # 마지막 줄은 세미콜론으로 종료

                # 파일에 기록
                file.write(row)
            file.write("COMMIT;\n")
        print(f"SQL file '{file_name}' created successfully with {total_records} records.")

    except Exception as e:
        print("Error creating SQL file:", e)

# 실행
if __name__ == "__main__":
    file_name = "insert_data1.sql"  # 출력 SQL 파일 이름
    total_records = 100000          # 생성할 데이터 개수
    generate_sql_file(file_name, total_records)
