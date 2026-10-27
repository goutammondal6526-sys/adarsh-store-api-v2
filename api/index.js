export default async function handler(req, res) {
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
      
      // FamGateway se aane wala data (Example format - Ise FamGateway docs se match karna padega)
      if (data.status === "success" || data.event === "payment.success") {
        const userId = data.customer_id || data.user_id; 
        const amount = parseFloat(data.amount);

        if (userId && amount > 0) {
          // --- UPSTASH DATABASE CODE ---
          // Yahan hum direct Upstash ki REST API use karenge
          const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
          const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
          const BOT_TOKEN = process.env.BOT_TOKEN;

          if (UPSTASH_URL && UPSTASH_TOKEN) {
            // Step A: Current Balance check karo
            const getRes = await fetch(${UPSTASH_URL}/get/user:${userId}:balance, {
              headers: { Authorization: Bearer ${UPSTASH_TOKEN} }
            });
            const getData = await getRes.json();
            const currentBalance = parseFloat(getData.result) || 0;

            // Step B: Naya Balance save karo
            const newBalance = currentBalance + amount;
            await fetch(${UPSTASH_URL}/set/user:${userId}:balance/${newBalance}, {
              headers: { Authorization: Bearer ${UPSTASH_TOKEN} }
            });

            // Step C: Telegram par user ko message bhejo
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
          }
        }
      }

      return res.status(200).json({ status: "success" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
