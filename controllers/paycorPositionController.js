import paycorApiService from "../services/paycorApiService.js";

const paycorPositionController = {
  async list(req, res) {
    try {
      const data = await paycorApiService.getPositions();
      res.json(data);
    } catch (err) {
      console.error("Position list error:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default paycorPositionController;
