module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ 
    status: "success", 
    message: "Endpoint is live and working perfectly!" 
  }));
};
