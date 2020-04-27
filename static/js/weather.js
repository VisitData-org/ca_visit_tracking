/**
 * @brief Contains the actions to draw on the web the weather plot per county
 * These reflect the precipitations data and the MAX/MIN temperatures
 * 
 * 1ºst Extract Weather for selected state
 * 2ºnd Filter and Cross-data to obtain weather/county/timestamp
 * 3ºrd Draw a chart per county
 *
 * @author Anne M. (anne.marie@strivelabs.io)
 * @year 2020
 */

let weatherData;

/**
 * 1ºst Extract Weather for selected state
 *
 * @param selectedState current selected sate
 */
const requestWeatherData = (selectedState) = () => {
  $("#weather-group").tooltip()
  fetch("http://localhost:8080/weather/" + selectedState)
  .then((response) => response.json())
  .then((data) => {
    $("#weather-data-checkbox").prop('disabled', false);
    $("#weather-group").tooltip('hide')
    $("#weather-group").tooltip('disable')
    weatherData = data})
  .catch((error) => console.error('Error weather fetch:', error))
}


/**
 * Filters and draws the weather plots
 *
 * @param plotDataVisits Visit data selected by the user to be draw
 */
function drawWeatherData(plotDataVisits) {
  drawWeatherChartPerCounty(
    filterWeatherData(plotDataVisits, weatherData)
  );
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
        if (!_.isEmpty(infoWeather)) {
          timeStamp = parseInt(timeStamp + "000");

          arrTemp.push([
            timeStamp,
            infoWeather.maxtemp_f,
            infoWeather.mintemp_f,
          ]);

          arrPrec.push([timeStamp, infoWeather.totalprecip_in]);

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
  let positionChart = 'mt-5 col-md-6';

  if ((_.keys(dataChartWeather).length === 1)) {
    positionChart = 'w-100';
    $("#chartcontainer").hide();
  }
  
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
        zoomType: 'x'
      },
      title: {
        text: key,
      },
      yAxis: [
        {
          softThreshold: true,
          // Primary yAxis
          title: {
            text: "",
            style: {
              color: "#60acab61",
            },
          },
          labels: {
            format: "{value} °F",
            style: {
              color: "#60acab61",
            },
          },
          opposite: true
        },
        {
          // Secondary yAxis
          gridLineWidth: 0,
          title: {
            text: "",
            style: {
              color: "#f15c805e",
            },
          },
          labels: {
            format: "{value} in",
            style: {
              color: "#f15c805e",
            },
          },
          opposite: true
        },
        {
          // Tertiary yAxis
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
          type: "column",
          name: "Precipitations",
          data: series.dataPrec.data,
          yAxis: 1,
          tooltip: {
            valueSuffix: " in",
          },
          color: "#f15c805e",
        },
        {
          type: "arearange",
          name: "Temperature MIN/MAX",
          data: series.dataTemp.data,
          tooltip: {
            valueSuffix: " °F",
          },
          color: "#60acab61",
        },
        {
          type: "line",
          name: "Visits",
          yAxis: 2,
          data: series.dataVisits.data,
          tooltip: {
            valueSuffix: " %",
          },
          color: Highcharts.getOptions().colors[3],
        },
      ],
    });
  });
}
