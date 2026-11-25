# Lab 05: API Testing
- Нэр: Т.Төгөлдөр
- Код: B242270050
- node -v: v25.8.1
- newman -v: 6.2.2

## Тест дизайн (Лекц 5-ын 5 алхам)
# 7-р мөр: оюутан ч, хичээл ч байхгүй
curl -s -w "\nstatus=%{http_code}\n" -X POST localhost:3000/registrations -H 'Content-Type: application/json' -d '{"studentID":"NOSUCH","courseID":"NOSUCH"}'
# 8-р мөр: идэвхгүй оюутан + урьдач дутуу
curl -s -X PUT localhost:3000/students/INACT1 -H 'Content-Type: application/json' -d '{"status":"inactive","coursesTaken":[]}'
curl -s -X PUT localhost:3000/courses/CS313 -H 'Content-Type: application/json' -d '{"prerequisites":["CS201"]}'
curl -s -w "\nstatus=%{http_code}\n" -X POST localhost:3000/registrations -H 'Content-Type: application/json' -d '{"studentID":"INACT1","courseID":"CS313"}'
Тестлэгдэх функц: `POST /registrations` (хичээлд бүртгүүлэх)

### 1. Сонголтууд ба эквивалент ангиуд

| Сонголт | Эквивалент ангиуд |
|---|---|
| studentID-гийн төлөв | идэвхтэй / идэвхгүй / байхгүй |
| Оюутны үзсэн хичээлүүд | урьдач хангана / хангахгүй |
| courseID-гийн хүчинтэй байдал | байгаа / байхгүй |
| Хичээлийн урьдач нөхцөл | бүгд үзсэн / огт үзээгүй / зарим нь үзсэн |
| Хүсэлтийн бүтэц | бүрэн / талбар дутуу |

### 2. Төлөөлөх утгууд

| Анги | Төлөөлөх утга |
|---|---|
| Идэвхтэй оюутан | `{"status":"active","coursesTaken":["CS201"]}` |
| Идэвхгүй оюутан | `{"status":"inactive","coursesTaken":[]}` |
| Байхгүй оюутан | `NOSUCH` (PUT хийгээгүй ID) |
| Байгаа хичээл | `CS313`, `{"prerequisites":["CS201"]}` |
| Байхгүй хичээл | `NOSUCH` |
| Бүгд үзсэн | prerequisites `["CS201"]`, coursesTaken `["CS201"]` |
| Огт үзээгүй | prerequisites `["CS201"]`, coursesTaken `[]` |
| Зарим нь үзсэн | prerequisites `["CS201","CS202"]`, coursesTaken `["CS201"]` |
| Урьдачгүй хичээл | prerequisites `[]` |

### 3. Спецификацийн хүснэгт

| # | Спецификаци | Хүлээгдэх статус | Хүлээгдэх result |
|---|---|---|---|
| 1 | Happy path: идэвхтэй оюутан, урьдач хангасан | 201 | OK |
| 2 | Оюутан байхгүй | 200 | ERROR_NO_STUDENT |
| 3 | Идэвхгүй оюутан | 200 | ERROR_INACTIVE_STUDENT |
| 4 | Хичээл байхгүй | 200 | ERROR_NO_COURSE |
| 5 | Урьдач нөхцөл огт үзээгүй | 200 | ERROR_PREREQUISITES (missing: ["CS201"]) |
| 6 | Зарим урьдач дутуу | 200 | ERROR_PREREQUISITES (missing: ["CS202"]) |
| 7 | Давхар алдаа: оюутан ч, хичээл ч байхгүй | ? | ? |
| 8 | Давхар алдаа: идэвхгүй оюутан + урьдач дутуу | ? | ? |
| 9 | Хязгаар: урьдачгүй хичээл | 201 | OK |
| 10 | Хязгаар: хоосон coursesTaken, урьдачтай хичээл | 200 | ERROR_PREREQUISITES |
| 11 | Хязгаар: courseID талбар дутуу | 400 | ERROR_BAD_REQUEST |
| 3 | Идэвхгүй оюутан | 200 | ERROR_INACTIVE_STUDENT |
| 4 | Хичээл байхгүй | 200 | ERROR_NO_COURSE |
| 5 | Урьдач нөхцөл огт үзээгүй | 200 | ERROR_PREREQUISITES (missing: ["CS201"]) |
| 6 | Зарим урьдач дутуу | 200 | ERROR_PREREQUISITES (missing: ["CS202"]) |
| 7 | Давхар алдаа: оюутан ч, хичээл ч байхгүй | ? | ? |
| 8 | Давхар алдаа: идэвхгүй оюутан + урьдач дутуу | ? | ? |
| 9 | Хязгаар: урьдачгүй хичээл | 201 | OK |
| 10 | Хязгаар: хоосон coursesTaken, урьдачтай хичээл | 200 | ERROR_PREREQUISITES |
| 11 | Хязгаар: courseID талбар дутуу | 400 | ERROR_BAD_REQUEST |

## Тест дизайн

Тестлэгдэх функц: `POST /registrations`

### Сонголтууд ба эквивалент ангиуд

| Сонголт | Эквивалент ангиуд |
|---|---|
| studentID-гийн төлөв | идэвхтэй / идэвхгүй / байхгүй |
| Оюутны үзсэн хичээлүүд | урьдач хангана / хангахгүй |
| courseID-гийн хүчинтэй байдал | байгаа / байхгүй |
| Хичээлийн урьдач нөхцөл | бүгд үзсэн / огт үзээгүй / зарим нь үзсэн |
| Хүсэлтийн бүтэц | бүрэн / талбар дутуу |

### Төлөөлөх утгууд

| Анги | Төлөөлөх утга |
|---|---|
| Идэвхтэй оюутан | status=active, coursesTaken=["CS201"] |
| Идэвхгүй оюутан | status=inactive |
| Байхгүй оюутан/хичээл | PUT хийгээгүй ID |
| Бүгд үзсэн | prerequisites=["CS201"], coursesTaken=["CS201"] |
| Огт үзээгүй | prerequisites=["CS201"], coursesTaken=[] |
| Зарим нь | prerequisites=["CS201","CS202"], coursesTaken=["CS201"] |
| Урьдачгүй | prerequisites=[] |

### Спецификацийн хүснэгт

| # | Спецификаци | Статус | result |
|---|---|---|---|
| 1 | Happy path | 201 | OK |
| 2 | Оюутан байхгүй | 200 | ERROR_NO_STUDENT |
| 3 | Идэвхгүй оюутан | 200 | ERROR_INACTIVE_STUDENT |
| 4 | Хичээл байхгүй | 200 | ERROR_NO_COURSE |
| 5 | Урьдач огт үзээгүй | 200 | ERROR_PREREQUISITES |
| 6 | Зарим урьдач дутуу | 200 | ERROR_PREREQUISITES |
| 7 | Давхар алдаа: оюутан+хичээл байхгүй | ? | ? |
| 8 | Давхар алдаа: идэвхгүй+урьдач дутуу | ? | ? |
| 9 | Хязгаар: урьдачгүй хичээл | 201 | OK |
| 10 | Хязгаар: хоосон coursesTaken | 200 | ERROR_PREREQUISITES |
| 11 | Хязгаар: courseID дутуу | 400 | ERROR_BAD_REQUEST |
