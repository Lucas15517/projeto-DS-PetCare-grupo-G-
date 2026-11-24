'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'petcare-tests-'));
process.env.PETCARE_DATA_DIR = temporaryDirectory;
process.env.PETCARE_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';

// No modo SQLite, crie um banco do esquema antigo para validar a migração real.
if (process.env.PETCARE_STORAGE === 'sqlite') {
  const { DatabaseSync } = require('node:sqlite');
  const legacyDb = new DatabaseSync(path.join(temporaryDirectory, 'petcare.sqlite'));
  legacyDb.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cliente'
    );
    CREATE TABLE pets (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT DEFAULT '',
      age INTEGER DEFAULT 0
    );
    CREATE TABLE services (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL
    );
    CREATE TABLE appointments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      pet_id INTEGER NOT NULL REFERENCES pets(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'agendado',
      note TEXT DEFAULT ''
    );
    CREATE UNIQUE INDEX unique_active_slot
      ON appointments(date, time) WHERE status = 'agendado';
    INSERT INTO users (id, name, email, salt, password_hash, role)
      VALUES (700, 'Conta legada', 'legado@example.test', 'salt-legado', 'hash-legado', 'cliente');
    INSERT INTO pets (id, user_id, name, species, breed, age)
      VALUES (700, 700, 'Pet legado', 'Cachorro', 'SRD', 4);
    INSERT INTO services (id, name, price) VALUES (1, 'Banho', 45.00);
    INSERT INTO appointments (id, user_id, pet_id, service_id, date, time, status, note)
      VALUES (700, 700, 700, 1, '2099-10-01', '10:00', 'agendado', 'Registro migrado');
  `);
  legacyDb.close();
}

const { server, _testing, store } = require('./server');

test('PetCare: segurança, agendamentos, histórico, orientações e limites', async (t) => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(route, method = 'GET', body, token = '', extraHeaders = {}) {
    const response = await fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json();
    return { status: response.status, data };
  }

  if (store.mode === 'sqlite') {
    await t.test('migração preserva usuários, pets, serviços e agendamentos antigos', () => {
      const legacyUser = store.getUserById(700);
      assert.equal(legacyUser.name, 'Conta legada');
      assert.equal(store.getPet(700, 700).name, 'Pet legado');
      assert.equal(store.getService(1).price_cents, 4500);
      const legacyAppointments = store.listAppointments(700);
      assert.equal(legacyAppointments.length, 1);
      assert.equal(legacyAppointments[0].pet_name, 'Pet legado');
      assert.equal(legacyAppointments[0].note, 'Registro migrado');
    });

    await t.test('SQLite mantém as chaves estrangeiras ativas', () => {
      assert.equal(store._testing.foreignKeysEnabled(), 1);
      assert.throws(() => store.createPet({
        user_id: 999999,
        name: 'Pet inválido',
        species: 'Cachorro',
        breed: '',
        age: 1
      }), /FOREIGN KEY constraint failed/);
    });
  }

  await t.test('serviços usam preços inteiros em centavos', async () => {
    const result = await request('/api/services');
    assert.equal(result.status, 200);
    assert.equal(result.data[0].price_cents, 4500);
    assert.equal(Number.isInteger(result.data[0].price_cents), true);
  });

  const stamp = Date.now();
  const accountA = await request('/api/register', 'POST', {
    name: 'Cliente A',
    email: 'cliente-a-' + stamp + '@example.test',
    password: 'senha-segura-123'
  });
  const accountB = await request('/api/register', 'POST', {
    name: 'Cliente B',
    email: 'cliente-b-' + stamp + '@example.test',
    password: 'senha-segura-123'
  });
  assert.equal(accountA.status, 201);
  assert.equal(accountB.status, 201);

  await t.test('senha incorreta retorna 401', async () => {
    const result = await request('/api/login', 'POST', {
      email: 'cliente-a-' + stamp + '@example.test',
      password: 'senha-incorreta'
    });
    assert.equal(result.status, 401);
  });

  const petA = await request('/api/pets', 'POST', {
    name: 'Thor', species: 'Cachorro', breed: 'SRD', age: 2
  }, accountA.data.token);
  const petB = await request('/api/pets', 'POST', {
    name: 'Mel', species: 'Gato', breed: '', age: 1
  }, accountB.data.token);
  assert.equal(petA.status, 201);
  assert.equal(petB.status, 201);

  const inconsistentAppointment = store.createAppointment({
    user_id: accountA.data.user.id,
    pet_id: petB.data.id,
    service_id: 1,
    date: '2099-12-01',
    time: '17:00',
    note: 'Registro inconsistente para teste de isolamento'
  });
  store.updateAppointmentStatus(
    accountA.data.user.id,
    inconsistentAppointment.id,
    'cancelado'
  );

  await t.test('histórico não revela dados de pets pertencentes a outra conta', () => {
    const appointments = store.listAppointments(accountA.data.user.id);
    assert.equal(
      appointments.some((appointment) => appointment.id === inconsistentAppointment.id),
      false
    );
  });

  await t.test('um usuário não acessa o pet de outra conta', async () => {
    const result = await request('/api/pets/' + petB.data.id, 'PUT', {
      name: 'Alteração indevida', species: 'Gato', breed: '', age: 1
    }, accountA.data.token);
    assert.equal(result.status, 404);
  });

  await t.test('agendamento no passado retorna 400', async () => {
    const result = await request('/api/appointments', 'POST', {
      pet_id: petA.data.id, service_id: 1, date: '2000-01-01', time: '10:00'
    }, accountA.data.token);
    assert.equal(result.status, 400);
  });

  const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  const bookingA = {
    pet_id: petA.data.id, service_id: 1, date: futureDate, time: '11:00', note: ''
  };
  const bookingB = {
    pet_id: petB.data.id, service_id: 2, date: futureDate, time: '11:00', note: ''
  };
  const [first, second] = await Promise.all([
    request('/api/appointments', 'POST', bookingA, accountA.data.token),
    request('/api/appointments', 'POST', bookingB, accountB.data.token)
  ]);

  await t.test('duas reservas concorrentes geram 201 e 409', async () => {
    assert.deepEqual([first.status, second.status].sort(), [201, 409]);
  });

  const winner = first.status === 201
    ? { id: first.data.id, token: accountA.data.token, petId: petA.data.id }
    : { id: second.data.id, token: accountB.data.token, petId: petB.data.id };
  const loser = first.status === 409
    ? { booking: bookingA, token: accountA.data.token }
    : { booking: bookingB, token: accountB.data.token };

  await t.test('pet com horário ativo não pode ser arquivado', async () => {
    const result = await request('/api/pets/' + winner.petId, 'DELETE', undefined, winner.token);
    assert.equal(result.status, 409);
  });

  await request('/api/appointments/' + winner.id, 'PATCH', { status: 'cancelado' }, winner.token);
  const retry = await request('/api/appointments', 'POST', loser.booking, loser.token);
  assert.equal(retry.status, 201);
  const retryOwner = loser.token === accountA.data.token
    ? { token: accountA.data.token, petId: petA.data.id }
    : { token: accountB.data.token, petId: petB.data.id };
  await request('/api/appointments/' + retry.data.id, 'PATCH', { status: 'cancelado' }, retryOwner.token);

  await t.test('assistente de cuidados explica regras por espécie e idade', async () => {
    const result = await request('/api/care-advice?pet_id=' + petB.data.id, 'GET', undefined, accountB.data.token);
    assert.equal(result.status, 200);
    assert.equal(result.data.method, 'Sistema de regras explicável');
    assert.ok(result.data.recommendations.length >= 2);
    assert.match(result.data.notice, /não substituem/);
  });

  await t.test('arquivar pet preserva o histórico de atendimentos', async () => {
    const archived = await request('/api/pets/' + petB.data.id, 'DELETE', undefined, accountB.data.token);
    assert.equal(archived.status, 200);
    const pets = await request('/api/pets', 'GET', undefined, accountB.data.token);
    assert.equal(pets.data.some((pet) => pet.id === petB.data.id), false);
    const history = await request('/api/appointments', 'GET', undefined, accountB.data.token);
    assert.ok(history.data.some((appointment) => appointment.pet_name === 'Mel'));
  });

  await t.test('logout invalida o token no servidor', async () => {
    const loggedOut = await request('/api/logout', 'POST', {}, accountA.data.token);
    assert.equal(loggedOut.status, 200);
    const rejected = await request('/api/me', 'GET', undefined, accountA.data.token);
    assert.equal(rejected.status, 401);
  });

  await t.test('proxy só é confiável quando TRUST_PROXY=1', () => {
    const fakeRequest = {
      headers: { 'x-forwarded-for': '203.0.113.8, 10.0.0.2' },
      socket: { remoteAddress: '10.0.0.1' }
    };
    process.env.TRUST_PROXY = '0';
    assert.equal(_testing.clientIp(fakeRequest), '10.0.0.1');
    process.env.TRUST_PROXY = '1';
    assert.equal(_testing.clientIp(fakeRequest), '203.0.113.8');
    process.env.TRUST_PROXY = '0';
  });

  await t.test('limite de 20 tentativas é aplicado por IP', async () => {
    _testing.rateLimits.clear();
    const results = [];
    for (let index = 0; index < 21; index += 1) {
      results.push(await request('/api/login', 'POST', {
        email: 'inexistente-' + index + '@example.test',
        password: 'senha-segura-123'
      }));
    }
    assert.equal(results[19].status, 401);
    assert.equal(results[20].status, 429);
  });
});
