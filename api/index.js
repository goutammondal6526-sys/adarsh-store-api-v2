export default function handler(req, res) {
  // Set JSON header
  res.setHeader('Content-Type', 'application/json');

  // 1. Browser GET Test
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "success", 
      message: "Endpoint is live and working!",
      env_check: {
        url: !!process.env.UPSTASH_REDIS_REST_URL,
        token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        bot: !!process.env.BOT_TOKEN
      }
    });
  }

  // 2. FamGateway POST Webhook
  if (req.method === 'POST') {
    try {
      const data = req.body || {}; // Vercel automatically parses JSON body

      if (data.status === "success" || data.event === "payment.success") {
        const userId = data.customer_id || data.user_id; 
        const amount = parseFloat(data.amount);

        if (userId && amount > 0) {
          // Return success (Database logic hum baad mein add karenge, pehle isko live hone de)
          return res.status(200).json({ 
            status: "success", 
            message: "Payment received for user " + userId,
            amount: amount
          });
        }
      }
      return res.status(200).json({ status: "received" });
    } catch (error) {
      return res.status(200).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
