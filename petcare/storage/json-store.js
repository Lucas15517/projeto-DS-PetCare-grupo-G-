'use strict';

const fs = require('node:fs');
const path = require('node:path');

const legacyDirectory = path.join(__dirname, '..', 'escola-node20', 'data');
const legacyFile = path.join(legacyDirectory, 'petcare-escola.json');
const defaultDirectory = fs.existsSync(legacyFile) ? legacyDirectory : path.join(__dirname, '..', 'data');
const directory = process.env.PETCARE_DATA_DIR || defaultDirectory;
fs.mkdirSync(directory, { recursive: true });
const filename = path.join(directory, 'petcare-escola.json');

function initialData() {
  return {
    users: [],
    pets: [],
    services: [
      { id: 1, name: 'Banho', price_cents: 4500 },
      { id: 2, name: 'Tosa', price_cents: 5500 },
      { id: 3, name: 'Consulta', price_cents: 9000 },
      { id: 4, name: 'Corte de unhas', price_cents: 2000 }
    ],
    appointments: [],
    lastId: { users: 0, pets: 0, appointments: 0 }
  };
}

let data;
try {
  data = fs.existsSync(filename)
    ? JSON.parse(fs.readFileSync(filename, 'utf8'))
    : initialData();
} catch (error) {
  throw new Error('Não foi possível abrir o armazenamento JSON: ' + error.message);
}

for (const table of ['users', 'pets', 'services', 'appointments']) {
  if (!Array.isArray(data[table])) throw new Error('Estrutura inválida no armazenamento JSON: ' + table);
}
data.lastId ||= { users: 0, pets: 0, appointments: 0 };
for (const table of ['users', 'pets', 'appointments']) {
  const maximum = Math.max(0, ...data[table].map((row) => Number(row.id) || 0));
  data.lastId[table] = Math.max(Number(data.lastId[table]) || 0, maximum);
}
const now = new Date().toISOString();
for (const user of data.users) {
  user.token_version = Number(user.token_version) || 0;
  user.created_at ||= now;
  delete user.role;
}
for (const pet of data.pets) {
  pet.created_at ||= now;
  pet.deleted_at ??= null;
}
for (const service of data.services) {
  if (!Number.isInteger(service.price_cents)) {
    service.price_cents = Math.round(Number(service.price || 0) * 100);
  }
  delete service.price;
  service.created_at ||= now;
}
for (const appointment of data.appointments) appointment.created_at ||= now;

function persist() {
  const temporary = filename + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, filename);
}
persist();

function nextId(table) {
  data.lastId[table] += 1;
  return data.lastId[table];
}
function conflictError() {
  const error = new Error('Horário já reservado.');
  error.code = 'SLOT_TAKEN';
  return error;
}

module.exports = {
  mode: 'json',
  getUserById(id) {
    const user = data.users.find((row) => row.id === id);
    return user || null;
  },
  findUserByEmail(email) {
    return data.users.find((row) => row.email === email) || null;
  },
  createUser(input) {
    const user = {
      id: nextId('users'),
      name: input.name,
      email: input.email,
      salt: input.salt,
      password_hash: input.password_hash,
      token_version: 0,
      created_at: new Date().toISOString()
    };
    data.users.push(user);
    persist();
    return user;
  },
  incrementTokenVersion(id) {
    const user = data.users.find((row) => row.id === id);
    if (!user) return false;
    user.token_version += 1;
    persist();
    return true;
  },
  listPets(userId) {
    return data.pets
      .filter((pet) => pet.user_id === userId && !pet.deleted_at)
      .sort((a, b) => b.id - a.id)
      .map(({ id, name, species, breed, age, created_at }) =>
        ({ id, name, species, breed, age, created_at }));
  },
  getPet(userId, petId) {
    return data.pets.find((pet) =>
      pet.id === petId && pet.user_id === userId && !pet.deleted_at) || null;
  },
  createPet(input) {
    const pet = { ...input, id: nextId('pets'), created_at: new Date().toISOString(), deleted_at: null };
    data.pets.push(pet);
    persist();
    return pet;
  },
  updatePet(userId, petId, changes) {
    const pet = this.getPet(userId, petId);
    if (!pet) return false;
    Object.assign(pet, changes);
    persist();
    return true;
  },
  softDeletePet(userId, petId) {
    const pet = this.getPet(userId, petId);
    if (!pet) return false;
    pet.deleted_at = new Date().toISOString();
    persist();
    return true;
  },
  hasActiveAppointmentForPet(petId) {
    return data.appointments.some((row) =>
      row.pet_id === petId && row.status === 'agendado');
  },
  listServices() {
    return data.services.map(({ id, name, price_cents }) => ({ id, name, price_cents }));
  },
  getService(id) {
    return data.services.find((service) => service.id === id) || null;
  },
  listAppointments(userId) {
    return data.appointments
      .filter((row) => row.user_id === userId &&
        data.pets.some((pet) => pet.id === row.pet_id && pet.user_id === userId))
      .map((row) => ({
        ...row,
        pet_name: data.pets.find((pet) => pet.id === row.pet_id)?.name || 'Pet arquivado',
        service_name: data.services.find((service) => service.id === row.service_id)?.name || 'Serviço',
        price_cents: data.services.find((service) => service.id === row.service_id)?.price_cents || 0
      }))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  },
  createAppointment(input) {
    const conflict = data.appointments.some((row) =>
      row.date === input.date && row.time === input.time && row.status === 'agendado');
    if (conflict) throw conflictError();
    const appointment = {
      ...input,
      id: nextId('appointments'),
      status: 'agendado',
      created_at: new Date().toISOString()
    };
    data.appointments.push(appointment);
    persist();
    return appointment;
  },
  updateAppointmentStatus(userId, appointmentId, status) {
    const appointment = data.appointments.find((row) =>
      row.id === appointmentId && row.user_id === userId && row.status === 'agendado');
    if (!appointment) return false;
    appointment.status = status;
    persist();
    return true;
  }
};
