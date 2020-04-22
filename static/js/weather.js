/**
 * @brief Contains the actions to draw on the web the weather plot per county
 * These reflect the precipitations data and the MAX/MIN temperatures
 *
 * @author Anne M. (anne.marie@strivelabs.io)
 * @year 2020
 */

//FIXME: temporal data, remove once data is obtained correctly
let weatherData = {
  "Yellowstone County": {
    region: "Montana",
    country: "United States of America",
    lat: 44.66,
    lon: -111.1,
    tz_id: "America/Denver",
    localtime: "2020-04-16 13:34",
    forecast: {
      "1583020800": {
        date: "2020-04-15",
        day: {
          maxtemp_c: 0.5,
          maxtemp_f: 32.9,
          mintemp_c: -6.7,
          mintemp_f: 19.9,
          avgtemp_c: -1.9,
          avgtemp_f: 28.7,
          maxwind_mph: 15.0,
          maxwind_kph: 24.1,
          totalprecip_mm: 6.2,
          totalprecip_in: 0.24,
          avgvis_km: 5.0,
          avgvis_miles: 3.0,
          avghumidity: 89.0,
        },
      },
      "1583971200": {
        date: "2020-04-16",
        day: {
          maxtemp_c: -1.9,
          maxtemp_f: 28.6,
          mintemp_c: -14.3,
          mintemp_f: 6.3,
          avgtemp_c: -6.6,
          avgtemp_f: 20.2,
          maxwind_mph: 10.1,
          maxwind_kph: 16.2,
          totalprecip_mm: 0.4,
          totalprecip_in: 0.02,
          avgvis_km: 9.1,
          avgvis_miles: 5.0,
          avghumidity: 79.0,
        },
      },
    },
  },
  "Gallatin County": {
    region: "Montana",
    country: "United States of America",
    lat: 46.87,
    lon: -113.99,
    tz_id: "America/Denver",
    localtime: "2020-04-17 2:16",
    forecast: {
      "1583625600": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 41.5,
          mintemp_c: -11.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.0,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
      "1583030800": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 41.5,
          mintemp_c: -11.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.0,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
      "1583539200": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 41.5,
          mintemp_c: -11.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.0,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
    },
  },
  "Lewis and Clark County": {
    region: "Missouri",
    country: "United States of America",
    lat: 39.54,
    lon: -95.05,
    tz_id: "America/Chicago",
    localtime: "2020-04-18 13:10",
    forecast: {
      "1586908800": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 41.5,
          mintemp_c: -11.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.0,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
    },
  },
};

/**
 * Init function:
 * 1ºst Extract Weather for selected state
 * 2ºnd Filter and Cross-data to obtain weather/county/timestamp
 * 3ºrd Draw a chart per county
 *
 * @param {json} plotDataVisits visit data selected by the user to be draw
 */
function drawWeatherData(plotDataVisits) {
  //TODO: getWeatherData from script
  drawWeatherChartPerCounty(filterWeatherData(plotDataVisits, weatherData));
}

/**
 * 2ºnd Filter and Cross-data to obtain weather/county/timestamp
 * Data has been filtered to only extract the existent date times per county
 * As well only available counties are filtered
 *
 * @param {*} plotDataVisits
 * @param {*} weatherData
 */
function filterWeatherData(plotDataVisits, weatherData) {
  // get counties timestamps
  var dates = {};
  var timeStamp = [];
  var highchartsWeatherData = {};

  //extract dates per county
  _.each(plotDataVisits, (fields) => {
    _.each(fields.data, (formatted) => {
      timeStamp.push(formatted[0]);
    });
    if (timeStamp.length) {
      // or each timestamp remove hours precision
      dates[fields.name] = _.each(timeStamp, function (value, index) {
        // remove hour from timestamp
        timeStamp[index] = parseInt(value.toString().slice(0, -3));
      });
      timeStamp = [];
    }
  });

  // format matching data county/weatherPerCounty to add to highcharts data
  _.each(
    _.intersection(Object.keys(weatherData), Object.keys(dates)),
    (county) => {
      var arrTemp = [];
      var arrPrec = [];
      var dataTemp = null;
      var dataPrec = null;

      //array dates/weather
      _.each(dates[county], (timeStamp) => {
        var infoWeather = weatherData[county].forecast[timeStamp];
        if (infoWeather) {
          timeStamp = parseInt(timeStamp + "000");
          arrTemp.push([
            timeStamp,
            infoWeather.day.maxtemp_f,
            infoWeather.day.mintemp_f,
          ]);

          arrPrec.push([timeStamp, infoWeather.day.totalprecip_in]);

          //temp min/max
          dataTemp = {
            name: county + " Temp min/max",
            data: arrTemp,
          };

          //precipitations
          dataPrec = {
            name: county + " Precipitations",
            data: arrPrec,
          };
        }
      });

      if (dataTemp && dataPrec)
        highchartsWeatherData[county] = { dataTemp, dataPrec };
    }
  );

  return highchartsWeatherData;
}

/**
 * 3ºrd Draw a chart per county
 *
 * @param {*} plotDataVisits
 * @param {*} weatherData
 */
function drawWeatherChartPerCounty(dataChartWeather) {
  var weatherDivId = "chartweathercontainer";
  document.getElementById(weatherDivId).innerHTML = "";

  if (_.isEmpty(dataChartWeather)) {
    document.getElementById(weatherDivId).append("<p>Empty weather data</p>");
    return weatherDiv;
  }

  var divRow = document.createElement("div");
  divRow.setAttribute("class", "row");
  document.getElementById(weatherDivId).append(divRow);

  _.each(dataChartWeather, function (series, key) {

    var container = document.createElement("div");
    container.setAttribute("class", "col-md-4");
    divRow.append(container);

    window.chart = new Highcharts.Chart({
      series: series,
      chart: {
        renderTo: container,
      },
      title: {
        text: key,
      },
      yAxis: {
        title: {
          text: "Data",
        },
      },
      xAxis: {
        type: "datetime",
      },
      series: [
        {
          type: "arearange",
          name: series.dataTemp.name,
          data: series.dataTemp.data,
        },
        {
          type: "column",
          name: series.dataPrec.name,
          data: series.dataPrec.data,
          marker: {
            lineWidth: 2,
            lineColor: Highcharts.getOptions().colors[0],
            fillColor: "white",
          },
        },
      ],
    });
  });
}
