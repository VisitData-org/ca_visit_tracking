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
      "1585267200": {
        date: "2020-04-16",
        day: {
          maxtemp_c: -1.9,
          maxtemp_f: 35.6,
          mintemp_c: 4.3,
          mintemp_f: 6.3,
          avgtemp_c: -6.6,
          avgtemp_f: 20.2,
          maxwind_mph: 10.1,
          maxwind_kph: 16.2,
          totalprecip_mm: 0.4,
          totalprecip_in: 0.23,
          avgvis_km: 9.1,
          avgvis_miles: 5.0,
          avghumidity: 79.0,
        },
      },
      "1585958400": {
        date: "2020-04-16",
        day: {
          maxtemp_c: -1.9,
          maxtemp_f: 80.6,
          mintemp_c: 15.3,
          mintemp_f: 6.3,
          avgtemp_c: -6.6,
          avgtemp_f: 20.2,
          maxwind_mph: 10.1,
          maxwind_kph: 16.2,
          totalprecip_mm: 0.4,
          totalprecip_in: 0.67,
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
  "Missoula County": {
    region: "Missouri",
    country: "United States of America",
    lat: 39.54,
    lon: -95.05,
    tz_id: "America/Chicago",
    localtime: "2020-04-18 13:10",
    forecast: {
      "1583020800": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 70.5,
          mintemp_c: 4.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.4,
          totalprecip_in: 0.67,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
      "1583539200": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 20.5,
          mintemp_c: -15.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.87,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
      "1583625600": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 45.5,
          mintemp_c: -13.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.08,
          avgvis_km: 10.0,
          avgvis_miles: 6.0,
          avghumidity: 71.0,
        },
      },
    },
  },
  "Cascade County": {
    region: "Montana",
    country: "United States of America",
    lat: 46.87,
    lon: -113.99,
    tz_id: "America/Denver",
    localtime: "2020-04-17 2:16",
    forecast: {
      "1584057600": {
        date: "2020-04-16",
        day: {
          maxtemp_c: 5.3,
          maxtemp_f: 10.5,
          mintemp_c: -11.0,
          mintemp_f: 12.2,
          avgtemp_c: 0.4,
          avgtemp_f: 32.7,
          maxwind_mph: 4.7,
          maxwind_kph: 7.6,
          totalprecip_mm: 0.0,
          totalprecip_in: 0.24,
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
 * @param plotDataVisits Visit data selected by the user to be draw
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
 * @param plotDataVisits Data with the filtered visits/county/venue
 * @param weatherData All weather data for State
 */
function filterWeatherData(plotDataVisits, weatherData) {
  // get counties timestamps
  let dates = getTimestampsPerCounty(plotDataVisits);
  let highchartsWeatherData = getHighchartsWeatherData(dates, weatherData);
  addVisitsSites(highchartsWeatherData, plotDataVisits);
  return highchartsWeatherData;
}

/***
 *
 * @param plotDataVisits Data with the filtered visits/county/venue
 * @returns {{}} dates Object with county/date
 */
function getTimestampsPerCounty(plotDataVisits) {
  let dates = {};
  let timeStamp = [];

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

  return dates;
}

/**
 * Cross-data for weather and visits. Finds the weather data in the existent dates per county
 *
 * @param dates Dates per county where visit data is found
 * @param weatherData All weather data for State
 * @returns {{}} highchartsWeatherData Counties with weather data found in dates
 */
function getHighchartsWeatherData(dates, weatherData) {
  let highchartsWeatherData = {};

  _.each(
    _.intersection(Object.keys(weatherData), Object.keys(dates)),
    (county) => {
      let arrTemp = [];
      let arrPrec = [];
      let dataTemp = null;
      let dataPrec = null;

      //array dates/weather
      _.each(dates[county], (timeStamp) => {
        let infoWeather = weatherData[county].forecast[timeStamp];
        if (infoWeather) {
          timeStamp = parseInt(timeStamp + "000");

          arrTemp.push([
            timeStamp,
            infoWeather.day.maxtemp_f,
            infoWeather.day.mintemp_f,
          ]);

          arrPrec.push([
            timeStamp, 
            infoWeather.day.totalprecip_in
          ]);

          //temp min/max
          dataTemp = {
            data: arrTemp,
          };

          //precipitations
          dataPrec = {
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
 * Appends Visits to Weather info
 *
 * @param highchartsWeatherData Formatted data with Weather info
 * @param plotDataVisits Object with Visits data per county
 */
function addVisitsSites(highchartsWeatherData, plotDataVisits) {
  _.each(plotDataVisits, function (series) {
    if (!_.isEmpty(highchartsWeatherData[series.name]))
      highchartsWeatherData[series.name].dataVisits = {
        data: series.data,
      };
  });
}

/**
 * 3ºrd Draw a chart per county
 *
 * @param dataChartWeather Formatted data with Weather and Visits info
 */
function drawWeatherChartPerCounty(dataChartWeather) {
  let weatherDivId = "chart-weather-container";
  document.getElementById(weatherDivId).innerHTML = "";

  if (_.isEmpty(dataChartWeather)) {
    document.getElementById(weatherDivId).append("Empty weather data");
    return weatherDivId;
  }

  //grid displaying plots
  let divRow = document.createElement("div");
  let positionChart = "mt-5 w-100";

  if (!(_.keys(dataChartWeather).length === 1))
    positionChart = positionChart.replace("w-100", "col-md-6");
  divRow.setAttribute("class", "row");
  document.getElementById(weatherDivId).append(divRow);

  //drawing plot/county
  _.each(dataChartWeather, function (series, key) {
    let container = document.createElement("div");
    container.setAttribute("class", positionChart);
    divRow.append(container);

    window.chart = new Highcharts.Chart({
      chart: {
        renderTo: container,
      },
      title: {
        text: key,
      },
      yAxis: [
        {
          // Primary yAxis
          title: {
            text: "",
            style: {
              color: Highcharts.getOptions().colors[3],
            },
          },
          labels: {
            format: "{value}  %",
            style: {
              color: Highcharts.getOptions().colors[3],
            },
          },
        },
        {
          // Secondary yAxis
          title: {
            text: "",
            style: {
              color: Highcharts.getOptions().colors[7],
            },
          },
          labels: {
            format: "{value} °F",
            style: {
              color: Highcharts.getOptions().colors[7],
            },
          },
        },
        {
          // Tertiary yAxis
          gridLineWidth: 0,
          title: {
            text: "",
            style: {
              color: Highcharts.getOptions().colors[5],
            },
          },
          labels: {
            format: "{value} in",
            style: {
              color: Highcharts.getOptions().colors[5],
            },
          },
        },
      ],
      tooltip: {
        shared: true,
      },
      xAxis: {
        type: "datetime",
        dateTimeLabelFormats: {
          day: "%a %b %e",
          week: "%a %b %e",
          month: "%a %b %e",
        },
        title: {
          text: "Date",
        },
      },
      series: [
        {
          type: "line",
          name: "Visits",
          yAxis: 1,
          data: series.dataVisits.data,
          tooltip: {
            valueSuffix: " %",
          },
          color: Highcharts.getOptions().colors[3],
        },
        {
          type: "column",
          name: "Precipitations",
          data: series.dataPrec.data,
          yAxis: 2,
          tooltip: {
            valueSuffix: " in",
          },
          color: Highcharts.getOptions().colors[5],
        },
        {
          type: "arearange",
          name: "Temperature MIN/MAX",
          data: series.dataTemp.data,
          tooltip: {
            valueSuffix: " °F",
          },
          color: Highcharts.getOptions().colors[7],
        },
      ],
    });
  });
}
