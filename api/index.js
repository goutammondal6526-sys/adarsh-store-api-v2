const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // 1. GET Request (Browser Test)
  if (req.method === 'GET') {
    return res.status(200).send(JSON.stringify({ 
      status: "success", 
      message: "Payment Webhook is live!" 
    }));
  }

  // 2. POST Request (FamGateway Webhook)
  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      
      // FamGateway se aane wala data (Isko FamGateway docs ke hisaab se adjust karna pad sakta hai)
      if (data.status === "success" || data.event === "payment.success") {
        const userId = data.customer_id || data.user_id; 
        const amount = parseFloat(data.amount);

        if (userId && amount > 0) {
          const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
          const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
          const BOT_TOKEN = process.env.BOT_TOKEN;

          if (UPSTASH_URL && UPSTASH_TOKEN) {
            // Step A: Current Balance check karo
            const getRes = await axios.get(${UPSTASH_URL}/get/user:${userId}:balance, {
              headers: { Authorization: Bearer ${UPSTASH_TOKEN} }
            });
            const currentBalance = parseFloat(getRes.data.result) || 0;

            // Step B: Naya Balance save karo
            const newBalance = currentBalance + amount;
            await axios.get(${UPSTASH_URL}/set/user:${userId}:balance/${newBalance}, {
              headers: { Authorization: Bearer ${UPSTASH_TOKEN} }
            });

            // Step C: Telegram par user ko message bhejo
            if (BOT_TOKEN) {
              await axios.post(https://api.telegram.org/bot${BOT_TOKEN}/sendMessage, {
                chat_id: userId,
                text: ✅ Payment Successful!\n₹${amount} has been added to your balance.
              });
            }
          }
        }
      }

      return res.status(200).send(JSON.stringify({ status: "success" }));
    } catch (error) {
      return res.status(500).send(JSON.stringify({ error: error.message }));
    }
  }

  return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
};
