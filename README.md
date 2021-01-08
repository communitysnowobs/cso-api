# CSO API Docs

CSO's API is built on top of the AWS Lambda (serverless) platform and a PostgreSQL database. The API handles data importation (`import`), exportation (`snapshot`), and querying (`observations`).


## `import` API

### Developing
*The following steps can be followed using either yarn or npm*

1. Install necessary packages

```
cd src
yarn install
```

2. Create .env.yaml file
```
touch .env.yaml
```

3. Add variables to env file. `SQL_USERNAME, SQL_PASSWORD, SQL_HOSTNAME, SQL_DATABASE` refer to the database credentials. `SNOWPILOT_PASSWORD, `SNOWPILOT_USERNAME` refer to the credentials for accessing SnowPilot's API. `ELEVATION_API_KEY` refers to a Google Maps API key with elevation permissions enabled. 
```
SQL_USERNAME: {INSERT_SQL_USERNAME_HERE}
SQL_PASSWORD: {INSERT_SQL_PASSWORD_HERE}
SQL_HOSTNAME: {INSERT_SQL_HOSTNAME_HERE}
SQL_DATABASE: {INSERT_SQL_DATABASE_HERE}
SNOWPILOT_PASSWORD: {INSERT_SNOWPILOT_PASSWORD_HERE}
SNOWPILOT_USERNAME: {INSERT_SNOWPILOT_USERNAME_HERE}
ELEVATION_API_KEY: {INSERT_ELEVATION_API_KEY_HERE}
```
4. Run lambda locally
```
ncc run `path/to/lambda.js`
```
Ex: `ncc run src/import/batch.js`

5. Deploy to AWS
```
yarn run build
yarn run deploy
```

### Adding new providers

New provider modules should contain two functions, `raw_data(min_date, max_date)`, which should return a list of observations in raw form, and `parse_record(record)`, which converts a record into the standard record format below:

```
{
  author_name: String,
  id: String,
  timestamp: Date,
  lat: Number
  long: Number,
  depth: Number,
  source: String
}
```

Elevation data from the Google Maps API is automatically inserted into the records when processed. To ensure that data from the new provider is being fetched, add the provider to the list of provider modules in `import/providers/index.js`.


## `observations` API

REST endpoint: https://api.communitysnowobs.org/observations

See the Jupyter Notebook [CSOobservationsAPI_demo.ipynb](https://github.com/communitysnowobs/cso-api/blob/master/notebooks/CSOobservationsAPI_demo.ipynb) for a demonstration of effective use of the `observations` API in Python.

### API Parameters

- `bbox`: Bounding box to return results from, specified by `<west,north,east,south>` edges in that order. Takes precedence over region. Longitude ranges from -180° to 180°. Example: `-120,45,-110,40`. Default: `None`.
- `region`: Arbitrary polygon to return results from, specified by `<long_1>,<lat_1>_<long_2>,<lat_2>_<long_3>,<lat_3>`... Example: `-120,45_-120,50_-110,50_-110,45`. Default: `None`.
- `startDate`: Earliest date to fetch results from. Example: `2018-06-23`. Default: `2016-01-01`
- `endDate`: Latest date to fetch results from. Example: `2018-06-23`. Default: `2016-01-01`
- `format`: Format to return results from. One of `geojson`, `csv`, `json`. Default: `geojson`
- `limit`: Maximum number of results to return. Example: `1000`. Default: `100`
- `page`: Page number of results to return. Example: `1`. Default: `1`.

### API response

The `observations` API returns the following attributes for each observation: `id`, `author`, `source`, `timestamp` (UTC), `depth` (meters), `elevation` (meters), `long`, `lat`. Explicit `long` and `lat` attributes are ommitted in the GeoJSON response, where the coordinates are encoded as standard point geometries.

### Example API calls

Request up to 10 observations between 120°W and 110°W, 40°N and 45°N from Jan 2018 formatted as indicated by the `format` parameter.

#### Python
```python
import requests

params = {
  "bbox": "-120,45,-110,40",
  "startDate": "2018-01-01",
  "endDate": "2018-01-31",
  "format": "geojson",
  "limit": 10,
}

response = requests.get("http://api.communitysnowobs.org/observations", params=params)
print(response.content)
```

#### Matlab
```matlab
data = urlread('https://api.communitysnowobs.org/observations', 'Get', {
  'bbox', '-120,45,-110,40', ...
  'startDate', '2018-01-01', ...
  'endDate', '2018-01-31', ...
  'format', 'csv', ...
  'limit', '10'
});
disp(data)
```

#### Bash
```bash
curl -G https://api.communitysnowobs.org/observations \
  -d bbox=-120,45,-110,40 \
  -d startDate=2018-01-01 \
  -d endDate=2018-01-31 \
  -d format=json \
  -d limit=10
```
