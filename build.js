const fs = require('fs');
const H = [{ key: 'Content-Type', value: 'application/json' }];

function req(name, method, path, body, tests) {
  const item = {
    name,
    request: {
      method,
      header: H,
      url: { raw: '{{baseUrl}}' + path, host: ['{{baseUrl}}'], path: path.split('/').filter(Boolean) }
    }
  };
  if (body !== undefined) item.request.body = { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body) };
  if (tests) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }];
  return item;
}

function oracle(status, result, extra) {
  const lines = [
    `pm.test('Статус ${status}', function () { pm.response.to.have.status(${status}); });`,
    `pm.test('result = ${result}', function () { pm.expect(pm.response.json().result).to.eql('${result}'); });`
  ];
  if (extra) lines.push(extra);
  return lines;
}

function folder(name, setups, post, tests) {
  return {
    name,
    item: [
      ...setups.map((s, i) => req(`Setup ${i + 1}: ${s.method} ${s.path}`, s.method, s.path, s.body)),
      req(name, 'POST', '/registrations', post, tests)
    ]
  };
}

const put = (path, body) => ({ method: 'PUT', path, body });

const items = [
  folder('1. Идэвхтэй оюутан урьдач хангасан үед бүртгэгдэнэ',
    [put('/students/T1_STU', { status: 'active', coursesTaken: ['CS201'] }), put('/courses/T1_CRS', { prerequisites: ['CS201'] })],
    { studentID: 'T1_STU', courseID: 'T1_CRS' },
    [...oracle(201, 'OK'), "pm.test('registrationID тоо байна', function () { pm.expect(pm.response.json().registrationID).to.be.a('number'); });"]),

  folder('2. Байхгүй оюутан бүртгүүлэхэд ERROR_NO_STUDENT',
    [put('/courses/T2_CRS', { prerequisites: [] })],
    { studentID: 'T2_NOSUCH', courseID: 'T2_CRS' },
    oracle(200, 'ERROR_NO_STUDENT')),

  folder('3. Идэвхгүй оюутан бүртгүүлэхэд ERROR_INACTIVE_STUDENT',
    [put('/students/T3_STU', { status: 'inactive', coursesTaken: ['CS201'] }), put('/courses/T3_CRS', { prerequisites: ['CS201'] })],
    { studentID: 'T3_STU', courseID: 'T3_CRS' },
    oracle(200, 'ERROR_INACTIVE_STUDENT')),

  folder('4. Байхгүй хичээлд бүртгүүлэхэд ERROR_NO_COURSE',
    [put('/students/T4_STU', { status: 'active', coursesTaken: ['CS201'] })],
    { studentID: 'T4_STU', courseID: 'T4_NOSUCH' },
    oracle(200, 'ERROR_NO_COURSE')),

  folder('5. Урьдач огт үзээгүй үед ERROR_PREREQUISITES',
    [put('/students/T5_STU', { status: 'active', coursesTaken: [] }), put('/courses/T5_CRS', { prerequisites: ['CS201'] })],
    { studentID: 'T5_STU', courseID: 'T5_CRS' },
    oracle(200, 'ERROR_PREREQUISITES', "pm.test('missing = [CS201]', function () { pm.expect(pm.response.json().missing).to.eql(['CS201']); });")),

  folder('6. Зарим урьдач дутуу үед missing зөвхөн дутууг агуулна',
    [put('/students/T6_STU', { status: 'active', coursesTaken: ['CS201'] }), put('/courses/T6_CRS', { prerequisites: ['CS201', 'CS202'] })],
    { studentID: 'T6_STU', courseID: 'T6_CRS' },
    oracle(200, 'ERROR_PREREQUISITES', "pm.test('missing = [CS202]', function () { pm.expect(pm.response.json().missing).to.eql(['CS202']); });")),

  folder('7. Давхар алдаа: оюутан ч хичээл ч байхгүй',
    [],
    { studentID: 'T7_NOSUCH', courseID: 'T7_NOSUCH' },
    oracle(200, 'ERROR_NO_STUDENT')),

  folder('8. Давхар алдаа: идэвхгүй оюутан + урьдач дутуу',
    [put('/students/T8_STU', { status: 'inactive', coursesTaken: [] }), put('/courses/T8_CRS', { prerequisites: ['CS201'] })],
    { studentID: 'T8_STU', courseID: 'T8_CRS' },
    oracle(200, 'ERROR_INACTIVE_STUDENT')),

  folder('9. Хязгаар: урьдачгүй хичээлд бүртгүүлж болно',
    [put('/students/T9_STU', { status: 'active', coursesTaken: [] }), put('/courses/T9_CRS', { prerequisites: [] })],
    { studentID: 'T9_STU', courseID: 'T9_CRS' },
    oracle(201, 'OK')),

  folder('10. Хязгаар: хоосон coursesTaken, урьдачтай хичээл',
    [put('/students/T10_STU', { status: 'active', coursesTaken: [] }), put('/courses/T10_CRS', { prerequisites: ['CS201'] })],
    { studentID: 'T10_STU', courseID: 'T10_CRS' },
    oracle(200, 'ERROR_PREREQUISITES')),

  folder('11. Хязгаар: courseID талбар дутуу үед 400 ERROR_BAD_REQUEST',
    [put('/students/T11_STU', { status: 'active', coursesTaken: [] })],
    { studentID: 'T11_STU' },
    oracle(400, 'ERROR_BAD_REQUEST'))
];

const collection = {
  info: { name: 'Lab05', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }],
  item: items
};

const out = process.argv[2] || 'lab05-collection.json';
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log('wrote', out);
