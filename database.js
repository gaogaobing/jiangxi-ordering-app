const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// 默认数据
function getDefaultData() {
  const seedDishes = [
    { name: '辣椒炒肉', price: 2800, category: 'signature', desc: '江西招牌菜，余干辣椒配土猪肉，猛火爆炒，香辣下饭', img: '🌶️🥩' },
    { name: '藜蒿炒腊肉', price: 3200, category: 'signature', desc: '鄱阳湖藜蒿配农家腊肉，清香脆嫩', img: '🥬🥓' },
    { name: '余干豆腐', price: 1800, category: 'signature', desc: '余干特产豆腐，外焦里嫩，酱香浓郁', img: '🧈' },
    { name: '啤酒鸭', price: 3800, category: 'signature', desc: '新鲜土鸭啤酒慢炖，肉质酥烂入味', img: '🦆🍺' },
    { name: '酸豆角炒肉沫', price: 2200, category: 'stir-fry', desc: '酸脆豆角配肉沫，开胃下饭', img: '🫘' },
    { name: '小炒黄牛肉', price: 3500, category: 'stir-fry', desc: '黄牛肉配野山椒，鲜嫩弹牙', img: '🥩🌶️' },
    { name: '香干炒芹菜', price: 1600, category: 'stir-fry', desc: '香干配芹菜，清爽脆口', img: '🥬' },
    { name: '剁椒蒸鱼头', price: 4200, category: 'stir-fry', desc: '鲜鱼头配剁椒，鲜辣交融', img: '🐟🌶️' },
    { name: '干锅花菜', price: 2000, category: 'stir-fry', desc: '花菜干锅煸炒，焦香入味', img: '🥦' },
    { name: '农家小炒肉', price: 2600, category: 'stir-fry', desc: '土猪肉配青椒，家常味道', img: '🫑🥩' },
    { name: '瓦罐肉饼汤', price: 1500, category: 'soup', desc: '古法瓦罐煨制，肉饼鲜嫩汤浓', img: '🍲' },
    { name: '西红柿蛋汤', price: 1200, category: 'soup', desc: '新鲜西红柿配土鸡蛋，酸甜开胃', img: '🍅🥚' },
    { name: '冬瓜排骨汤', price: 1800, category: 'soup', desc: '排骨慢炖冬瓜，清甜不腻', img: '🦴🫛' },
    { name: '南昌拌粉', price: 1200, category: 'staple', desc: '正宗南昌拌粉，花生末配萝卜干', img: '🍜' },
    { name: '蛋炒饭', price: 1000, category: 'staple', desc: '粒粒分明，蛋香四溢', img: '🍚🥚' },
    { name: '米饭（每位）', price: 200, category: 'staple', desc: '优质东北大米，软糯香甜', img: '🍚' },
    { name: '可口可乐', price: 500, category: 'drink', desc: '冰镇可口可乐 330ml', img: '🥤' },
    { name: '王老吉', price: 600, category: 'drink', desc: '凉茶王老吉 310ml', img: '🧃' },
    { name: '雪花啤酒', price: 800, category: 'drink', desc: '雪花勇闯天涯 500ml', img: '🍺' },
    { name: '维他奶', price: 500, category: 'drink', desc: '维他豆奶 250ml', img: '🥛' },
  ];

  return {
    dishes: seedDishes.map((d, i) => ({
      id: i + 1,
      name: d.name,
      price: d.price,
      category: d.category,
      description: d.desc,
      image_url: d.img,
      available: 1,
      sort_order: i + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })),
    orders: [],
    nextDishId: seedDishes.length + 1,
    nextOrderId: 1,
    adminPassword: 'admin888'
  };
}

// 加载数据
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const data = getDefaultData();
      saveDB(data);
      console.log('[DB] 已初始化种子数据：20道菜品');
      return data;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('[DB] 加载失败，使用默认数据', e.message);
    const data = getDefaultData();
    saveDB(data);
    return data;
  }
}

// 保存数据（同步写入，数据量小不影响性能）
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let db = loadDB();

module.exports = {
  // 菜品
  getDishes(onlyAvailable) {
    return onlyAvailable
      ? db.dishes.filter(d => d.available === 1).sort((a, b) => a.sort_order - b.sort_order)
      : db.dishes.sort((a, b) => a.sort_order - b.sort_order);
  },
  getDish(id) {
    return db.dishes.find(d => d.id === id);
  },
  addDish({ name, price, category, description, image_url }) {
    const dish = {
      id: db.nextDishId++,
      name, price: Math.round(price), category,
      description: description || '',
      image_url: image_url || '🍽️',
      available: 1,
      sort_order: db.dishes.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.dishes.push(dish);
    saveDB(db);
    return dish;
  },
  updateDish(id, fields) {
    const dish = db.dishes.find(d => d.id === id);
    if (!dish) return null;
    Object.assign(dish, fields, { updated_at: new Date().toISOString() });
    saveDB(db);
    return dish;
  },
  toggleDish(id) {
    const dish = db.dishes.find(d => d.id === id);
    if (!dish) return null;
    dish.available = dish.available ? 0 : 1;
    dish.updated_at = new Date().toISOString();
    saveDB(db);
    return dish;
  },

  // 订单
  getOrders({ status, limit } = {}) {
    let orders = [...db.orders].reverse();
    if (status) orders = orders.filter(o => o.status === status);
    if (limit) orders = orders.slice(0, limit);
    return orders;
  },
  getOrder(id) {
    return db.orders.find(o => o.id == id || o.order_no === id);
  },
  addOrder({ table_number, items, total_price, remark }) {
    const now = new Date();
    const order_no = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const order = {
      id: db.nextOrderId++,
      order_no,
      table_number,
      items,
      total_price,
      remark: remark || '',
      status: 'pending',
      created_at: now.toLocaleString('zh-CN', { hour12: false }),
      updated_at: now.toLocaleString('zh-CN', { hour12: false })
    };
    db.orders.push(order);
    saveDB(db);
    return order;
  },
  updateOrderStatus(id, status) {
    const order = db.orders.find(o => o.id == id);
    if (!order) return null;
    order.status = status;
    order.updated_at = new Date().toLocaleString('zh-CN', { hour12: false });
    saveDB(db);
    return order;
  },

  // 统计
  getStats() {
    const today = new Date().toLocaleDateString('zh-CN');
    const todayOrders = db.orders.filter(o => o.created_at.startsWith(today));
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_price : 0), 0);
    return {
      today_count: todayOrders.length,
      today_revenue: todayRevenue,
      pending: db.orders.filter(o => o.status === 'pending').length,
      cooking: db.orders.filter(o => o.status === 'cooking').length,
      total_dishes: db.dishes.length
    };
  }
};
