const Finance = require('../models/finance.model');

async function getSnapshot(req, res) {
  const snapshot = await Finance.getSnapshot();
  res.json(snapshot);
}

async function updateSnapshot(req, res) {
  const updated = await Finance.updateSnapshot(req.body);
  res.json(updated);
}

async function getTimeline(req, res) {
  const limit = Number(req.query.limit) || 90;
  const timeline = await Finance.getTimeline(limit);
  res.json(timeline);
}
async function getStatistics(req, res) {

const stats = await Finance.getStatistics();

res.json(stats);

}

module.exports = {
getSnapshot,
updateSnapshot,
getTimeline,
getStatistics
};
