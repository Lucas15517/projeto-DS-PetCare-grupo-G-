'use strict';

module.exports = async function appointmentRoutes(context) {
  const { route, method, send, store, user, readJson, validDate } = context;

  if (route === '/api/appointments' && method === 'GET') {
    send(context.res, 200, store.listAppointments(user.id));
    return true;
  }

  if (route === '/api/appointments' && method === 'POST') {
    const body = await readJson(context.req);
    const petId = Number(body.pet_id);
    const serviceId = Number(body.service_id);
    const date = String(body.date || '');
    const time = String(body.time || '');
    const note = String(body.note || '').trim();

    if (!validDate(date, time) || note.length > 300 ||
        !store.getPet(user.id, petId) || !store.getService(serviceId)) {
      send(context.res, 400, {
        error: 'Confira o pet, o serviço, a data e o horário futuro.'
      });
      return true;
    }

    try {
      const appointment = store.createAppointment({
        user_id: user.id,
        pet_id: petId,
        service_id: serviceId,
        date,
        time,
        note
      });
      send(context.res, 201, { id: appointment.id });
    } catch (error) {
      if (error.code !== 'SLOT_TAKEN') throw error;
      send(context.res, 409, {
        error: 'Este horário já foi reservado. Escolha outro.'
      });
    }
    return true;
  }

  const match = route.match(/^\/api\/appointments\/(\d+)$/);
  if (match && method === 'PATCH') {
    const body = await readJson(context.req);
    if (!['cancelado', 'concluido'].includes(body.status)) {
      send(context.res, 400, { error: 'Status inválido.' });
      return true;
    }
    const changed = store.updateAppointmentStatus(
      user.id,
      Number(match[1]),
      body.status
    );
    send(context.res, changed ? 200 : 404, changed
      ? { ok: true }
      : { error: 'Agendamento não encontrado ou já encerrado.' });
    return true;
  }

  return false;
};
