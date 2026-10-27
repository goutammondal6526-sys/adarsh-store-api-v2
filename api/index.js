const https = require('https');

function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  // 1. GET Request (Browser Test)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "success", 
      message: "Payment Webhook is live!" 
    });
  }

  // 2. POST Request (FamGateway Webhook)
  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      if (data.status === "success" || data.event === "payment.success") {
        const userId = data.customer_id || data.user_id; 
        const amount = parseFloat(data.amount);

        if (userId && amount > 0) {
          const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
          const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
          const BOT_TOKEN = process.env.BOT_TOKEN;

          if (UPSTASH_URL && UPSTASH_TOKEN) {
            // Fetch current balance
            const getUrl = ${UPSTASH_URL}/get/user:${userId}:balance;
            const getOptions = { headers: { Authorization: Bearer ${UPSTASH_TOKEN} } };
            const getRes = await makeRequest(getUrl, getOptions);
            let currentBalance = 0;
            try {
              const parsed = JSON.parse(getRes);
              currentBalance = parseFloat(parsed.result) || 0;
            } catch(e) {}

            // Set new balance
            const newBalance = currentBalance + amount;
            const setUrl = ${UPSTASH_URL}/set/user:${userId}:balance/${newBalance};
            await makeRequest(setUrl, getOptions);

            // Send Telegram message
            if (BOT_TOKEN) {
              const tgUrl = https://api.telegram.org/bot${BOT_TOKEN}/sendMessage;
              const tgData = JSON.stringify({
                chat_id: userId,
                text: ✅ Payment Successful!\n₹${amount} has been added to your balance.
              });
              const tgOptions = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(tgData)
                }
              };
              await makeRequest(tgUrl, tgOptions, tgData);
            }
          }
        }
      }

      return res.status(200).json({ status: "success" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
