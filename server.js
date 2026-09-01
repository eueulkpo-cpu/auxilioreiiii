require("dotenv").config();
const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let products = [
  { id: "p1", name: "Produto Digital 1", description: "Exemplo de produto digital", price: 19.90, stock: 10, delivery: "KEY-EXEMPLO-001" },
  { id: "p2", name: "Produto Digital 2", description: "Outro produto de exemplo", price: 29.90, stock: 5, delivery: "KEY-EXEMPLO-002" }
];

let coupons = [
  { code: "BEMVINDO10", type: "percent", value: 10, active: true }
];

const orders = new Map();

app.get("/api/products", (_, res) => {
  res.json(products.map(({delivery, ...p}) => p));
});

app.post("/api/coupons/check", (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  const coupon = coupons.find(c => c.code === code && c.active);
  if (!coupon) return res.status(404).json({ error: "Cupom inválido." });
  res.json(coupon);
});

app.post("/api/orders", (req, res) => {
  const { productId, quantity = 1, couponCode = "", discordUser } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Produto não encontrado." });

  const qty = Math.max(1, Math.floor(Number(quantity)));
  if (product.stock < qty) return res.status(400).json({ error: "Estoque insuficiente." });

  let total = product.price * qty;
  let discount = 0;
  const coupon = coupons.find(c => c.code === String(couponCode).trim().toUpperCase() && c.active);
  if (coupon) {
    discount = coupon.type === "percent" ? total * (coupon.value / 100) : Math.min(total, coupon.value);
    total -= discount;
  }

  const id = randomUUID();
  orders.set(id, {
    id, productId, quantity: qty, discordUser: discordUser || "",
    total: Number(total.toFixed(2)), discount: Number(discount.toFixed(2)),
    status: "PENDING", createdAt: new Date().toISOString()
  });

  // Em produção, este ponto chama a API Pix do Banco Inter e grava o txid/loc.
  // A confirmação deve acontecer somente pelo webhook do banco.
  res.json({
    orderId: id,
    total: Number(total.toFixed(2)),
    payment: {
      provider: "inter",
      status: "PENDING",
      message: "Configure a API Pix do Inter no backend para gerar o QR Code real."
    }
  });
});

// Endpoint de exemplo para a confirmação. Em produção, proteja e valide a assinatura/origem.
app.post("/api/webhooks/inter/pix", (req, res) => {
  const { orderId, status } = req.body;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

  if (status === "PAID" && order.status !== "PAID") {
    const product = products.find(p => p.id === order.productId);
    if (!product || product.stock < order.quantity) return res.status(409).json({ error: "Estoque insuficiente." });

    product.stock -= order.quantity;
    order.status = "PAID";
    order.paidAt = new Date().toISOString();

    // Aqui você pode enviar order.delivery para o usuário via bot do Discord.
    // Nunca entregue o produto antes da confirmação real do Pix.
  }
  res.json({ ok: true });
});

// Admin simples para demonstração. Troque por autenticação real em produção.
function admin(req, res, next) {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  next();
}

app.get("/api/admin/products", admin, (_, res) => res.json(products));
app.post("/api/admin/products", admin, (req, res) => {
  const { name, description = "", price, stock, delivery } = req.body;
  if (!name || !Number.isFinite(Number(price)) || !Number.isInteger(Number(stock)) || stock < 0 || !delivery) {
    return res.status(400).json({ error: "Preencha nome, preço, estoque e conteúdo de entrega." });
  }
  const product = {
    id: randomUUID(),
    name, description,
    price: Number(price),
    stock: Number(stock),
    delivery
  };
  products.push(product);
  res.json(product);
});

app.post("/api/admin/coupons", admin, (req, res) => {
  const { code, type = "percent", value } = req.body;
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized || !["percent", "fixed"].includes(type) || Number(value) <= 0) {
    return res.status(400).json({ error: "Dados do cupom inválidos." });
  }
  const coupon = { code: normalized, type, value: Number(value), active: true };
  coupons = coupons.filter(c => c.code !== normalized);
  coupons.push(coupon);
  res.json(coupon);
});

app.get("/api/admin/orders", admin, (_, res) => res.json([...orders.values()]));

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Loja rodando em http://localhost:${process.env.PORT || 3000}`);
});
