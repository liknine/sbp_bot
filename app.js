const tg = window.Telegram?.WebApp;

const products = [
  { id: 1, brand: "NIKE", name: "Nike Air Force 1 ’07", color: "Black", price: 179, badge: "ХИТ", sizes: ["40","41","42","43","44","45"] },
  { id: 2, brand: "NEW BALANCE", name: "New Balance 2002R", color: "Phantom", price: 259, badge: "НОВИНКА", sizes: ["40","41","42","43"] },
  { id: 3, brand: "ADIDAS", name: "Adidas Samba OG", color: "Cream White", price: 199, badge: "", sizes: ["40","41","42","43"] },
  { id: 4, brand: "NEW BALANCE", name: "New Balance 530", color: "Steel Grey", price: 229, badge: "", sizes: ["39","40","41","42"] }
];

const state = {
  theme: "dark",
  tab: "home",
  menu: false,
  story: false,
  product: products[0],
  favorites: new Set(),
  size: "",
  delivery: "pickup"
};

function logo() {
  return `<div class="logo"><span>SBP</span><i></i></div>`;
}

function setTab(tab) {
  state.tab = tab;
  render();
  window.scrollTo(0, 0);
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  render();
}

function openProduct(id) {
  state.product = products.find(p => p.id === id) || products[0];
  state.size = "";
  setTab("product");
}

function sendOrder() {
  const payload = {
    type: "order_create",
    product_id: state.product.id,
    product_name: state.product.name,
    size: state.size || "42",
    price_byn: state.product.price,
    delivery_method: state.delivery,
    created_at: new Date().toISOString()
  };

  if (tg?.sendData) {
    tg.sendData(JSON.stringify(payload));
  } else {
    alert("Order payload:\\n" + JSON.stringify(payload, null, 2));
  }

  setTab("success");
}

function backButton(target) {
  return `<button class="back" data-tab="${target}">← Назад</button>`;
}

function title(text, action = "") {
  return `<div class="title"><h2>${text}</h2>${action ? `<button>${action}</button>` : ""}</div>`;
}

function productGrid(list) {
  return `<section class="grid">${list.map(p => `
    <article class="card" data-product="${p.id}">
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
      <button class="heart ${state.favorites.has(p.id) ? "active" : ""}" data-fav="${p.id}">♥</button>
      <div class="art">${logo()}</div>
      <p>${p.brand}</p>
      <h3>${p.name}</h3>
      <small>${p.color}</small>
      <div class="price"><b>${p.price} BYN</b><span>${p.sizes.join(" ")} ...</span></div>
    </article>
  `).join("")}</section>`;
}

function homeScreen() {
  return `
    <section class="hero">
      <p>SBP COINS</p>
      <h1>Бонусы за завершённые заказы</h1>
      <button id="openStory">Узнать больше →</button>
      <div class="bars"><i></i><i></i><i class="active"></i></div>
    </section>
    <section class="quick">
      <button><span>☎</span><span>Связаться с...</span></button>
      <button><span>✈</span><span>Канал SBP</span></button>
      <button><span>✦</span><span>Отзывы</span></button>
      <button><span>□</span><span>Архив</span></button>
    </section>
    ${title("В наличии", "Все товары")}
    ${productGrid(products)}
    <section class="coins"><span>S</span><div><b>SBP Coins</b><p>Покупай и получай прив...</p></div><button data-tab="coins">Узнать больше</button></section>
  `;
}

function catalogScreen() {
  return `${backButton("home")}${title("Каталог")}${productGrid(products)}`;
}

function favoritesScreen() {
  const list = products.filter(p => state.favorites.has(p.id));
  if (!list.length) {
    return `<section class="empty"><h2>Избранного пока нет</h2><p>Добавляйте товары в избранное, чтобы быстро вернуться к ним позже.</p><button data-tab="catalog">Перейти в каталог</button></section>`;
  }
  return `${backButton("home")}${title("Избранное")}${productGrid(list)}`;
}

function productScreen() {
  const p = state.product;
  return `
    ${backButton("catalog")}
    <section class="product-main">
      <button class="heart detail ${state.favorites.has(p.id) ? "active" : ""}" data-fav="${p.id}">♥</button>
      ${logo()}
    </section>
    <section class="thumbs"><div>${logo()}</div><div>${logo()}</div><div>${logo()}</div></section>
    <section class="product-info">
      <p>${p.brand}</p>
      <h1>${p.name}</h1>
      <span>Коротко материалы и особенности, без длинного маркетплейс-описания.</span>
      <div><b>${p.price} BYN</b><em>В наличии</em></div>
    </section>
    <section class="sizes">
      <h2>Размеры</h2>
      <div>${p.sizes.map(s => `<button class="${state.size === s ? "selected" : ""}" data-size="${s}"><b>${s}</b><span>cm</span></button>`).join("")}</div>
      ${!state.size ? `<p>Выберите размер перед добавлением в корзину</p>` : ""}
    </section>
    <button class="primary" ${!state.size ? "disabled" : ""} data-tab="cart">В корзину</button>
  `;
}

function cartScreen() {
  const p = state.product;
  return `
    ${backButton("home")}
    <section class="cart">${logo()}<div><h3>${p.name}</h3><p>Размер ${state.size || "42"}</p><b>${p.price} BYN</b></div></section>
    <section class="summary"><p><span>Товары</span><b>${p.price} BYN</b></p><p><span>Итого</span><b>${p.price} BYN</b></p></section>
    <button class="primary" data-tab="checkout">Оформить заказ</button>
  `;
}

function checkoutScreen() {
  const fields = state.delivery === "pickup" ? ["ФИО","Номер телефона","Пожелания"] :
    state.delivery === "evro" ? ["ФИО","Номер телефона","Номер отделения","Пожелания"] :
    ["ФИО","Номер телефона","Адрес","Индекс"];

  const delivery = [
    ["pickup", "Самовывоз", "Только город Витебск"],
    ["evro", "Европочта", "ФИО, телефон, номер отделения"],
    ["bel", "Белпочта", "ФИО, телефон, адрес, индекс"]
  ];

  return `
    ${backButton("cart")}
    <section class="box"><h2>Способ получения</h2>
      ${delivery.map(([id,t,s]) => `<button class="delivery ${state.delivery === id ? "active" : ""}" data-delivery="${id}"><span><b>${t}</b><small>${s}</small></span><i></i></button>`).join("")}
    </section>
    <section class="fields">${fields.map(f => `<input placeholder="${f}" />`).join("")}</section>
    <button class="primary" id="submitOrder">Отправить заявку</button>
  `;
}

function profileScreen() {
  return `
    <section class="profile">
      <div class="pattern">${Array.from({length:16}).map(() => `<span>SBP</span>`).join("")}</div>
      ${logo()}<h1>@username</h1>
    </section>
    <section class="profile-list">
      <button data-tab="orders">История заказов <b>→</b></button>
      <button data-tab="coins">SBP Coins <b>320</b></button>
      <button data-tab="bonuses">Мои бонусы <b>1 активен</b></button>
    </section>
  `;
}

function ordersScreen() {
  const orders = [
    ["12 мая 2026","SBP-1042",products[0],"42","Заказ обрабатывается"],
    ["8 мая 2026","SBP-1037",products[1],"43","Отправлен"],
    ["5 мая 2026","SBP-1021",products[2],"41","Завершён"]
  ];
  return `
    ${backButton("profile")}
    ${title("История заказов")}
    <section class="orders">
      ${orders.map(([d,n,p,s,st]) => `<h3>${d}</h3><article>${logo()}<div><small>ORDER #${n}</small><span>${st}</span><h2>${p.name}</h2><p>Размер ${s}</p><b>${p.price} BYN</b></div></article>`).join("")}
    </section>
  `;
}

function infoScreen(titleText, text) {
  return `${backButton("profile")}<section class="box"><h1>${titleText}</h1><p>${text}</p></section>`;
}

function successScreen() {
  return `<section class="empty"><h2>Заявка отправлена</h2><p>Менеджер свяжется с вами и подтвердит заказ.</p><button data-tab="home">На главную</button></section>`;
}

function menuOverlay() {
  if (!state.menu) return "";
  return `<aside class="overlay"><section class="panel">
    <div class="menu-top">${logo()}<button id="closeMenu">×</button></div>
    <div class="faq"><span>FAQ</span><h2>Раздел помощи</h2><p>Всё, что ниже — это FAQ и полезная информация.</p></div>
    ${["Кто мы","Как проходят заказы","Почему нам можно доверять","Отзывы","Связаться с нами"].map(x => `<button class="menu-row"><span>□</span><b>${x}</b><em>→</em></button>`).join("")}
    <button class="menu-row" id="themeToggle"><span>◐</span><b>Сменить тему</b><em>${state.theme === "light" ? "☼" : "☾"}</em></button>
  </section></aside>`;
}

function storyOverlay() {
  if (!state.story) return "";
  return `<aside class="story"><button class="story-x" id="closeStory">×</button><section><p>SBP STORIES</p><h2>Curated drop inside Telegram</h2><span>Новые позиции, бонусы, статусы и быстрый доступ к SBP.</span><button id="storyCatalog">Перейти в каталог</button></section></aside>`;
}

function bottomNav() {
  const items = [["home","⌂","Главная"],["catalog","▦","Каталог"],["favorites","♥","Избранное"],["profile","◉","Профиль"]];
  return `<nav class="bottom">${items.map(([id,icon,label]) => `<button class="${state.tab === id ? "active" : ""}" data-tab="${id}"><span>${icon}</span><small>${label}</small></button>`).join("")}</nav>`;
}

function renderScreen() {
  if (state.tab === "home") return homeScreen();
  if (state.tab === "catalog") return catalogScreen();
  if (state.tab === "favorites") return favoritesScreen();
  if (state.tab === "profile") return profileScreen();
  if (state.tab === "product") return productScreen();
  if (state.tab === "cart") return cartScreen();
  if (state.tab === "checkout") return checkoutScreen();
  if (state.tab === "success") return successScreen();
  if (state.tab === "orders") return ordersScreen();
  if (state.tab === "coins") return infoScreen("SBP Coins", "SBP Coins — внутренняя система лояльности SBP. Основное начисление: 1 BYN = 1 SBP Coin.");
  if (state.tab === "bonuses") return infoScreen("Мои бонусы", "Бонусы используются для уменьшения стоимости заказа. Максимальная скидка через бонус не может превышать 20% стоимости товара.");
  return homeScreen();
}

function render() {
  document.getElementById("app").innerHTML = `
    <div class="app ${state.theme}">
      ${storyOverlay()}
      ${menuOverlay()}
      <header class="topbar">
        ${logo()}
        <div class="actions">
          <button id="openMenu">☰</button>
          <button data-tab="cart">🛍<b>1</b></button>
          <button>⌕</button>
        </div>
      </header>
      <main class="screen">${renderScreen()}</main>
      ${bottomNav()}
    </div>
  `;
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]")?.dataset.tab;
  if (tab) return setTab(tab);

  const fav = event.target.closest("[data-fav]")?.dataset.fav;
  if (fav) {
    event.stopPropagation();
    return toggleFavorite(Number(fav));
  }

  const card = event.target.closest("[data-product]");
  if (card) return openProduct(Number(card.dataset.product));

  const size = event.target.closest("[data-size]")?.dataset.size;
  if (size) {
    state.size = size;
    return render();
  }

  const delivery = event.target.closest("[data-delivery]")?.dataset.delivery;
  if (delivery) {
    state.delivery = delivery;
    return render();
  }

  if (event.target.closest("#openMenu")) {
    state.menu = true;
    return render();
  }

  if (event.target.closest("#closeMenu")) {
    state.menu = false;
    return render();
  }

  if (event.target.closest("#themeToggle")) {
    state.theme = state.theme === "light" ? "dark" : "light";
    return render();
  }

  if (event.target.closest("#openStory")) {
    state.story = true;
    return render();
  }

  if (event.target.closest("#closeStory")) {
    state.story = false;
    return render();
  }

  if (event.target.closest("#storyCatalog")) {
    state.story = false;
    state.tab = "catalog";
    return render();
  }

  if (event.target.closest("#submitOrder")) {
    return sendOrder();
  }
});

tg?.ready?.();
tg?.expand?.();
render();
