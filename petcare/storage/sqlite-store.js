'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const legacyDirectory = path.join(__dirname, '..', 'online-sqlite', 'data');
const legacyFile = path.join(legacyDirectory, 'petcare.sqlite');
const defaultDirectory = fs.existsSync(legacyFile) ? legacyDirectory : path.join(__dirname, '..', 'data');
const directory = process.env.PETCARE_DATA_DIR ||
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  defaultDirectory;

if (process.env.NODE_ENV === 'production' &&
    !process.env.PETCARE_DATA_DIR && !process.env.RAILWAY_VOLUME_MOUNT_PATH) {
  throw new Error('Configure um volume persistente e PETCARE_DATA_DIR ou RAILWAY_VOLUME_MOUNT_PATH.');
}

fs.mkdirSync(directory, { recursive: true });
const db = new DatabaseSync(path.join(directory, 'petcare.sqlite'));
db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');

function tableExists(name) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name));
}
function columns(table) {
  return tableExists(table)
    ? db.prepare('PRAGMA table_info("' + table + '")').all().map((row) => row.name)
    : [];
}
function value(row, key, fallback) {
  return Object.prototype.hasOwnProperty.call(row, key) && row[key] !== null
    ? row[key] : fallback;
}

function migrate() {
  const currentVersion = db.prepare('PRAGMA user_version').get().user_version;
  if (currentVersion >= 2) {
    // PRAGMA foreign_keys é por conexão e começa desativado no SQLite.
    // Reative também quando o banco já estiver na versão atual.
    db.exec('PRAGMA foreign_keys = ON;');
    return;
  }

  db.exec('PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE;');
  const legacy = {};
  try {
    for (const table of ['appointments', 'pets', 'services', 'users']) {
      if (tableExists(table)) {
        db.exec('ALTER TABLE "' + table + '" RENAME TO "' + table + '_legacy"');
        legacy[table] = true;
      }
    }

    db.exec([
      'CREATE TABLE users (',
      '  id INTEGER PRIMARY KEY,',
      '  name TEXT NOT NULL,',
      '  email TEXT NOT NULL UNIQUE,',
      '  salt TEXT NOT NULL,',
      '  password_hash TEXT NOT NULL,',
      '  token_version INTEGER NOT NULL DEFAULT 0,',
      '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
      ');',
      'CREATE TABLE pets (',
      '  id INTEGER PRIMARY KEY,',
      '  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,',
      '  name TEXT NOT NULL,',
      '  species TEXT NOT NULL,',
      "  breed TEXT NOT NULL DEFAULT '',",
      '  age INTEGER NOT NULL DEFAULT 0 CHECK (age BETWEEN 0 AND 40),',
      '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
      '  deleted_at TEXT',
      ');',
      'CREATE TABLE services (',
      '  id INTEGER PRIMARY KEY,',
      '  name TEXT NOT NULL,',
      '  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),',
      '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
      ');',
      'CREATE TABLE appointments (',
      '  id INTEGER PRIMARY KEY,',
      '  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,',
      '  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,',
      '  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,',
      '  date TEXT NOT NULL,',
      '  time TEXT NOT NULL,',
      "  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'cancelado', 'concluido')),",
      "  note TEXT NOT NULL DEFAULT '',",
      '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
      ');'
    ].join('\n'));

    if (legacy.users) {
      const oldColumns = columns('users_legacy');
      for (const row of db.prepare('SELECT * FROM users_legacy').all()) {
        db.prepare('INSERT INTO users (id, name, email, salt, password_hash, token_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          row.id, row.name, row.email, row.salt, row.password_hash,
          oldColumns.includes('token_version') ? value(row, 'token_version', 0) : 0,
          oldColumns.includes('created_at') ? value(row, 'created_at', new Date().toISOString()) : new Date().toISOString()
        );
      }
    }

    if (legacy.pets) {
      const oldColumns = columns('pets_legacy');
      for (const row of db.prepare('SELECT * FROM pets_legacy').all()) {
        db.prepare('INSERT INTO pets (id, user_id, name, species, breed, age, created_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          row.id, row.user_id, row.name, row.species,
          value(row, 'breed', ''),
          value(row, 'age', 0),
          oldColumns.includes('created_at') ? value(row, 'created_at', new Date().toISOString()) : new Date().toISOString(),
          oldColumns.includes('deleted_at') ? value(row, 'deleted_at', null) : null
        );
      }
    }

    if (legacy.services) {
      const oldColumns = columns('services_legacy');
      for (const row of db.prepare('SELECT * FROM services_legacy').all()) {
        const cents = oldColumns.includes('price_cents')
          ? Number(row.price_cents)
          : Math.round(Number(value(row, 'price', 0)) * 100);
        db.prepare('INSERT INTO services (id, name, price_cents, created_at) VALUES (?, ?, ?, ?)').run(
          row.id, row.name, cents,
          oldColumns.includes('created_at') ? value(row, 'created_at', new Date().toISOString()) : new Date().toISOString()
        );
      }
    }

    if (legacy.appointments) {
      const oldColumns = columns('appointments_legacy');
      for (const row of db.prepare('SELECT * FROM appointments_legacy').all()) {
        db.prepare('INSERT INTO appointments (id, user_id, pet_id, service_id, date, time, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          row.id, row.user_id, row.pet_id, row.service_id, row.date, row.time,
          value(row, 'status', 'agendado'), value(row, 'note', ''),
          oldColumns.includes('created_at') ? value(row, 'created_at', new Date().toISOString()) : new Date().toISOString()
        );
      }
    }

    for (const table of ['appointments', 'pets', 'services', 'users']) {
      if (legacy[table]) db.exec('DROP TABLE "' + table + '_legacy"');
    }

    db.exec([
      'CREATE INDEX IF NOT EXISTS pets_by_user ON pets(user_id, deleted_at);',
      'CREATE INDEX IF NOT EXISTS appointments_by_user ON appointments(user_id, date, time);',
      "CREATE UNIQUE INDEX IF NOT EXISTS unique_active_slot ON appointments(date, time) WHERE status = 'agendado';",
      'PRAGMA user_version = 2;',
      'COMMIT;',
      'PRAGMA foreign_keys = ON;'
    ].join('\n'));
  } catch (error) {
    try { db.exec('ROLLBACK; PRAGMA foreign_keys = ON;'); } catch {}
    throw error;
  }

  const violations = db.prepare('PRAGMA foreign_key_check').all();
  if (violations.length) throw new Error('A migração encontrou referências inválidas no banco de dados.');
}

migrate();

const insertService = db.prepare(
  'INSERT OR IGNORE INTO services (id, name, price_cents) VALUES (?, ?, ?)'
);
for (const service of [
  [1, 'Banho', 4500],
  [2, 'Tosa', 5500],
  [3, 'Consulta', 9000],
  [4, 'Corte de unhas', 2000]
]) insertService.run(...service);

function conflictError() {
  const error = new Error('Horário já reservado.');
  error.code = 'SLOT_TAKEN';
  return error;
}

module.exports = {
  mode: 'sqlite',
  getUserById(id) {
    return db.prepare('SELECT id, name, email, token_version, created_at FROM users WHERE id = ?').get(id) || null;
  },
  findUserByEmail(email) {
    return db.prepare('SELECT id, name, email, salt, password_hash, token_version, created_at FROM users WHERE email = ?').get(email) || null;
  },
  createUser(input) {
    const result = db.prepare('INSERT INTO users (name, email, salt, password_hash) VALUES (?, ?, ?, ?)').run(
      input.name, input.email, input.salt, input.password_hash
    );
    return this.getUserById(Number(result.lastInsertRowid));
  },
  incrementTokenVersion(id) {
    const result = db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(id);
    return result.changes > 0;
  },
  listPets(userId) {
    return db.prepare('SELECT id, name, species, breed, age, created_at FROM pets WHERE user_id = ? AND deleted_at IS NULL ORDER BY id DESC').all(userId);
  },
  getPet(userId, petId) {
    return db.prepare('SELECT id, user_id, name, species, breed, age, created_at FROM pets WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(petId, userId) || null;
  },
  createPet(input) {
    const result = db.prepare('INSERT INTO pets (user_id, name, species, breed, age) VALUES (?, ?, ?, ?, ?)').run(
      input.user_id, input.name, input.species, input.breed, input.age
    );
    return { id: Number(result.lastInsertRowid) };
  },
  updatePet(userId, petId, changes) {
    const result = db.prepare('UPDATE pets SET name = ?, species = ?, breed = ?, age = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL').run(
      changes.name, changes.species, changes.breed, changes.age, petId, userId
    );
    return result.changes > 0;
  },
  softDeletePet(userId, petId) {
    const result = db.prepare('UPDATE pets SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL').run(petId, userId);
    return result.changes > 0;
  },
  hasActiveAppointmentForPet(petId) {
    return Boolean(db.prepare("SELECT id FROM appointments WHERE pet_id = ? AND status = 'agendado' LIMIT 1").get(petId));
  },
  listServices() {
    return db.prepare('SELECT id, name, price_cents FROM services ORDER BY id').all();
  },
  getService(id) {
    return db.prepare('SELECT id, name, price_cents FROM services WHERE id = ?').get(id) || null;
  },
  listAppointments(userId) {
    return db.prepare('SELECT a.id, a.user_id, a.pet_id, a.service_id, a.date, a.time, a.status, a.note, a.created_at, p.name AS pet_name, s.name AS service_name, s.price_cents FROM appointments a JOIN pets p ON p.id = a.pet_id JOIN services s ON s.id = a.service_id WHERE a.user_id = ? ORDER BY a.date DESC, a.time DESC').all(userId);
  },
  createAppointment(input) {
    try {
      const result = db.prepare('INSERT INTO appointments (user_id, pet_id, service_id, date, time, note) VALUES (?, ?, ?, ?, ?, ?)').run(
        input.user_id, input.pet_id, input.service_id, input.date, input.time, input.note
      );
      return { id: Number(result.lastInsertRowid) };
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw conflictError();
      throw error;
    }
  },
  updateAppointmentStatus(userId, appointmentId, status) {
    const result = db.prepare("UPDATE appointments SET status = ? WHERE id = ? AND user_id = ? AND status = 'agendado'").run(
      status, appointmentId, userId
    );
    return result.changes > 0;
  },
  _testing: {
    foreignKeysEnabled() {
      return db.prepare('PRAGMA foreign_keys').get().foreign_keys;
    }
  }
};
