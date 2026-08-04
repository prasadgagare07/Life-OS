const TimeExplorer = require('../models/timeExplorer.model');


async function getTimeExplorer(req, res) {

  try {

    const { date } = req.query;


    if (!date) {
      return res.status(400).json({
        error: 'Date is required'
      });
    }


    const data = await TimeExplorer.getTimeExplorer(date);


    res.json(data);


  } catch (err) {

    console.error(
      'Time Explorer Error:',
      err
    );

    res.status(500).json({
      error: 'Failed to calculate financial future'
    });

  }

}



module.exports = {

  getTimeExplorer

};
