import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const TARGET_SKU = process.env.TARGET_SKU;
const BASE_URL =
    "https://www.westside.com/collections/view-all-menswear/products.json";

async function fetchAllProducts() {
    let page = 1;
    let allProducts = [];

    while (true) {
        const url = `${BASE_URL}?limit=250&page=${page}`;
        console.log(`Fetching page ${page}`);

        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            timeout: 10000,
        });

        const products = res.data.products;

        if (!products || products.length === 0) break;

        allProducts = allProducts.concat(products);
        page++;
    }

    return allProducts;
}

async function sendTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) return;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
    });
}

async function checkSku() {
    try {
        const products = await fetchAllProducts();

        for (const product of products) {
            for (const variant of product.variants) {
                if (variant.sku === TARGET_SKU) {
                    const message = `
SKU FOUND ✅
Title: ${product.title}
Price: ₹${variant.price}
Available: ${variant.available}
URL: https://www.westside.com/products/${product.handle}
          `;

                    console.log(message);
                    await sendTelegram(message);
                    return;
                }
            }
        }

        const notFoundMessage = `SKU not found ❌\nTarget SKU: ${TARGET_SKU}`;
        console.log(notFoundMessage);
        await sendTelegram(notFoundMessage);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkSku();