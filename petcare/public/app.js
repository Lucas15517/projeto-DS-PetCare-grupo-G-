'use strict';

const $ = (selector) => document.querySelector(selector);
const state = {
  token: sessionStorage.getItem('petcare_token') || '',
  user: null,
  pets: [],
  services: [],
  appointments: [],
  registering: false,
  offlineReadOnly: false
};

function makeText(tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  return element;
}

function makeButton(label, action, className = '', accessibleName = label) {
  const button = makeText('button', label);
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', accessibleName);
  button.addEventListener('click', action);
  return button;
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

async function api(route, method = 'GET', payload) {
  const response = await fetch('/api' + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: 'Bearer ' + state.token } : {})
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: 'Resposta inesperada do servidor.' };
  }
  if (!response.ok) {
    const error = new Error(data.error || 'Falha HTTP ' + response.status);
    error.status = response.status;
    throw error;
  }
  return data;
}

function cacheKey(userId) {
  return 'petcare_cache_' + userId;
}

function saveOfflineSnapshot() {
  if (!state.user) return;
  try {
    localStorage.setItem(cacheKey(state.user.id), JSON.stringify({
      user: state.user,
      pets: state.pets,
      services: state.services,
      appointments: state.appointments,
      saved_at: new Date().toISOString()
    }));
    localStorage.setItem('petcare_last_user_id', String(state.user.id));
  } catch {
    notify('Não foi possível guardar a consulta offline neste dispositivo.', true);
  }
}

function restoreOfflineSnapshot() {
  // Dados pessoais em cache só podem ser exibidos enquanto a sessão autenticada
  // desta aba ainda existir. Não abra o cache offline para qualquer visitante.
  const userId = localStorage.getItem('petcare_last_user_id');
  const tokenUserId = state.token.split('.')[0];
  if (!userId || !/^\d+$/.test(userId) || !tokenUserId) return false;
  if (String(userId) !== tokenUserId) return false;

  try {
    const snapshot = JSON.parse(localStorage.getItem(cacheKey(userId)) || 'null');
    if (!snapshot || !snapshot.user || String(snapshot.user.id) !== tokenUserId) return false;
    state.user = snapshot.user;
    state.pets = Array.isArray(snapshot.pets) ? snapshot.pets : [];
    state.services = Array.isArray(snapshot.services) ? snapshot.services : [];
    state.appointments = Array.isArray(snapshot.appointments) ? snapshot.appointments : [];
    state.offlineReadOnly = true;
    renderAll();
    return true;
  } catch {
    return false;
  }
}

async function flushPendingLogout() {
  const pendingToken = localStorage.getItem('petcare_pending_logout');
  if (!pendingToken || !navigator.onLine) return;
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + pendingToken }
    });
    if (response.ok || response.status === 401) {
      localStorage.removeItem('petcare_pending_logout');
    }
  } catch {
    // A tentativa será repetida quando a conexão voltar.
  }
}

function updateNetworkStatus() {
  const status = $('#networkStatus');
  const online = navigator.onLine;

  if (state.offlineReadOnly) {
    status.textContent = online
      ? 'A consulta está em modo somente leitura. Saia e entre novamente quando o servidor estiver disponível para atualizar os dados.'
      : 'Sem conexão — exibindo a última consulta salva em modo somente leitura.';
  } else {
    status.textContent = online
      ? 'Conectado — cadastros e alterações são enviados ao servidor.'
      : 'Sem conexão — entre novamente quando a conexão voltar para atualizar os dados.';
  }
  status.dataset.online = String(online);
}

window.addEventListener('online', () => {
  updateNetworkStatus();
  flushPendingLogout();
  if (state.offlineReadOnly && state.token) window.location.reload();
});
window.addEventListener('offline', () => {
  if (state.user) {
    state.offlineReadOnly = true;
    renderAll();
  }
  updateNetworkStatus();
});
updateNetworkStatus();
flushPendingLogout();

let fontScale = Number(localStorage.getItem('petcare_font_scale') || 1);
if (!Number.isFinite(fontScale) || fontScale < 1 || fontScale > 1.4) fontScale = 1;

function updateFont() {
  document.documentElement.style.setProperty('--font-scale', String(fontScale));
  localStorage.setItem('petcare_font_scale', String(fontScale));
}
function updateContrast() {
  const enabled = localStorage.getItem('petcare_high_contrast') === 'true';
  document.documentElement.classList.toggle('high-contrast', enabled);
  $('#contrastToggle').setAttribute('aria-pressed', String(enabled));
}

$('#fontIncrease').addEventListener('click', () => {
  fontScale = Math.min(1.4, Math.round((fontScale + 0.1) * 10) / 10);
  updateFont();
});
$('#fontReset').addEventListener('click', () => {
  fontScale = 1;
  updateFont();
  notify('Tamanho do texto restaurado.');
});
$('#contrastToggle').addEventListener('click', () => {
  const next = localStorage.getItem('petcare_high_contrast') !== 'true';
  localStorage.setItem('petcare_high_contrast', String(next));
  updateContrast();
  notify(next ? 'Alto contraste ativado.' : 'Alto contraste desativado.');
});
updateFont();
updateContrast();

function authView() {
  const loggedIn = Boolean(state.user);
  $('#auth').hidden = loggedIn;
  $('#app').hidden = !loggedIn;
  $('#nav').hidden = !loggedIn;
  $('#addPet').disabled = state.offlineReadOnly;
  $('#addAg').disabled = state.offlineReadOnly;
  if (loggedIn) $('#username').textContent = state.user.name.split(' ')[0];
}

function view(id) {
  document.querySelectorAll('.view').forEach((section) => {
    section.hidden = section.id !== id;
  });
  document.querySelectorAll('[data-view]').forEach((control) => {
    const active = control.dataset.view === id;
    control.classList.toggle('selected', active);
    if (control.closest('nav')) {
      if (active) control.setAttribute('aria-current', 'page');
      else control.removeAttribute('aria-current');
    }
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

$('#showFundamentals').addEventListener('click', () => {
  $('#fundamentals').hidden = false;
  $('#fundamentals').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#hideFundamentals').addEventListener('click', () => {
  $('#fundamentals').hidden = true;
  $('#showFundamentals').focus();
});

function switchAuth() {
  state.registering = !state.registering;
  $('#nameField').hidden = !state.registering;
  $('#nameField input').required = state.registering;
  $('#authTitle').textContent = state.registering ? 'Crie sua conta no PetCare' : 'Bem-vindo ao PetCare';
  $('#authSubmit').textContent = state.registering ? 'Criar conta' : 'Entrar';
  $('#switchAuth').textContent = state.registering
    ? 'Já tenho conta. Entrar'
    : 'Não tenho conta. Cadastrar';
  $('#authForm').elements.password.autocomplete =
    state.registering ? 'new-password' : 'current-password';
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
    $('#fundamentals').hidden = true;
    authView();
    await refresh();
    view('home');
    event.target.reset();
    notify('Bem-vindo ao PetCare!');
  } catch (error) {
    handleError(error);
  } finally {
    button.disabled = false;
  }
});

$('#logout').addEventListener('click', async () => {
  const userId = state.user?.id;
  const token = state.token;
  let logoutPending = false;

  if (token) {
    try {
      if (navigator.onLine) {
        await api('/logout', 'POST', {});
      } else {
        localStorage.setItem('petcare_pending_logout', token);
        logoutPending = true;
      }
    } catch {
      localStorage.setItem('petcare_pending_logout', token);
      logoutPending = true;
      if (navigator.onLine) {
        notify('Sessão encerrada neste dispositivo; a invalidação será reenviada ao servidor.', true);
      }
    }
  }

  if (userId) localStorage.removeItem(cacheKey(userId));
  localStorage.removeItem('petcare_last_user_id');
  state.token = '';
  state.user = null;
  state.pets = [];
  state.services = [];
  state.appointments = [];
  state.offlineReadOnly = false;
  sessionStorage.removeItem('petcare_token');
  authView();
  if (navigator.onLine) flushPendingLogout();
  else if (logoutPending) {
    notify('Sessão encerrada neste dispositivo. A invalidação será enviada quando a conexão voltar.');
  }
});

function renderAll() {
  authView();
  $('#petsCount').textContent = state.pets.length;
  $('#agsCount').textContent = state.appointments.length;
  $('#servicesCount').textContent = state.services.length;
  renderPets();
  renderAppointments();
  renderServices();
}

async function refresh() {
  const [pets, services, appointments] = await Promise.all([
    api('/pets'),
    api('/services'),
    api('/appointments')
  ]);
  state.pets = pets;
  state.services = services;
  state.appointments = appointments;
  renderAll();
  saveOfflineSnapshot();
}

function renderPets() {
  const list = $('#petList');
  list.replaceChildren();
  $('#careAdvice').hidden = true;
  if (!state.pets.length) {
    list.append(makeText('p', 'Nenhum pet cadastrado. Escolha “Novo pet” para começar.'));
    return;
  }

  state.pets.forEach((pet) => {
    const item = document.createElement('article');
    item.className = 'card item';
    const info = document.createElement('div');
    info.append(makeText('strong', '🐾 ' + pet.name));
    info.append(makeText('p', [
      pet.species,
      pet.breed,
      pet.age + ' ano(s)'
    ].filter(Boolean).join(' • ')));

    if (!state.offlineReadOnly) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(makeButton('Editar', () => openPet(pet), '', 'Editar dados de ' + pet.name));
      actions.append(makeButton('Orientações', () => showCareAdvice(pet), '', 'Gerar orientações para ' + pet.name));
      actions.append(makeButton('Arquivar', async () => {
        if (!confirm('Arquivar ' + pet.name + '? O histórico de atendimentos será preservado.')) return;
        try {
          await api('/pets/' + pet.id, 'DELETE');
          await refresh();
          notify('Pet arquivado; o histórico foi preservado.');
        } catch (error) {
          handleError(error);
        }
      }, '', 'Arquivar ' + pet.name));
      item.append(actions);
    }
    item.prepend(info);
    list.append(item);
  });
}

async function showCareAdvice(pet) {
  const panel = $('#careAdvice');
  panel.hidden = false;
  panel.replaceChildren(makeText('p', 'Preparando orientações...'));
  try {
    const advice = await api('/care-advice?pet_id=' + encodeURIComponent(pet.id));
    panel.replaceChildren();
    const title = makeText('h3', 'Orientações para ' + advice.pet_name);
    title.id = 'careTitle';
    panel.append(title);
    panel.append(makeText('p', 'Recurso educativo: ' + advice.method + '.'));
    const list = document.createElement('ul');
    advice.recommendations.forEach((recommendation) => {
      list.append(makeText('li', recommendation));
    });
    panel.append(list);
    panel.append(makeText('p', advice.notice));
  } catch (error) {
    panel.hidden = true;
    handleError(error);
  }
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
  } catch (error) {
    handleError(error);
  }
});

function renderServices() {
  const list = $('#serviceList');
  list.replaceChildren();
  state.services.forEach((service) => {
    const item = document.createElement('article');
    item.className = 'card';
    item.append(makeText('h3', '🐾 ' + service.name));
    item.append(makeText('p', (service.price_cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })));
    list.append(item);
  });
}

function renderAppointments() {
  const list = $('#agList');
  list.replaceChildren();
  if (!state.appointments.length) {
    list.append(makeText('p', 'Nenhum agendamento realizado.'));
    return;
  }

  state.appointments.forEach((appointment) => {
    const item = document.createElement('article');
    item.className = 'card item';
    const info = document.createElement('div');
    info.append(makeText('strong', appointment.service_name + ' — ' + appointment.pet_name));
    const details = appointment.date.split('-').reverse().join('/') +
      ' às ' + appointment.time + ' • ' + appointment.status +
      ' • ' + (appointment.price_cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }) +
      (appointment.note ? ' • ' + appointment.note : '');
    info.append(makeText('p', details));

    if (!state.offlineReadOnly && appointment.status === 'agendado') {
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(makeButton('Concluir', () => updateStatus(appointment.id, 'concluido')));
      actions.append(makeButton('Cancelar', () => updateStatus(appointment.id, 'cancelado')));
      item.append(actions);
    }
    item.prepend(info);
    list.append(item);
  });
}

async function updateStatus(id, status) {
  if (status === 'cancelado' && !confirm('Cancelar este agendamento?')) return;
  try {
    await api('/appointments/' + id, 'PATCH', { status });
    await refresh();
    notify('Agendamento atualizado.');
  } catch (error) {
    handleError(error);
  }
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
  form.elements.service_id.replaceChildren(...state.services.map((service) =>
    new Option(service.name + ' — ' + (service.price_cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }), service.id)
  ));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0')
  ].join('-');
  const today = new Date();
  form.elements.date.min = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
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
  } catch (error) {
    handleError(error);
  }
});

document.querySelectorAll('[data-close]').forEach((control) => {
  control.addEventListener('click', () => $('#' + control.dataset.close).close());
});

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  $('#installApp').hidden = false;
});
$('#installApp').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('#installApp').hidden = true;
});
window.addEventListener('appinstalled', () => {
  $('#installApp').hidden = true;
  notify('PetCare instalado no dispositivo.');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      notify('Não foi possível ativar o modo instalável neste navegador.', true);
    });
  });
}

async function restoreSession() {
  if (!state.token) {
    // Sem uma sessão autenticada nesta aba, nunca revelar o cache pessoal.
    return;
  }

  try {
    state.user = await api('/me');
    state.offlineReadOnly = false;
    authView();
    await refresh();
    view('home');
  } catch (error) {
    if (error.status === 401) {
      const oldUserId = localStorage.getItem('petcare_last_user_id');
      if (oldUserId) localStorage.removeItem(cacheKey(oldUserId));
      localStorage.removeItem('petcare_last_user_id');
      state.user = null;
      state.token = '';
      state.offlineReadOnly = false;
      sessionStorage.removeItem('petcare_token');
      authView();
      return;
    }
    if (restoreOfflineSnapshot()) {
      authView();
      view('home');
      updateNetworkStatus();
      notify('Modo offline: exibindo a última consulta salva. A tela está em somente leitura.');
      return;
    }
    state.user = null;
    state.token = '';
    state.offlineReadOnly = false;
    sessionStorage.removeItem('petcare_token');
    authView();
  }
}
restoreSession();
