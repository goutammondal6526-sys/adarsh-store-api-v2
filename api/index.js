module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // 1. GET Request (Browser Test)
  if (req.method === 'GET') {
    return res.status(200).send(JSON.stringify({ 
      status: "success", 
      message: "Endpoint is live!",
      db_url_set: !!process.env.UPSTASH_REDIS_REST_URL,
      db_token_set: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      bot_token_set: !!process.env.BOT_TOKEN
    }));
  }

  // 2. POST Request (FamGateway Webhook)
  if (req.method === 'POST') {
    try {
      let body = '';
      await new Promise((resolve) => {
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => { resolve(); });
      });

      let data = {};
      try { data = JSON.parse(body); } catch (e) { data = {}; }
      
      // Agar payment success ka signal hai
      if (data.status === "success" || data.event === "payment.success") {
        const userId = data.customer_id || data.user_id; 
        const amount = parseFloat(data.amount);
        const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
        const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
        const BOT_TOKEN = process.env.BOT_TOKEN;

        if (userId && amount > 0 && UPSTASH_URL && UPSTASH_TOKEN) {
          try {
            const getRes = await fetch(${UPSTASH_URL}/get/user:${userId}:balance, {
              headers: { Authorization: Bearer ${UPSTASH_TOKEN} }
            });
            const getData = await getRes.json();
            const currentBalance = parseFloat(getData.result) || 0;
            const newBalance = currentBalance + amount;

            await fetch(${UPSTASH_URL}/set/user:${userId}:balance/${newBalance}, {
              headers: { Authorization: Bearer ${UPSTASH_TOKEN} }
            });

            if (BOT_TOKEN) {
              await fetch(https://api.telegram.org/bot${BOT_TOKEN}/sendMessage, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: userId,
                  text: ✅ Payment Successful!\n₹${amount} has been added to your balance.
                })
              });
            }
          } catch (dbError) {
            return res.status(500).send(JSON.stringify({ error: "Database Error: " + dbError.message }));
          }
        }
      }
      return res.status(200).send(JSON.stringify({ status: "received" }));
    } catch (error) {
      return res.status(500).send(JSON.stringify({ error: error.message }));
    }
  }

  return res.status(405).send(JSON.stringify({ error: "Method not allowed" }));
};
