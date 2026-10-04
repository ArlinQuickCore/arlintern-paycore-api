import paycorApiService from "../services/paycorApiService.js";

const paycorTimeEntryController = {
  async punches(req, res) {
    try {
      const data = await paycorApiService.getTimeCardPunches(req.query);
      res.json(data);
    } catch (err) {
      console.error("Time card punches error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async employeePunches(req, res) {
    try {
      const data = await paycorApiService.getEmployeeTimeCardPunches(req.params.id, req.query);
      res.json(data);
    } catch (err) {
      console.error("Employee time card punches error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async employeeRawPunches(req, res) {
    try {
      const data = await paycorApiService.getEmployeePunches(req.params.id, req.query);
      res.json(data);
    } catch (err) {
      console.error("Employee punches error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async employeeHours(req, res) {
    try {
      const data = await paycorApiService.getEmployeeHours(req.params.id, req.query);
      res.json(data);
    } catch (err) {
      console.error("Employee hours error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async missedPunches(req, res) {
    try {
      const data = await paycorApiService.getMissedPunchRequests(req.query);
      res.json(data);
    } catch (err) {
      console.error("Missed punch requests error:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default paycorTimeEntryController;
