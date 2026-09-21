import paycorApiService from "../services/paycorApiService.js";

const paycorTimeOffController = {
  async list(req, res) {
    try {
      const data = await paycorApiService.getTimeOffRequests(req.query);
      res.json(data);
    } catch (err) {
      console.error("Time-off list error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const data = await paycorApiService.createTimeOffRequest(req.body);
      res.json(data);
    } catch (err) {
      console.error("Time-off create error:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default paycorTimeOffController;
