const axios = require("axios");
const { generateId } = require("../utils")

const PROVIDER_URL = 'https://api.nve.no/hydrology/regobs/webapi_latest/search/all';
const HEADER = { "Content-Type": "application/json" };

const rawData = async function(min_date, max_date) {

  const args = {
    FromDate : min_date.toISOString().split("T")[0],
    ToDate : max_date.toISOString().split("T")[0],
    NumberOfRecords: 1000
  };

  try {
    let offset = 0;
    let results = []
    while (true) {
      const response = await axios.post(PROVIDER_URL, {...args, offset}, {headers: HEADER});
      results = results.concat(response.data.Results)
      offset += response.data.ResultsInPage
      if (offset >= response.data.TotalMatches) {
        break
      }
    }
    return results
  } catch (error) {
    console.error(error)
    return [];
  }
}

const parseData = (record) => {
  try {
    if (!record.Registrations[0].FullObject.SnowDepth) return null;
    const format = {
      author_name: record.NickName,
      id: generateId(record.RegId.toString() + record.DtObsTime),
      timestamp: new Date(record.DtObsTime),
      lat: record.Latitude,
      long: record.Longitude,
      depth: (Number(record.Registrations[0].FullObject.SnowDepth) || 0) * 100,
      source: "regObs"
    };
    if (!format.depth) throw new Error("Snow Depth Undefined");
    return format;
  }
  catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  rawData,
  parseData
}
