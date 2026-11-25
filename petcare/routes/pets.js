'use strict';

module.exports = async function petRoutes(context) {
  const { route, method, send, store, user, readJson } = context;

  if (route === '/api/pets' && method === 'GET') {
    send(context.res, 200, store.listPets(user.id));
    return true;
  }

  if (route === '/api/pets' && method === 'POST') {
    const body = await readJson(context.req);
    const name = String(body.name || '').trim();
    const species = String(body.species || '').trim();
    const breed = String(body.breed || '').trim();
    const age = Number(body.age ?? 0);
    if (!name || name.length > 80 || !['Cachorro', 'Gato', 'Outro'].includes(species) ||
        breed.length > 80 || !Number.isInteger(age) || age < 0 || age > 40) {
      send(context.res, 400, { error: 'Dados do pet inválidos.' });
      return true;
    }
    const pet = store.createPet({ user_id: user.id, name, species, breed, age });
    send(context.res, 201, { id: pet.id });
    return true;
  }

  const match = route.match(/^\/api\/pets\/(\d+)$/);
  if (!match) return false;

  const petId = Number(match[1]);
  const pet = store.getPet(user.id, petId);
  if (!pet) {
    send(context.res, 404, { error: 'Pet não encontrado.' });
    return true;
  }

  if (method === 'PUT') {
    const body = await readJson(context.req);
    const name = String(body.name || '').trim();
    const species = String(body.species || '').trim();
    const breed = String(body.breed || '').trim();
    const age = Number(body.age ?? 0);
    if (!name || name.length > 80 || !['Cachorro', 'Gato', 'Outro'].includes(species) ||
        breed.length > 80 || !Number.isInteger(age) || age < 0 || age > 40) {
      send(context.res, 400, { error: 'Dados do pet inválidos.' });
      return true;
    }
    store.updatePet(user.id, petId, { name, species, breed, age });
    send(context.res, 200, { ok: true });
    return true;
  }

  if (method === 'DELETE') {
    if (store.hasActiveAppointmentForPet(petId)) {
      send(context.res, 409, {
        error: 'Conclua ou cancele os agendamentos ativos antes de arquivar o pet.'
      });
      return true;
    }
    store.softDeletePet(user.id, petId);
    send(context.res, 200, {
      ok: true,
      message: 'Pet arquivado; o histórico foi preservado.'
    });
    return true;
  }

  return false;
};
