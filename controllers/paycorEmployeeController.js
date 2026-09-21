import paycorApiService from "../services/paycorApiService.js";

const paycorEmployeeController = {
  async list(req, res) {
    try {
      const data = await paycorApiService.getEmployees(req.query);
      res.json(data);
    } catch (err) {
      console.error("Employee list error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await paycorApiService.getEmployeeById(req.params.id);
      res.json(data);
    } catch (err) {
      console.error("Employee lookup error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async earningsAndDeductions(req, res) {
    try {
      const data = await paycorApiService.getEarningsAndDeductions(req.params.id);
      res.json(data);
    } catch (err) {
      console.error("Earnings and deductions error:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default paycorEmployeeController;
