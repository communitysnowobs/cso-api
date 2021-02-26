const withElevation = require('../withElevation');
const MountainHub = require('./mountainhub');
const SnowPilot = require('./snowpilot');
const RegObs = require('./regobs');

// 604800000
const ONE_WEEK = 604800000;

const retrieveObservation = async function (
  provider,
  startDate = undefined,
  endDate = undefined
) {
  try {
    startDate =
      parseDate(startDate) || new Date(new Date().getTime() - ONE_WEEK);
    endDate = parseDate(endDate) || new Date(new Date().getTime());
    const rawData = await provider.rawData(startDate, endDate);
    let data = rawData.map(provider.parseData).filter((x) => x);
    data = await withElevation(data);
    return data;
  } catch (error) {
    return [];
  }
};

const parseDate = (date) => {
  date = new Date(date);
  return date instanceof Date && !isNaN(date) ? date : null;
};

module.exports = {
  retrieveObservations: async function (
    providers,
    startDate = undefined,
    endDate = undefined
  ) {
    const data = await Promise.all(
      providers.map((provider) =>
        retrieveObservation(provider, startDate, endDate)
      )
    );
    return [].concat.apply([], data);
  },
  providers: [MountainHub, SnowPilot, RegObs]
};
