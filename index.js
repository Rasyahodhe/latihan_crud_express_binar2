const express = require("express");
let products = require("./db/products.json");
const morgan = require("morgan");
const app = express();

app.use(morgan("combined"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Nilai Saldo
let credit = 25000000;

// Variabel tampung Jumlah Barang yang dibeli
let cart = {};

// Untuk melihat semua product
app.get("/api/products", (req, res) => {
  return res.json({ data: products });
});

// ======================================== Menambahkan barang ke cart
app.post("/api/cart", (req, res) => {
  // ambil data product dari body request
  const { productId, quantity } = req.body;
  //   Cek apakah produk ada di data produk
  const product = products.find((p) => p.id === productId);
  //   Mengecek Apakah Procut ada
  if (!product) {
    return res.status(404).json({
      message: "Product tidak terdaftar",
    });
  }
  //   Mengecek apakah Stok mencukupi
  if (quantity > product.stock) {
    return res.status(400).json({
      message: "Stock tidak mencukupi",
    });
  }
  if (cart[productId]) {
    // Jika sudah ada, pastikan total barang sesuai dengan stock
    if (cart[productId].quantity + quantity > product.stock) {
      return res.status(400).json({
        message: "Stock tidak mencukupi",
      });
    }
    // tambahkan quantity ke cart
    cart[productId].quantity += quantity;
    // tambahlam total
    cart[productId].total += quantity * product.price;
  } else {
    cart[productId] = {
      name: product.name,
      description: product.description,
      brand: product.brand,
      price: product.price,
      quantity: quantity,
      total: product.price * quantity,
    };
  }
  return res.json({
    message: "Product berhasil ditambahkan ke cart",
    data: Object.values(cart),
  });
});
// Melihat isi keranjang
app.get("/api/cart", (req, res) => {
  return res.json({ data: Object.values(cart) });
});
// Menghapus isi keranjang
app.delete("/api/cart", (req, res) => {
  cart = {};
  return res.json({ message: "Cart berhasil dikosongkan" });
});

//====================================================== endpoint untuk mengecek saldo
app.get("/api/credit", (req, res) => {
  return res.json({ data: credit });
});

// ====================================================== endpoint untuk checkout
app.post("/api/checkout", (req, res) => {
  // ambil data dari body request
  const { name, address, phone } = req.body;

  //   cek apakah cart kosong
  if (Object.keys(cart).length === 0) {
    return res.status(400).json({
      message: "Cart masih kosong",
    });
  }
  //   hitung total harga
  let total = 0;
  for (const item of Object.values(cart)) {
    total += item.total;
  }
  //   cek apakah saldo cukup
  if (total > credit) {
    return res.status(400).json({
      message: "Saldo tidak mencukupi",
    });
  }

  //   kurangi saldo
  credit -= total;
  // kirim pesan
  return res.json({
    message: "Pesanan Berhasil diproses",
    data: {
      name,
      address,
      phone,
      total,
      credit,
    },
  });
});

app.listen(3000, () => {
  console.log(`Server Jalan di port http://localhost:${3000}`);
});
