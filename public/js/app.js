// ========== 全局状态 ==========
let allDishes = [];
let cart = {}; // { dish_id: quantity }
let selectedTable = null;
let currentCategory = 'all';
let storeSettings = {};   // 店铺设置（含收款码）
let lastOrder = null;     // 最近一次提交的订单（用于支付/打印）

const categoryNames = {
  signature: '招牌炒菜',
  'stir-fry': '小炒类',
  soup: '汤类',
  staple: '主食',
  drink: '饮料'
};

// ========== 初始化 ==========
async function init() {
  // 从URL读取桌号参数（扫码自动带出）
  const params = new URLSearchParams(location.search);
  const tableParam = parseInt(params.get('table'));
  if (tableParam && tableParam >= 1 && tableParam <= 99) {
    selectedTable = tableParam;
  }
  await loadDishes();
  loadSettings();
  bindCategories();
  // 有桌号时高亮显示
  if (selectedTable) highlightTable(selectedTable);
}

function highlightTable(tableNo) {
  document.querySelectorAll('.table-btn').forEach(b => {
    if (parseInt(b.dataset.table) === tableNo) b.classList.add('active');
  });
}

// ========== 加载店铺设置（收款码等） ==========
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const json = await res.json();
    if (json.code === 0) storeSettings = json.data || {};
  } catch (e) { /* 忽略，支付区会显示"到收银台付款" */ }
}

// ========== 加载菜品 ==========
async function loadDishes() {
  try {
    const res = await fetch('/api/dishes?available=1');
    const json = await res.json();
    allDishes = json.data || [];
    renderDishes();
  } catch (e) {
    document.getElementById('dishList').innerHTML = '<div class="loading">加载失败，请刷新重试</div>';
  }
}

// ========== 渲染菜品 ==========
function renderDishes() {
  const list = document.getElementById('dishList');
  const dishes = currentCategory === 'all'
    ? allDishes
    : allDishes.filter(d => d.category === currentCategory);

  if (dishes.length === 0) {
    list.innerHTML = '<div class="loading">暂无菜品</div>';
    return;
  }

  list.innerHTML = dishes.map(dish => {
    const qty = cart[dish.id] || 0;
    const priceStr = formatPrice(dish.price);
    const isImg = dish.image_url && dish.image_url.startsWith('/uploads/');
    const imgHtml = isImg
      ? `<img src="${dish.image_url}" alt="${dish.name}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none';this.parentElement.textContent='🍽️'">`
      : `${dish.image_url || '🍽️'}`;
    return `
      <div class="dish-card">
        <div class="dish-img">${imgHtml}</div>
        <div class="dish-info">
          <div>
            <div class="dish-name">${dish.name}</div>
            <div class="dish-desc">${dish.description || ''}</div>
          </div>
          <div class="dish-bottom">
            <div class="dish-price">¥${priceStr}<small></small></div>
            ${qty > 0 ? `
              <div class="qty-control">
                <button class="qty-btn" onclick="changeQty(${dish.id}, -1)">−</button>
                <span class="qty-num">${qty}</span>
                <button class="qty-btn" onclick="changeQty(${dish.id}, 1)">+</button>
              </div>
            ` : `
              <button class="add-btn" onclick="changeQty(${dish.id}, 1)">+</button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 分类切换 ==========
function bindCategories() {
  document.querySelectorAll('.category-item').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      currentCategory = el.dataset.cat;
      renderDishes();
    });
  });
}

// ========== 购物车操作 ==========
function changeQty(dishId, delta) {
  const current = cart[dishId] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete cart[dishId];
  } else {
    cart[dishId] = next;
  }
  renderDishes();
  updateCartBar();
}

function getCartItems() {
  return Object.entries(cart).map(([id, qty]) => {
    const dish = allDishes.find(d => d.id == id);
    return { dish_id: parseInt(id), name: dish?.name, price: dish?.price, quantity: qty };
  });
}

function getCartTotal() {
  return getCartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
  return Object.values(cart).reduce((s, v) => s + v, 0);
}

function updateCartBar() {
  const count = getCartCount();
  const total = getCartTotal();
  const bar = document.getElementById('cartBar');
  const countEl = document.getElementById('cartCount');
  const priceEl = document.getElementById('cartPrice');

  if (count > 0) {
    bar.style.display = 'flex';
    countEl.style.display = 'flex';
    countEl.textContent = count;
    priceEl.textContent = '¥' + formatPrice(total);
  } else {
    bar.style.display = 'none';
  }
}

// ========== 购物车面板 ==========
function toggleCart() {
  const panel = document.getElementById('cartPanel');
  if (panel.style.display === 'none' || !panel.style.display) {
    renderCartPanel();
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}

function renderCartPanel() {
  const items = getCartItems();
  const list = document.getElementById('cartPanelList');
  if (items.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">购物车是空的</div>';
    return;
  }
  list.innerHTML = items.map(item => `
    <div class="cart-item">
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">¥${formatPrice(item.price * item.quantity)}</span>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty(${item.dish_id}, -1);renderCartPanel();updateCartBar();">−</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${item.dish_id}, 1);renderCartPanel();updateCartBar();">+</button>
      </div>
    </div>
  `).join('');
}

function clearCart() {
  cart = {};
  renderDishes();
  updateCartBar();
  toggleCart();
}

// ========== 下单弹窗 ==========
function openOrderModal() {
  const items = getCartItems();
  if (items.length === 0) {
    showToast('请先选择菜品');
    return;
  }
  // 渲染订单明细
  document.getElementById('orderItems').innerHTML = items.map(i => `
    <div class="order-item-row">
      <span class="item-name">${i.name} × ${i.quantity}</span>
      <span class="item-subtotal">¥${formatPrice(i.price * i.quantity)}</span>
    </div>
  `).join('');
  document.getElementById('orderTotalPrice').textContent = '¥' + formatPrice(getCartTotal());
  // 重置桌号（扫码带出的桌号保留）
  if (!selectedTable) {
    document.querySelectorAll('.table-btn').forEach(b => b.classList.remove('active'));
  }
  // 清空备注
  document.getElementById('remarkInput').value = '';
  // 显示弹窗
  document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
}

// 桌号选择
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('table-btn')) {
    document.querySelectorAll('.table-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    selectedTable = parseInt(e.target.dataset.table);
  }
});

// ========== 提交订单 ==========
let submitting = false;
async function submitOrder() {
  if (submitting) return;
  if (!selectedTable) {
    showToast('请选择桌号');
    return;
  }
  const items = getCartItems();
  if (items.length === 0) {
    showToast('请先选择菜品');
    return;
  }
  submitting = true;
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '提交中...';

  try {
    const remark = document.getElementById('remarkInput').value.trim();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: selectedTable, items, remark })
    });
    const json = await res.json();
    if (json.code === 0) {
      closeOrderModal();
      lastOrder = json.data;
      // 显示成功页
      document.getElementById('successOrderNo').textContent = '订单号：' + json.data.order_no;
      document.getElementById('successItems').innerHTML = json.data.items.map(i => `
        <div class="order-item-row">
          <span class="item-name">${i.name} × ${i.quantity}</span>
          <span class="item-subtotal">¥${formatPrice(i.price * i.quantity)}</span>
        </div>
      `).join('');
      renderPaySection(json.data);
      document.getElementById('successModal').style.display = 'flex';
      // 清空购物车
      cart = {};
      renderDishes();
      updateCartBar();
    } else {
      showToast(json.msg || '下单失败，请重试');
    }
  } catch (e) {
    showToast('网络异常，请重试');
  } finally {
    submitting = false;
    btn.disabled = false;
    btn.textContent = '提交订单';
  }
}

function closeSuccess() {
  document.getElementById('successModal').style.display = 'none';
}

// ========== 支付 ==========
function renderPaySection(order) {
  const section = document.getElementById('paySection');
  const img = document.getElementById('payQrImg');
  const empty = document.getElementById('payQrEmpty');
  const note = document.getElementById('payNote');
  const doneBtn = document.getElementById('payDoneBtn');
  const waitTip = document.getElementById('payWaitTip');

  document.getElementById('payAmount').textContent = '¥' + formatPrice(order.total_price);
  waitTip.style.display = 'none';
  doneBtn.classList.remove('paid');
  doneBtn.textContent = '💰 我已支付';

  if (storeSettings.pay_qr) {
    section.style.display = 'block';
    img.src = storeSettings.pay_qr;
    img.style.display = 'block';
    empty.style.display = 'none';
    note.textContent = storeSettings.pay_note || '长按二维码识别 · 完成支付';
  } else {
    section.style.display = 'block';
    img.style.display = 'none';
    empty.style.display = 'block';
    note.textContent = '';
  }
}

async function markPaid() {
  if (!lastOrder) return;
  const btn = document.getElementById('payDoneBtn');
  btn.disabled = true;
  btn.textContent = '提交中...';
  try {
    const res = await fetch(`/api/orders/${lastOrder.id}/pay`, { method: 'PATCH' });
    const json = await res.json();
    if (json.code === 0) {
      btn.classList.add('paid');
      btn.textContent = '✅ 已通知商家';
      document.getElementById('payWaitTip').style.display = 'block';
    } else {
      showToast(json.msg || '操作失败，请重试');
      btn.disabled = false;
      btn.textContent = '💰 我已支付';
    }
  } catch (e) {
    showToast('网络异常，请重试');
    btn.disabled = false;
    btn.textContent = '💰 我已支付';
  }
}

// ========== 小票打印 ==========
function buildReceiptHTML(order) {
  const storeName = (storeSettings.store_name || '江西小炒').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim() || '江西小炒';
  const rows = order.items.map(i => `
    <div class="r-row"><span>${i.name} x${i.quantity}</span><span>¥${formatPrice(i.price * i.quantity)}</span></div>
  `).join('');
  return `
    <div class="receipt">
      <div class="r-title">${storeName}</div>
      <div class="r-sub">顾客联 · 消费小票</div>
      <div class="r-line"></div>
      <div class="r-row"><span>单号</span><span>${order.order_no}</span></div>
      <div class="r-row"><span>桌号</span><span>${order.table_number}号桌</span></div>
      <div class="r-row"><span>时间</span><span>${order.created_at || new Date().toLocaleString('zh-CN', { hour12: false })}</span></div>
      <div class="r-line"></div>
      ${rows}
      ${order.remark ? `<div class="r-row"><span>备注</span><span>${order.remark}</span></div>` : ''}
      <div class="r-line"></div>
      <div class="r-total"><span>合计</span><span>¥${formatPrice(order.total_price)}</span></div>
      <div class="r-line"></div>
      <div class="r-foot">谢谢惠顾 · 欢迎再次光临</div>
      ${storeSettings.store_addr ? `<div class="r-foot">${storeSettings.store_addr}</div>` : ''}
    </div>
  `;
}

function printReceipt() {
  if (!lastOrder) {
    showToast('暂无订单');
    return;
  }
  document.getElementById('receiptPrintArea').innerHTML = buildReceiptHTML(lastOrder);
  window.print();
}

// ========== 工具函数 ==========
function formatPrice(cents) {
  return (cents / 100).toFixed(2);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2000);
}

// ========== 启动 ==========
init();
