const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });

// ========== 文件上传配置 ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `dish_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('仅支持 jpg/png/webp/gif 格式'));
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 图片上传接口
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.json({ code: 1, msg: '请选择图片' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ code: 0, data: { url, filename: req.file.filename } });
});

// 检测本机局域网IP（供桌码生成器使用）
function getLocalIPs() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      const ip = net.address;
      if (ip.startsWith('169.254')) continue;   // 无有效DHCP地址
      if (/vmware|virtualbox|hyper-v|virtual/i.test(name)) continue; // 排除虚拟机网卡
      candidates.push({ name, ip });
    }
  }
  // 优先 WiFi / 以太网 / 无线局域网，其次任意网卡
  const preferred = candidates.find(c => /wlan|wi-?fi|wireless|以太网|ethernet|局域网/i.test(c.name)) || candidates[0];
  return { ip: preferred ? preferred.ip : null, all: candidates.map(c => c.ip) };
}

app.get('/api/local-ip', (req, res) => {
  res.json({ code: 0, data: getLocalIPs() });
});

// ========== API: 菜品 ==========
app.get('/api/dishes', (req, res) => {
  const onlyAvailable = req.query.available === '1';
  const dishes = db.getDishes(onlyAvailable);
  res.json({ code: 0, data: dishes });
});

app.post('/api/dishes', (req, res) => {
  const { name, price, category, description, image_url } = req.body;
  if (!name || price == null || !category) {
    return res.json({ code: 1, msg: '名称、价格、分类不能为空' });
  }
  const dish = db.addDish({ name, price, category, description, image_url });
  res.json({ code: 0, data: dish });
});

app.put('/api/dishes/:id', (req, res) => {
  const { name, price, category, description, image_url } = req.body;
  const dish = db.updateDish(parseInt(req.params.id), {
    name, price: Math.round(price), category, description: description || '', image_url: image_url || ''
  });
  if (!dish) return res.json({ code: 1, msg: '菜品不存在' });
  res.json({ code: 0 });
});

app.patch('/api/dishes/:id/toggle', (req, res) => {
  const dish = db.toggleDish(parseInt(req.params.id));
  if (!dish) return res.json({ code: 1, msg: '菜品不存在' });
  res.json({ code: 0, data: { available: dish.available } });
});

// ========== API: 订单 ==========
app.post('/api/orders', (req, res) => {
  const { table_number, items, remark } = req.body;
  if (!table_number || !items || !Array.isArray(items) || items.length === 0) {
    return res.json({ code: 1, msg: '请选择桌号并至少选择一道菜' });
  }
  let totalPrice = 0;
  const enrichedItems = [];
  for (const item of items) {
    const dish = db.getDish(item.dish_id);
    if (!dish || dish.available !== 1) {
      return res.json({ code: 1, msg: `菜品不存在或已下架: ${item.name || item.dish_id}` });
    }
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    totalPrice += dish.price * qty;
    enrichedItems.push({ dish_id: dish.id, name: dish.name, price: dish.price, quantity: qty });
  }
  const order = db.addOrder({ table_number, items: enrichedItems, total_price: totalPrice, remark });
  res.json({ code: 0, data: order });
});

app.get('/api/orders', (req, res) => {
  const orders = db.getOrders({ status: req.query.status, limit: req.query.limit ? parseInt(req.query.limit) : undefined });
  res.json({ code: 0, data: orders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrder(req.params.id);
  if (!order) return res.json({ code: 1, msg: '订单不存在' });
  res.json({ code: 0, data: order });
});

app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'cooking', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.json({ code: 1, msg: '无效状态' });
  const order = db.updateOrderStatus(parseInt(req.params.id), status);
  if (!order) return res.json({ code: 1, msg: '订单不存在' });
  res.json({ code: 0 });
});

// ========== 统计 ==========
app.get('/api/stats', (req, res) => {
  res.json({ code: 0, data: db.getStats() });
});

// ========== 店铺设置 ==========
app.get('/api/settings', (req, res) => {
  res.json({ code: 0, data: db.getSettings() });
});

app.put('/api/settings', (req, res) => {
  const s = db.updateSettings(req.body || {});
  res.json({ code: 0, data: s });
});

// ========== 支付 ==========
// 顾客点击"我已支付"
app.patch('/api/orders/:id/pay', (req, res) => {
  const order = db.markOrderPaid(req.params.id);
  if (!order) return res.json({ code: 1, msg: '订单不存在' });
  res.json({ code: 0, data: { payment_status: order.payment_status } });
});

// 商家确认收款
app.patch('/api/orders/:id/confirm-pay', (req, res) => {
  const order = db.confirmOrderPaid(req.params.id);
  if (!order) return res.json({ code: 1, msg: '订单不存在' });
  res.json({ code: 0, data: { payment_status: order.payment_status } });
});

// ========== 页面路由 ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ┌──────────────────────────────────────┐`);
  console.log(`  │  江西小炒点餐系统已启动              │`);
  console.log(`  │                                      │`);
  console.log(`  │  顾客点餐:  http://localhost:${PORT}    │`);
  console.log(`  │  管理后台:  http://localhost:${PORT}/admin │`);
  console.log(`  │  默认密码:  admin888                 │`);
  console.log(`  └──────────────────────────────────────┘\n`);
});
