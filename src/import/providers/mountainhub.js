const axios = require("axios");
const { generateId } = require("../utils")

const PROVIDER_URL = 'https://api.mountainhub.com/timeline';
const HEADER = { 'Accept-version': '1' };


const rawData = async function(min_date, max_date) {

  const args = {
    publisher : 'all',
    limit : 10000,
    since : min_date.getTime(),
    before : max_date.getTime()
  };

  let snow_conditions_response;
  let snowpack_test_response;
  try {
    snow_conditions_response = await axios.get(PROVIDER_URL, {params: { ...args, obs_type: 'snow_conditions' }, headers: HEADER});
    snow_conditions_response = snow_conditions_response.data.results
  } catch (error) {
    console.error(error)
    snow_conditions_response = []
  }
  try {
    snowpack_test_response = await axios.get(PROVIDER_URL, {params: { ...args, obs_type: 'snowpack_test' }, headers: HEADER});
    snowpack_test_response = snowpack_test_response.data.results
  } catch (error) {
    console.error(error)
    snowpack_test_response = []
  }
  return snow_conditions_response.concat(snowpack_test_response);
}

const parseData = (record) => {
  try {
    const format = {
      author_name: record.actor.full_name || record.actor.fullName,
      id: generateId(record.observation._id),
      timestamp: new Date(record.observation.reported_at),
      lat: record.location.coordinates[1],
      long: record.location.coordinates[0],
      depth: Number(record.observation.details[0].snowpack_depth),
      comment: record.observation.description,
      type: record.observation.type,
      source: "MountainHub"
    };
    if (isNaN(format.depth) || !format.depth) throw new Error("Snow Depth Undefined");
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
