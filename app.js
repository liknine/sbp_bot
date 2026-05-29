const tg = window.Telegram?.WebApp || null;
const urlParams = new URLSearchParams(location.search);
const config = {
  BOT_USERNAME: urlParams.get('bot') || window.GOFISH_CONFIG?.BOT_USERNAME || localStorage.getItem('GOFISH_BOT_USERNAME') || '',
  ADMIN_USERNAME: window.GOFISH_CONFIG?.ADMIN_USERNAME || 'taypoov',
  ADMIN_TEXT: window.GOFISH_CONFIG?.ADMIN_TEXT || 'Есть вопрос по боту.',
};

const plans = [
  { key: 'week', title: 'Неделя', duration: '7 дней', usd: 2, stars: 100, icon: 'calendar' },
  { key: 'month', title: 'Месяц', duration: '30 дней', usd: 8, stars: 400, icon: 'calendar' },
  { key: 'three_months', title: '3 месяца', duration: '90 дней', usd: 20, stars: 1000, icon: 'spark' },
  { key: 'year', title: 'Год', duration: '365 дней', usd: 100, stars: 5000, icon: 'star' },
  { key: 'lifetime', title: 'Навсегда', duration: 'пожизненный доступ', usd: 140, stars: 7000, icon: 'infinity' },
];

const faq = [
  ['Куда приходят объявления?', 'Все новые объявления приходят прямо в чат Telegram-бота. Mini App нужен только для настройки поиска, подписки и активных фильтров.'],
  ['Как купить подписку?', 'Во вкладке «Тарифы» выберите тариф. Можно оплатить через Telegram Stars в боте или написать админу для оплаты на карту.'],
  ['Как остановить поиск?', 'Откройте «Профиль», найдите активный поиск и нажмите «Удалить». Если нужно временно поставить поиск на паузу — напишите админу, пока мы не добавили отдельную кнопку паузы.'],
  ['Что делать, если бот молчит?', 'Проверьте, активна ли подписка, корректно ли заполнен поиск и не слишком ли узкие фильтры. Если всё верно, возможно, новых объявлений пока нет.'],
  ['Как связаться с админом?', 'Нажмите кнопку «Написать админу». Telegram откроет диалог с @taypoov с готовым текстом вопроса.'],
];

let selectedPlan = 'week';
let searches = [];
let editingSearchId = null;

const screens = document.querySelectorAll('.screen');
const tabs = document.querySelectorAll('.tab');
const toast = document.getElementById('toast');
const plansRoot = document.getElementById('plans');
const faqRoot = document.getElementById('faqList');
const searchesList = document.getElementById('searchesList');

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function haptic(type = 'light') {
  try { tg?.HapticFeedback?.impactOccurred(type); } catch {}
}

function showScreen(name) {
  const current = document.querySelector('.screen.active')?.dataset.screen;
  if (current === name) return;
  screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  haptic('soft');
}

tabs.forEach((tab) => tab.addEventListener('click', () => showScreen(tab.dataset.tab)));
document.querySelectorAll('[data-go]').forEach((btn) => btn.addEventListener('click', () => showScreen(btn.dataset.go)));

function iconMarkup(name) {
  const icons = {
    calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v3M17 3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z"/></svg>',
    infinity: '<svg viewBox="0 0 24 24"><path d="M7.5 14.5c-2.2 0-4-1.6-4-3.5s1.8-3.5 4-3.5c3.7 0 5.3 7 9 7 2.2 0 4-1.6 4-3.5s-1.8-3.5-4-3.5c-3.7 0-5.3 7-9 7Z"/></svg>',
  };
  return icons[name] || icons.calendar;
}

function renderPlans() {
  plansRoot.innerHTML = plans.map((plan) => `
    <button class="plan ${plan.key === selectedPlan ? 'selected' : ''}" data-plan="${plan.key}">
      <span class="plan-icon">${iconMarkup(plan.icon)}</span>
      <span class="plan-copy"><strong>${plan.title}</strong><small>${plan.duration}</small></span>
      <span class="plan-price">$${plan.usd}<small>${plan.stars} ⭐</small></span>
      <span class="radio"></span>
    </button>
  `).join('');

  plansRoot.querySelectorAll('.plan').forEach((node) => {
    node.addEventListener('click', () => {
      selectedPlan = node.dataset.plan;
      renderPlans();
      haptic('light');
    });
  });
}

function renderFAQ() {
  faqRoot.innerHTML = faq.map(([q, a], index) => `
    <div class="faq-row" data-faq="${index}">
      <button class="faq-item" type="button"><span>${q}</span><i></i></button>
      <div class="faq-answer"><div>${a}</div></div>
    </div>
  `).join('');

  faqRoot.querySelectorAll('.faq-row').forEach((row) => {
    row.querySelector('.faq-item').addEventListener('click', () => {
      const wasOpen = row.classList.contains('open');
      faqRoot.querySelectorAll('.faq-row.open').forEach((item) => {
        if (item !== row) item.classList.remove('open');
      });
      row.classList.toggle('open', !wasOpen);
      haptic('light');
    });
  });
}

function setSelectState(select) {
  select.classList.toggle('placeholder', !select.value);
}

document.querySelectorAll('select').forEach((select) => {
  select.addEventListener('change', () => setSelectState(select));
  setSelectState(select);
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function safeJsonParam(name, fallback) {
  const raw = urlParams.get(name);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

function userFromUrl() {
  const id = urlParams.get('uid') || '';
  const username = urlParams.get('username') || '';
  const first_name = urlParams.get('first_name') || '';
  const photo_url = urlParams.get('photo_url') || '';
  if (!id && !username && !first_name && !photo_url) return null;
  return { id, username, first_name, photo_url };
}

function displayNameFromTelegram(user) {
  if (!user) return '@username';
  if (user.username) return `@${user.username}`;
  const name = [user.first_name, user.firstName, user.last_name, user.lastName].filter(Boolean).join(' ').trim();
  return name || '@username';
}

function subscriptionTextFromUrl() {
  const lifetime = urlParams.get('lifetime') === '1';
  const until = urlParams.get('sub_until');
  if (lifetime) return 'Подписка активна навсегда';
  if (until) {
    const date = new Date(until);
    if (!Number.isNaN(date.getTime()) && date.getTime() > Date.now()) {
      return `Подписка активна до ${date.toLocaleDateString('ru-RU')}`;
    }
  }
  const status = urlParams.get('sub');
  if (status === 'active') return 'Подписка активна';
  if (status === 'inactive') return 'Подписка не активна';
  return 'Статус можно проверить в боте';
}

function isActiveSubscriptionText(text = '') {
  const value = String(text).toLowerCase();
  return value.includes('активна') && !value.includes('не активна') && !value.includes('проверить') && !value.includes('предпросмотр');
}

function applyUser(user, subscriptionText = 'Подписка не активна') {
  const profileName = document.getElementById('profileName');
  const profileId = document.getElementById('profileId');
  const profileStatus = document.getElementById('profileStatus');
  const avatar = document.getElementById('tgAvatar');

  profileName.textContent = displayNameFromTelegram(user);
  profileId.textContent = `Telegram ID: ${user?.id || user?.telegramId || '—'}`;
  profileStatus.textContent = subscriptionText;
  profileStatus.classList.toggle('is-active', isActiveSubscriptionText(subscriptionText));
  profileStatus.classList.toggle('is-inactive', !isActiveSubscriptionText(subscriptionText));

  const photo = user?.photo_url || user?.photoUrl;
  if (photo) avatar.innerHTML = `<img src="${escapeHtml(photo)}" alt="avatar" referrerpolicy="no-referrer" />`;
}

function loadInitialState() {
  const tgUser = getTelegramUser();
  const urlUser = userFromUrl();
  const initialUser = tgUser || urlUser || { id: '—', username: 'username' };
  applyUser(initialUser, subscriptionTextFromUrl());
  searches = safeJsonParam('searches', []);
  if (!Array.isArray(searches)) searches = [];
  renderSearches(searches);
}

function renderSearches(list) {
  searches = Array.isArray(list) ? list : [];
  if (!searches.length) {
    searchesList.innerHTML = '<div class="empty-state">Активных поисков пока нет. Настройте первый поиск на главной.</div>';
    return;
  }

  const icon = '<svg viewBox="0 0 24 24"><path d="M9 2.8h6a2 2 0 0 1 2 2v14.4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2Z"/></svg>';
  searchesList.innerHTML = searches.map((search) => `
    <div class="search-row" data-search-id="${escapeHtml(search.id)}">
      <span class="round-icon">${icon}</span>
      <span class="search-main"><b>${escapeHtml(search.query || 'Без названия')}</b><small>${escapeHtml([search.category, search.size].filter(Boolean).join(' • ') || 'Поиск')}</small></span>
      <em>${search.active === false ? 'Пауза' : 'Активен'}</em>
      <div class="search-actions">
        <button type="button" class="mini-action edit-search" data-id="${escapeHtml(search.id)}">Изменить</button>
        <button type="button" class="mini-action danger delete-search" data-id="${escapeHtml(search.id)}">Удалить</button>
      </div>
    </div>
  `).join('');

  searchesList.querySelectorAll('.edit-search').forEach((button) => button.addEventListener('click', () => startEditSearch(button.dataset.id)));
  searchesList.querySelectorAll('.delete-search').forEach((button) => button.addEventListener('click', () => deleteSearch(button.dataset.id)));
}

function fillSearchForm(search) {
  document.getElementById('queryInput').value = search.query || '';
  document.getElementById('minPriceInput').value = search.minPrice || '';
  document.getElementById('maxPriceInput').value = search.maxPrice || '';
  const category = document.getElementById('categorySelect');
  category.value = search.category || '';
  setSelectState(category);
  document.getElementById('sizeInput').value = search.size || '';
  document.getElementById('keywordsInput').value = search.keywords || '';
}

function resetSearchForm() {
  document.getElementById('searchForm').reset();
  document.querySelectorAll('select').forEach(setSelectState);
  const buttonText = document.querySelector('#searchForm .primary-btn span');
  if (buttonText) buttonText.textContent = 'Сохранить и запустить';
  editingSearchId = null;
}

function startEditSearch(id) {
  const search = searches.find((item) => String(item.id) === String(id));
  if (!search) return showToast('Поиск не найден.');
  editingSearchId = id;
  fillSearchForm(search);
  const buttonText = document.querySelector('#searchForm .primary-btn span');
  if (buttonText) buttonText.textContent = 'Сохранить изменения';
  showScreen('home');
  showToast('Редактирование поиска');
  haptic('light');
}

function sendToBot(payload, fallbackText = 'Откройте Mini App из Telegram-бота.') {
  if (tg?.sendData) {
    tg.sendData(JSON.stringify(payload));
    return true;
  }
  console.log('Telegram sendData payload:', payload);
  showToast(fallbackText);
  return false;
}

function deleteSearch(id) {
  const search = searches.find((item) => String(item.id) === String(id));
  if (!search) return;
  const ok = window.confirm(`Удалить поиск «${search.query || 'Без названия'}»?`);
  if (!ok) return;
  haptic('medium');
  sendToBot({ action: 'delete_search', searchId: id }, 'В Telegram поиск будет удален через бота.');
}

function openTelegram(url) {
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
}

function botLink(start = '') {
  if (!config.BOT_USERNAME) return '';
  const suffix = start ? `?start=${encodeURIComponent(start)}` : '';
  return `https://t.me/${config.BOT_USERNAME}${suffix}`;
}

function adminMessage(planKey = '') {
  const plan = plans.find((item) => item.key === planKey);
  return plan
    ? `Есть вопрос по боту. Хочу оплатить тариф ${plan.title} на карту.`
    : 'Есть вопрос по боту.';
}

function openAdminChat(planKey = '') {
  const text = adminMessage(planKey);
  const tgUrl = `tg://resolve?domain=${config.ADMIN_USERNAME}&text=${encodeURIComponent(text)}`;
  const webUrl = `https://t.me/${config.ADMIN_USERNAME}?text=${encodeURIComponent(text)}`;
  haptic('medium');
  try { window.location.href = tgUrl; } catch {}
  setTimeout(() => {
    if (document.visibilityState === 'visible') openTelegram(webUrl);
  }, 450);
}

function payByStars() {
  haptic('medium');
  const link = botLink(`buy_${selectedPlan}`);
  if (link) return openTelegram(link);
  showToast('Откройте приложение из бота для оплаты Stars.');
}

function payByCard() {
  openAdminChat(selectedPlan);
}

function contactAdmin() {
  openAdminChat();
}

document.getElementById('searchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('.primary-btn');
  const payload = {
    action: editingSearchId ? 'edit_search' : 'create_search',
    searchId: editingSearchId || undefined,
    query: document.getElementById('queryInput').value.trim(),
    minPrice: document.getElementById('minPriceInput').value.trim(),
    maxPrice: document.getElementById('maxPriceInput').value.trim(),
    category: document.getElementById('categorySelect').value,
    size: document.getElementById('sizeInput').value.trim(),
    keywords: document.getElementById('keywordsInput').value.trim(),
  };

  if (!payload.query) return showToast('Введите, что ищем.');
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Отправляю в бот...';
  haptic('medium');
  const sent = sendToBot(payload, 'Данные поиска выведены в консоль. В Telegram будет отправлено через sendData.');
  if (!sent) {
    // Local preview only.
    const local = { id: editingSearchId || `local_${Date.now()}`, ...payload, active: true };
    if (editingSearchId) renderSearches(searches.map((s) => String(s.id) === String(editingSearchId) ? local : s));
    else renderSearches([local, ...searches]);
    resetSearchForm();
    button.classList.remove('loading');
  }
});

document.getElementById('payStarsBtn').addEventListener('click', payByStars);
document.getElementById('payCardBtn').addEventListener('click', payByCard);
document.getElementById('contactAdminBtn').addEventListener('click', contactAdmin);
document.getElementById('checkStatusBtn').addEventListener('click', () => {
  showScreen('profile');
  showToast('Статус обновляется при открытии через кнопку бота.');
});
document.getElementById('openBotRow').addEventListener('click', contactAdmin);

renderPlans();
renderFAQ();

try {
  tg?.ready();
  tg?.expand();
  tg?.setHeaderColor?.('#ffffff');
  tg?.setBackgroundColor?.('#ffffff');
} catch {}

loadInitialState();
