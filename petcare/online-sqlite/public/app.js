// Interface do navegador: escuta os cliques e chama as APIs do servidor.
// Dados sensíveis são verificados no server.js; este arquivo cuida das telas.
'use strict';
// Interface do PetCare e comunicação com o servidor.
const $ = (selector) => document.querySelector(selector);
const state = {
  token: sessionStorage.getItem('petcare_token') || '',
  user: null,
  pets: [],
  services: [],
  appointments: [],
  registering: false
};

function makeText(tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  return element;
}
function makeButton(label, action, className = '') {
  const element = makeText('button', label);
  element.type = 'button';
  element.className = className;
  element.addEventListener('click', action);
  return element;
}
let toastTimer;
function notify(message, isError = false) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.kind = isError ? 'error' : 'success';
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 5000);
}
function handleError(error) {
  notify(error.message || 'Não foi possível completar a ação.', true);
}

// API REST: fetch faz a comunicação do front-end com o back-end Node.js.
async function api(path, method = 'GET', payload) {
  const response = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: 'Bearer ' + state.token } : {})
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Falha HTTP ${response.status}`);
  return data;
}

// Acessibilidade: as preferências são opcionais e ficam salvas só no navegador.
let fontScale = Number(localStorage.getItem('petcare_font_scale') || 1);
if (!Number.isFinite(fontScale) || fontScale < 1 || fontScale > 1.4) fontScale = 1;
function updateFont() {
  document.documentElement.style.setProperty('--font-scale', String(fontScale));
  localStorage.setItem('petcare_font_scale', String(fontScale));
}
function updateContrast() {
  const active = localStorage.getItem('petcare_high_contrast') === 'true';
  document.documentElement.classList.toggle('high-contrast', active);
  $('#contrastToggle').setAttribute('aria-pressed', String(active));
}
$('#fontIncrease').addEventListener('click', () => {
  fontScale = fontScale >= 1.4 ? 1 : Number((fontScale + 0.1).toFixed(1));
  updateFont();
  notify(fontScale === 1 ? 'Texto restaurado.' : 'Tamanho do texto ampliado.');
});
$('#fontReset').addEventListener('click', () => { fontScale = 1; updateFont(); notify('Texto restaurado.'); });
$('#contrastToggle').addEventListener('click', () => {
  const next = localStorage.getItem('petcare_high_contrast') !== 'true';
  localStorage.setItem('petcare_high_contrast', String(next));
  updateContrast();
  notify(next ? 'Alto contraste ativado.' : 'Alto contraste desativado.');
});
updateFont();
updateContrast();

function authView() {
  const logged = Boolean(state.user);
  $('#auth').hidden = logged;
  $('#app').hidden = !logged;
  $('#nav').hidden = !logged;
  if (logged) $('#username').textContent = state.user.name.split(' ')[0];
}
function view(id) {
  document.querySelectorAll('.view').forEach((section) => { section.hidden = section.id !== id; });
  document.querySelectorAll('[data-view]').forEach((control) => {
    const active = control.dataset.view === id;
    control.classList.toggle('selected', active);
    // Indicação adicional para leitores de tela em botões que alternam de seção.
    if (control.closest('nav')) control.setAttribute('aria-current', active ? 'page' : 'false');
  });
  window.scrollTo(0, 0);
  const title = $('#' + id + ' h2');
  if (title) {
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
}
document.querySelectorAll('[data-view]').forEach((control) => {
  control.addEventListener('click', () => view(control.dataset.view));
});
function switchAuth() {
  state.registering = !state.registering;
  $('#nameField').hidden = !state.registering;
  $('#nameField input').required = state.registering;
  $('#authTitle').textContent = state.registering ? 'Crie sua conta no PetCare' : 'Bem-vindo ao PetCare 🐶';
  $('#authSubmit').textContent = state.registering ? 'Criar conta' : 'Entrar';
  $('#switchAuth').textContent = state.registering ? 'Já tenho conta. Entrar' : 'Não tenho conta. Cadastrar';
  $('#authForm').elements.password.autocomplete = state.registering ? 'new-password' : 'current-password';
}
$('#switchAuth').addEventListener('click', switchAuth);
$('#authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('#authSubmit');
  button.disabled = true;
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const response = await api(state.registering ? '/register' : '/login', 'POST', values);
    state.token = response.token;
    state.user = response.user;
    sessionStorage.setItem('petcare_token', state.token);
    authView();
    await refresh();
    view('home');
    event.target.reset();
    notify('Bem-vindo ao PetCare!');
  } catch (error) { handleError(error); }
  finally { button.disabled = false; }
});
$('#logout').addEventListener('click', () => {
  state.token = '';
  state.user = null;
  sessionStorage.removeItem('petcare_token');
  authView();
  notify('Você saiu da sua conta.');
  $('#authTitle').focus?.();
});

async function refresh() {
  [state.pets, state.services, state.appointments] = await Promise.all([
    api('/pets'), api('/services'), api('/appointments')
  ]);
  $('#petsCount').textContent = state.pets.length;
  $('#agsCount').textContent = state.appointments.length;
  $('#servicesCount').textContent = state.services.length;
  renderPets();
  renderAppointments();
  renderServices();
}

function renderPets() {
  const list = $('#petList');
  list.replaceChildren();
  if (!state.pets.length) { list.append(makeText('p', 'Nenhum pet cadastrado. Escolha “Novo pet” para começar.')); return; }
  state.pets.forEach((pet) => {
    const item = document.createElement('article');
    item.className = 'card item';
    const info = document.createElement('div');
    info.append(makeText('strong', '🐾 ' + pet.name));
    info.append(makeText('p', [pet.species, pet.breed, pet.age + ' ano(s)'].filter(Boolean).join(' • ')));
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(makeButton('Editar ' + pet.name, () => openPet(pet)));
    actions.append(makeButton('Excluir ' + pet.name, async () => {
      if (!confirm('Deseja excluir o pet ' + pet.name + '?')) return;
      try { await api('/pets/' + pet.id, 'DELETE'); await refresh(); notify('Pet excluído.'); }
      catch (error) { handleError(error); }
    }));
    item.append(info, actions);
    list.append(item);
  });
}
function openPet(pet) {
  const form = $('#petForm');
  form.reset();
  form.elements.id.value = pet?.id || '';
  form.elements.name.value = pet?.name || '';
  form.elements.species.value = pet?.species || 'Cachorro';
  form.elements.breed.value = pet?.breed || '';
  form.elements.age.value = pet?.age ?? 0;
  $('#petHeading').textContent = pet ? 'Editar pet' : 'Cadastrar pet';
  $('#petDialog').showModal();
}
$('#addPet').addEventListener('click', () => openPet());
$('#petForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  const id = values.id;
  delete values.id;
  try {
    await api(id ? '/pets/' + id : '/pets', id ? 'PUT' : 'POST', values);
    $('#petDialog').close();
    await refresh();
    notify('Dados do pet salvos com sucesso.');
  } catch (error) { handleError(error); }
});
function renderServices() {
  const list = $('#serviceList');
  list.replaceChildren();
  state.services.forEach((service) => {
    const item = document.createElement('article');
    item.className = 'card';
    item.append(makeText('h3', '🐾 ' + service.name));
    item.append(makeText('p', Number(service.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
    list.append(item);
  });
}
function renderAppointments() {
  const list = $('#agList');
  list.replaceChildren();
  if (!state.appointments.length) { list.append(makeText('p', 'Nenhum agendamento realizado.')); return; }
  state.appointments.forEach((appointment) => {
    const item = document.createElement('article');
    item.className = 'card item';
    const info = document.createElement('div');
    info.append(makeText('strong', appointment.service_name + ' — ' + appointment.pet_name));
    info.append(makeText('p', appointment.date.split('-').reverse().join('/') + ' às ' + appointment.time +
      ' • ' + appointment.status + (appointment.note ? ' • ' + appointment.note : '')));
    const actions = document.createElement('div');
    actions.className = 'actions';
    if (appointment.status === 'agendado') {
      actions.append(makeButton('Concluir atendimento', () => updateStatus(appointment.id, 'concluido')));
      actions.append(makeButton('Cancelar agendamento', () => updateStatus(appointment.id, 'cancelado')));
    }
    item.append(info, actions);
    list.append(item);
  });
}
async function updateStatus(id, status) {
  if (status === 'cancelado' && !confirm('Cancelar este agendamento?')) return;
  try {
    await api('/appointments/' + id, 'PATCH', { status });
    await refresh();
    notify('Agendamento atualizado.');
  } catch (error) { handleError(error); }
}
$('#addAg').addEventListener('click', () => {
  if (!state.pets.length) {
    notify('Cadastre um pet antes de agendar.', true);
    view('pets');
    return;
  }
  const form = $('#agForm');
  form.reset();
  form.elements.pet_id.replaceChildren(...state.pets.map((pet) => new Option(pet.name, pet.id)));
  form.elements.service_id.replaceChildren(...state.services.map((service) => new Option(service.name + ' — R$ ' + service.price, service.id)));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = [tomorrow.getFullYear(), String(tomorrow.getMonth() + 1).padStart(2, '0'), String(tomorrow.getDate()).padStart(2, '0')].join('-');
  const today = new Date();
  form.elements.date.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  form.elements.date.value = date;
  form.elements.time.value = '10:00';
  $('#agDialog').showModal();
});
$('#agForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  if (new Date(values.date + 'T' + values.time + ':00').getTime() <= Date.now()) {
    notify('Escolha uma data e um horário futuros.', true);
    return;
  }
  try {
    await api('/appointments', 'POST', values);
    $('#agDialog').close();
    await refresh();
    notify('Agendamento confirmado!');
  } catch (error) { handleError(error); }
});
document.querySelectorAll('[data-close]').forEach((control) => {
  control.addEventListener('click', () => $('#' + control.dataset.close).close());
});

(async function restoreSession() {
  if (!state.token) return;
  try {
    state.user = await api('/me');
    authView();
    await refresh();
    view('home');
  } catch {
    state.user = null;
    state.token = '';
    sessionStorage.removeItem('petcare_token');
    authView();
  }
})();
