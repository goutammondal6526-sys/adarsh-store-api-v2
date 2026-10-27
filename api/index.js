module.exports = (req, res) => {
  res.status(200).json({ 
    status: "success", 
    message: "Endpoint is live and working perfectly!" 
  });
};
