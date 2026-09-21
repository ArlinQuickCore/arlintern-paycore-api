import paycorApiService from "../services/paycorApiService.js";

const paycorDepartmentController = {
  async list(req, res) {
    try {
      const data = await paycorApiService.getDepartments();
      res.json(data);
    } catch (err) {
      console.error("Department list error:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default paycorDepartmentController;
