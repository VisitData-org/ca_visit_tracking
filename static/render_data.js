let table;
let fileData;  //  globalish variable holding the parsed file data rows  HACK
let stateOrCountySel;
let ageGroupSel;
let weatherDataCheck;
let essentialSel;
const states = [];
const counties = [];
let locationTypeSel;
let locationItems = [];
let selectedCounties;
let selectedVenues;
let selectedState;

const urlParams = new URLSearchParams(window.location.search);
let datafilename = urlParams.get('datafilename');
const maxLocationTypeLinesParam = getCookie('numberOfCategoriesToPlot');

const MAX_LOCATIONTYPE_LINES_DEFAULT = 10;

let maxLocationTypes = MAX_LOCATIONTYPE_LINES_DEFAULT;

const PLOT_VALUE_TYPE_DEFAULT = 'raw';
let plotValueType = PLOT_VALUE_TYPE_DEFAULT;
const plotValueTypeParam = getCookie('plotValueType');
if (plotValueTypeParam) {
  plotValueType = plotValueTypeParam;
}

const ALL = "ALL";
const NONE = "NONE";

Highcharts.setOptions({
  lang: {
    thousandsSep: ','
  }
});

if (maxLocationTypeLinesParam) {
  maxLocationTypes = Math.max(maxLocationTypeLinesParam, 1);
}

const AGE_GROUP_LABELS = {
  all: "all ages",
  under65: "under 65 years old",
  over65: "over 65 years old",
}

const AGE_GROUP_VALUES = {
  all: "All",
  under65: "Below65",
  over65: "Above65",
}

function showVenueExamples(pagetype) {
  if (pagetype == 'state') {
    window.location.href = '/venuegroupdetails?state=' + _selectedState + '&county= '

  } else if (window.location.href.includes('raw')) {
    const _venuesUrl = 'https://foursquare.com/explore?mode=url&near=' + _selectedCounties + '%20' + _selectedState + '%20United%20States&q=' + _selectedVenues
    window.open(_venuesUrl)
  } else {
    window.location.href = '/venuegroupdetails?state=' + _selectedState + '&county=' + _selectedCounties + '&venue=' + _selectedVenues
  }
}

function venueBtnName() {
  if (window.location.href.includes('raw')) {
    document.getElementById('venueExampleBtn').innerHTML = 'Venue Examples'
  } else {
    document.getElementById('venueExampleBtn').innerHTML = 'Venue Group Details'
  }
}

function chartTitle(stateOrCounty) {

  let result = "";
  if (stateOrCountySel.value) {
    result += stateOrCountySel.value + ", ";
    if (stateOrCounty === 'county')
      result += selectedState + ", ";
  }
  if (locationTypeSel.value) {
    result += locationTypeSel[locationTypeSel.selectedIndex].text + ", ";
  }
  if (ageGroupSel.value) {
    result += AGE_GROUP_LABELS[ageGroupSel.value] + ", ";
  }
  if (!locationTypeSel.value) {
    switch (essentialSel.value) {
      case "all":
        result += "essential+non, ";
        break;
      case "essential":
        result += "essential only, ";
        break;
      case "nonessential":
        result += "non-essential only, ";
        break;
    }
  }
  result += " Estimated # Visits";

  if (plotValueType != 'raw') {
    result += " " + plotValueType + "-Day Moving Average";
  }

  return result;
}

function datenum(datestring) {
  const year = parseInt(datestring.slice(0, 4));
  const month = parseInt(datestring.slice(5, 7));
  const day = parseInt(datestring.slice(8, 10));
  return year * 10000 + month * 100 + day;
}

// for a given state/county, which locationtype lines should we show in the chart?
// let's show the top N locationtype that people were visiting on the most recent date,
// and if there aren't enough on the most recent date, then use the previous date as well,
// and so on until we have N locationtypes.
//
function locationTypesToChart(fileData) {

  // sort by most recent number descending,
  const sortStepOne = _.sortBy(fileData, function (fileDataRow) { return -1 * fileDataRow.num_visits });

  // then sort by date descending,
  const sortStepTwo = _.sortBy(sortStepOne, function (fileDataRow) { return -1 * fileDataRow.datenum; });

  // then remove duplicates.
  const locationTypes = _.uniq(_.pluck(sortStepTwo, 'location_type'));

  // the top N locationtypes are then from the latest date, going back to previous dates if necessary.
  return locationTypes.slice(0, maxLocationTypes);
}

function fileDataToHighcharts(fileDataToPlot) {
  return _.map(fileDataToPlot, function (fileDataRow) {
    const date = fileDataRow.date;
    const year = date.slice(0, 4);
    const month = date.slice(5, 7);
    const day = date.slice(8, 10);
    return [Date.UTC(year, month - 1, day), parseInt(fileDataRow.num_visits)];
  });
}

function styleSeries(series) {
  series.lineWidth = 1;
  series.marker = { radius: 5 };
  return series;
}

class Timewindow {

  constructor(windowSize) {
    this.windowSize = windowSize;
    this.arr = [];
    this.sum = 0;
  }

  shiftOldValues(time) {
    while (this.arr.length > 0 && (time - this.arr[0][0]) >= this.windowSize) {
      const oldElement = this.arr.shift();
      this.sum -= oldElement[1];
    }
  }

  avg() {
    return this.sum / this.arr.length;
  }

  push(element) {
    this.shiftOldValues(element[0]);
    this.arr.push(element);
    this.sum += element[1];
  }

  close(time) {
    // this is a special "event" that just checks the time and shifts what needs to be shifted
    this.shiftOldValues(time);
    return this.arr;
  }
}

function makeMovingAverages(rawSeries, numberOfDays) {
  rawSeries.forEach(series => {
    const window = new Timewindow(parseInt(numberOfDays) * 24 * 3600 * 1000);
    if (series.data) {
      for (let index = 0; index < series.data.length; index++) {
        const element = series.data[index];
        window.push(element);
        series.data[index] = [element[0], window.avg()];
      }
    }
  });
  return rawSeries;
}

function seriesToPlot(stateOrCounty) {
  let plotData = _.filter(fileData,
    function (datapoint) {
      const datapointEssential = datapoint.essential;
      switch (essentialSel.value) {
        case "all":
          return true;
        case "essential":
          return datapointEssential;
        case "nonessential":
          return (datapointEssential == false);
      }
    }
  );

  //filtered data for highcharts
  let results, resultsWeather;
  //TODO filter out the ages we don't need
  plotData = _.filter(plotData, (datapoint) => {
    const datapointAge = datapoint.age;
    return datapointAge == AGE_GROUP_VALUES[ageGroupSel.value];
  });

  if (stateOrCountySel.value && !locationTypeSel.value) {
    let fileDataToPlot = _.where(plotData, { [stateOrCounty]: stateOrCountySel.value });
    if (stateOrCounty == 'state') {
      // if we are processing a state pick out the statewide number
      fileDataToPlot = _.where(fileDataToPlot, { 'county': 'Statewide' });
    }

    const lts = locationTypesToChart(fileDataToPlot);
    results = _.map(lts, function (locationType) {
      return styleSeries({
        name: locationType,
        data: fileDataToHighcharts(_.where(fileDataToPlot, { location_type: locationType }))
      });
    });
    results = _.filter(results, function (series) {
      return series.data.length > 0;
    });

    results = sortStatewideFirst(results);
    results.unshift({ name: 'Show/Hide All', visible: false });

    if (plotValueType != 'raw') {
      results = makeMovingAverages(results, plotValueType);
    }

    const maxResultsData = _.clone(_.max(results, (value) => { return _.size(value.data) }));
    maxResultsData.titleName = maxResultsData.name;
    maxResultsData.name = stateOrCountySel.value;
    resultsWeather = [maxResultsData]

  }
  else if (!stateOrCountySel.value && locationTypeSel.value) {
    const fileDataToPlot = _.where(plotData, { location_type: locationTypeSel[locationTypeSel.selectedIndex].text });
    results = _.map(statesOrCounties, function (stateOrCountyValue) {
      return styleSeries({
        name: stateOrCountyValue,
        data: fileDataToHighcharts(_.where(fileDataToPlot, { [stateOrCounty]: stateOrCountyValue }))
      });
    });
    results = _.filter(results, function (series) {
      return series.data.length > 0;
    });

    results = sortStatewideFirst(results);
    results.unshift({ name: 'Show/Hide All', visible: false });

    resultsWeather = _.clone(results);
  }
  else if (stateOrCountySel.value && locationTypeSel.value) {
    let fileDataToPlot = _.where(plotData, { location_type: locationTypeSel[locationTypeSel.selectedIndex].text, [stateOrCounty]: stateOrCountySel.value });
    if (stateOrCounty == 'state') {
      // if we are processing a state pick out the statewide number
      fileDataToPlot = _.where(fileDataToPlot, { 'county': 'Statewide' });
    }
    results = [styleSeries({
      name: locationTypeSel[locationTypeSel.selectedIndex].text + " in " + stateOrCountySel.value,
      data: fileDataToHighcharts(fileDataToPlot)
    })];

    resultsWeather = _.clone([styleSeries({
      name: stateOrCountySel.value,
      titleName: locationTypeSel[locationTypeSel.selectedIndex].text,
      data: fileDataToHighcharts(fileDataToPlot)
    })]);
  }

  if (weatherDataCheck) {
    drawWeatherData(resultsWeather);
  } else {
    $("#chart-weather-container").html("");
    $("#chartcontainer").show();
  }

  return results;
}

function sortStatewideFirst(seriesToSort) {
  return seriesToSort.sort((a, b) => {
    if (a.name == 'Statewide' && b.name != 'Statewide') {
      return -1;
    }
    if (a.name != 'Statewide' && b.name == 'Statewide') {
      return 1;
    }
    return a.name - b.name;
  })
}

function isPlotDataEmpty(seriesForPlot) {
  let plotEmpty = true;
  for (let seriesIndex = 0; seriesIndex < seriesForPlot.length; seriesIndex++) {
    const series = seriesForPlot[seriesIndex];
    const seriesData = series.data;
    if (seriesData && seriesData.length > 0) {
      plotEmpty = false;
      break;
    }
  }
  return plotEmpty;
}

function drawChart(stateOrCounty) {

  const chartHeightParam = getCookie('chartHeight');
  if (chartHeightParam) {
    const chartContainerDiv = document.getElementById("chartcontainer");
    chartContainerDiv.style.height = chartHeightParam;
  }

  const seriesForPlot = seriesToPlot(stateOrCounty);
  if (isPlotDataEmpty(seriesForPlot)) {
    // handle empty plot
    setChartContainerText("No matching data to chart");
  } else {
    Highcharts.chart('chartcontainer', {
      chart: {
        animation: false,
        zoomType: 'x',
        events: {
          load() {
            this.showHideFlag = true;
          }
        }
      },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 768
          },
          // Make the labels less space demanding on mobile
          chartOptions: {
            xAxis: {
              dateTimeLabelFormats: {
                day: '%a %b %e',
                week: '%a %b %e',
                month: '%a %b %e',
              },
              title: {
                text: ''
              }
            },
            yAxis: {
              labels: {
                align: 'left',
                x: 0,
                y: -2
              },
              title: {
                text: ''
              }
            }
          }
        }]
      },
      title: { text: chartTitle(stateOrCounty) },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%a %b %e',
          week: '%a %b %e',
          month: '%a %b %e',
        },
        title: {
          text: 'Date'
        },
      },
      yAxis: { title: { text: 'Estimated # Visits' }, min: 0 },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%a %b %e}: {point.y:,.0f}'
      },
      plotOptions: {
        series: {
          events: {
            legendItemClick: function () {
              if (this.index == 0) {
                if (this.showHideFlag == undefined) {
                  this.showHideFlag = true
                  this.chart.series.forEach(series => {
                    series.hide()
                  })
                } else if (this.showHideFlag == true) {
                  this.chart.series.forEach(series => {
                    series.hide()
                  })
                } else {
                  this.chart.series.forEach(series => {
                    series.show()
                  })
                }
                this.showHideFlag = !this.showHideFlag;
              }
            }
          }
        }
      },
      series: seriesForPlot
    });
  }
}

function cleanLocType(string) {
  if (string == "Cafￃﾩs") {
    return "Cafes";
  }
  return string;
}

function redoFilter(stateOrCounty) {
  table.clearFilter();
  if (stateOrCountySel.value) {
    table.addFilter(stateOrCounty, "=", stateOrCountySel.value);
  }
  if (locationTypeSel.value) {
    table.addFilter("location_type", "=", locationTypeSel[locationTypeSel.selectedIndex].text);
  }
  if (ageGroupSel.value) {
    table.addFilter("age", "=", AGE_GROUP_VALUES[ageGroupSel.value]);
  }
  if (essentialSel.value != 'all') {
    table.addFilter("essential", '=', (essentialSel.value == 'essential'));
  }
  if (stateOrCountySel.value || locationTypeSel.value) {
    drawChart(stateOrCounty);
  };
  if (ageGroupSel.value) {
    table.redraw(true);
  }
}

function populateLocationSelect(selectElement, itemList, selected) {
  // ok, I think we need to disable the event handler while we do this.
  _.each(itemList, function (itemPair) {
    const option = document.createElement("option");
    option.value = itemPair[1];
    option.text = itemPair[0];
    if (_.contains(selected, option.value)) {
      option.selected = true;
    }
    selectElement.add(option);
  });
}

function populateSelect(selectElement, stringList, selected) {
  // ok, I think we need to disable the event handler while we do this.
  _.each(stringList, function (theString) {
    const option = document.createElement("option");
    option.value = theString;
    option.text = theString;
    if (_.contains(selected, option.text)) {
      option.selected = true;
    }
    selectElement.add(option);
  });
}

function isGroupedCategoryEssential(groupName) {
  const isGroupEssential = groupToEssentialMap.get(groupName);
  return isGroupEssential;
}

function getCounty(rowCounty) {
  if (rowCounty === "") {
    return "Statewide";
  } else {
    return rowCounty;
  }
}

function parseGroupedRow(stateOrCounty, row) {
  if (row.categoryid != 'Group') {
    return undefined;
  } else {
    return {
      date: row.date,
      state: selectedState, //row.state,
      county: getCounty(row.county),
      location_type: row.categoryname,
      location_item: [row.categoryname, row.categoryname],
      p50Duration: row.p50Duration,
      meanDuration: row.avgDuration,
      essential: isGroupedCategoryEssential(row.categoryname),
      num_visits: row.visits,
      age: row.demo,
      datenum: datenum(row.date)
    };
  }
}

function parseRawRow(stateOrCounty, row) {
  if (row.categoryid === '') {
    return undefined;
  } else {
    return {
      date: row.date,
      state: selectedState, //row.state,
      county: getCounty(row.county),
      location_type: row.categoryname,
      location_item: [row.categoryname, row.categoryid],
      p50Duration: row.p50Duration,
      meanDuration: row.avgDuration,
      essential: isCategoryEssential(row.categoryid),
      num_visits: row.visits,
      age: row.demo,
      datenum: datenum(row.date)
    };
  }
}

let isRawBit;

function isRaw() {
  return isRawBit;
}

function parseRow(stateOrCounty, row) {
  if (isRaw()) {
    return parseRawRow(stateOrCounty, row);
  }
  return parseGroupedRow(stateOrCounty, row);
}

function getStates() {
  return [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "Washington, D.C.",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];
}

function getCounties(state) {
  let counties;

  $.ajax({
    url: _fourSquareDataUrl + "/index.json",
    dataType: 'json',
    async: false,
    success: function (data) {
      console.debug("loading index");
      counties = data.counties[state];
      console.debug("loaded index");
    }
  });

  return counties;
}

function parsingDone(stateOrCounty, results, file) {
  setChartContainerText("");
  console.debug("parsingDone called");
  fileData = _.map(
    results.data,
    function (row) { return parseRow(stateOrCounty, row); }
  );
  fileData = _.compact(fileData);
  if (stateOrCounty === 'state') {
    statesOrCounties = getStates();
  } else {
    statesOrCounties = getCounties(selectedState);
  }

  table = new Tabulator("#data-table", {
    data: fileData,
    columns: [
      { title: "County", field: "county" },
      { title: "Location Type", field: "location_type" },
      { title: "Essential", field: "essential", visible: false },
      { title: "# Visits", field: "num_visits", visible: true },
      { title: "Median Visit Length, Minutes", field: "p50Duration", visible: true },
      { title: "Mean Duration Minutes", field: "meanDuration", visible: false },
      { title: "Age", field: "age", visible: true },
      { title: "Date", field: "date" },
    ],
    height: "600px",
    layout: "fitColumns",
    initialSort: [
      { column: "date", dir: "desc" }
    ],
  });

  if (stateOrCounty === 'county') {
    document.getElementById('state_name_header').innerHTML = selectedState
  }
  populateSelect(
    stateOrCountySel,
    statesOrCounties,
    stateOrCounty === 'state' ? [selectedState] : selectedCounties
  );

  populateLocationSelect(locationTypeSel, locationItems, selectedVenues);

  essentialSel.addEventListener('change', function () {
    redoFilter(stateOrCounty);
    if (stateOrCountySel.value || locationTypeSel.value) {
      drawChart(stateOrCounty);
    }
  });

  if (locationTypeSel.value) {
    // ok, we selected a location type so disable essential
    essentialSel.value = 'all';
    essentialSel.parentElement.style.display = 'none';
  }

  //actions for agegroup-select button
  ageGroupSel.addEventListener('change', function (event) {
    redoFilter(stateOrCounty);

    if (stateOrCountySel.value || locationTypeSel.value) {
      drawChart(stateOrCounty);
    }
  });

  enableSelects();

  //actions for weather-data button
  $('#weather-data-checkbox').change(function () {
    //enable/disable weather forecast
    weatherDataCheck = $(this).prop("checked")
    //refresh chart
    drawChart(stateOrCounty)
  });

  redoFilter(stateOrCounty);

  _.each([stateOrCountySel, locationTypeSel], function (sel) {
    sel.addEventListener('change', function () { return eventListener(stateOrCounty); });
  });

}

const groupToEssentialMap = new Map();

const groupMappings = [
  { groupName: "Airport", essential: true },
  { groupName: "Alcohol", essential: true },
  { groupName: "Arts & Entertainment", essential: false },
  { groupName: "Banks", essential: true },
  { groupName: "Beach", essential: false },
  { groupName: "Big Box Stores", essential: false },
  { groupName: "Bus", essential: true },
  { groupName: "Colleges & Universities", essential: false },
  { groupName: "Convenience Store", essential: true },
  { groupName: "Discount Stores", essential: false },
  { groupName: "Drug Store", essential: true },
  { groupName: "Fast Food Restaurants", essential: true },
  { groupName: "Fitness Center", essential: false },
  { groupName: "Food", essential: true },
  { groupName: "Gas Stations", essential: true },
  { groupName: "Government", essential: true },
  { groupName: "Grocery", essential: true },
  { groupName: "Hardware Stores", essential: true },
  { groupName: "Hotel", essential: false },
  { groupName: "Medical", essential: true },
  { groupName: "Nightlife Spots", essential: false },
  { groupName: "Office", essential: false },
  { groupName: "Outdoors & Recreation", essential: false },
  { groupName: "Professional & Other Places", essential: false },
  { groupName: "Residences", essential: true },
  { groupName: "School", essential: false },
  { groupName: "Shops & Services", essential: false },
  { groupName: "Spiritual Center", essential: false },
  { groupName: "Sports", essential: false },
  { groupName: "Travel & Transport", essential: false },
  { groupName: "undefined", essential: false }
];

for (let groupIndex = 0; groupIndex < groupMappings.length; groupIndex++) {
  const nextGroup = groupMappings[groupIndex];
  groupToEssentialMap.set(nextGroup.groupName, nextGroup.essential);
}

const eventListener = function (stateOrCounty) {
  if (stateOrCounty === 'state') {
    const newState = stateOrCountySel.value ? encodeURIComponent(stateOrCountySel.value) : ALL;
    const stateChanged = newState != selectedState;
    selectedState = newState;
    selectedVenue = locationTypeSel.value ? encodeURIComponent(locationTypeSel.value) : ALL;
    windowLocationToSet = "/bystatesel/" + selectedState + "/" + selectedVenue;
    if (urlParams.get('datafilename')) {
      windowLocationToSet += "?datafilename=" + urlParams.get('datafilename');
    }
    window.location = windowLocationToSet;
  } else {
    county = stateOrCountySel.value ? encodeURIComponent(stateOrCountySel.value) : ALL
    venue = locationTypeSel.value ? encodeURIComponent(locationTypeSel.value) : ALL;
    windowLocationToSet = "/bydatesel/" + selectedState + "/" + county + "/" + venue;
    if (urlParams.get('datafilename')) {
      windowLocationToSet += "?datafilename=" + urlParams.get('datafilename');
    }
    window.location = windowLocationToSet;
  }
};

function parseSelection(stateOrCounty) {
  if (stateOrCounty === 'state') {
    selectedState = _selectedState == ALL ? '' : _selectedState;
    selectedVenues = _selectedVenues == ALL ? [] : _selectedVenues.split(",");
  } else {
    selectedState = (_selectedState == NONE || _selectedState == "") ? 'California' : _selectedState;
    selectedCounties = _selectedCounties == ALL ? [] : _selectedCounties.split(",");
    selectedVenues = _selectedVenues == ALL ? [] : _selectedVenues.split(",");
  }
}

function setNavLinks(stateOrCounty) {
  const encodedState = encodeURIComponent(selectedState);
  const encodedCounty = stateOrCounty === 'county' ? encodeURIComponent(_selectedCounties) : 'ALL'

  document.getElementById('nav-chartgrouped').href = "/bydatesel/" + encodedState + "/" + encodedCounty + "/ALL";
  document.getElementById('nav-chartall').href = "/bydatesel/" + encodedState + "/" + encodedCounty + "/ALL?datafilename=raw";
  document.getElementById('nav-stategrouped').href = "/bystatesel/" + encodedState + "/ALL";
  document.getElementById('nav-stateall').href = "/bystatesel/" + encodedState + "/ALL?datafilename=raw";
}

function disableSelects() {
  stateOrCountySel.disabled = true;
  locationTypeSel.disabled = true;
  ageGroupSel.disabled = true;
  essentialSel.disabled = true;
}

function enableSelects() {
  stateOrCountySel.disabled = false;
  locationTypeSel.disabled = false;
  ageGroupSel.disabled = false;
  essentialSel.disabled = false;
}

function parse(stateOrCounty) {

  if (urlParams.get('datafilename')) {
    isRawBit = true;
  }

  let selectedFileString = '';
  if (stateOrCounty == 'county' && selectedCounties.length > 0) {
    selectedFileString = '_' + selectedCounties[0].replace(/\s/g, '');
  } else if (selectedVenues.length > 0) {
    selectedFileString = '_' + selectedVenues[0];
  }

  stateFile = _fourSquareDataUrl + '/' + (isRaw() ? 'raw' : 'grouped') + selectedState.replace(/[\s\,\.]/g, '') + '.csv';
  if (selectedFileString === '') {
    // no venue or county selected
    datafilename = stateFile;
  } else {
    datafilename = _fourSquareDataUrl + '/' + selectedState.replace(/[\s\,\.]/g, '') + selectedFileString.replace(/[\s\,\.&]/g, '') + '.csv';
  }
  console.debug(datafilename);

  if (stateOrCounty === 'state') {
    if (!isRaw()) {
      document.getElementById('nav-stategrouped').classList.add('font-weight-bold')
    } else {
      document.getElementById('nav-stateall').classList.add('font-weight-bold')
    }
  } else {
    if (!isRaw()) {
      document.getElementById('nav-chartgrouped').classList.add('font-weight-bold')
    } else {
      document.getElementById('nav-chartall').classList.add('font-weight-bold')
    }
  }

  stateOrCountySel = document.getElementById(
    stateOrCounty === 'state' ? 'state-select' : 'county-select'
  );
  locationTypeSel = document.getElementById('location-type-select');
  essentialSel = document.getElementById('essential-select');
  ageGroupSel = document.getElementById('agegroup-select');

  //FIXME #184 If there is an error then it hangs on "Loading..." when there is an error parsing we should alert here
  setChartContainerText('Loading Data...');
  disableSelects();

  Papa.parse(stateFile, {
    download: true,
    header: true,
    complete: (results, file) => {
      locationItems = _.map(results.data, (row) => {
        if (!(row.categoryname)) {
          return undefined;
        }
        if (isRaw()) {
          if (row.categoryid == 'Group') {
            return undefined;
          } else {
            return [row.categoryname, row.categoryid];
          }
        } else {
          if (row.categoryid != 'Group') {
            return undefined;
          } else {
            return [row.categoryname, row.categoryname];
          }
        }
      });
      locationItems = _.compact(locationItems);
      locationItems = _.uniq(locationItems, false, (item) => { return item.join("_") });
      locationItems = locationItems.sort((a, b) => {
        let nameA = a[0];
        if (nameA) {
          nameA = nameA.toUpperCase(); // ignore upper and lowercase
        }
        let nameB = b[0];
        if (nameB) {
          nameB = nameB.toUpperCase(); // ignore upper and lowercase
        }
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        // names must be equal
        return 0;
      });

      // ok, now go get the rest of the data
      Papa.parse(datafilename, {
        download: true,
        header: true,
        complete: function (results, file) { return parsingDone(stateOrCounty, results, file); }
      });
    }
  });
}

function setChartContainerText(chartText) {
  const chartContainer = document.getElementById('chartcontainer');
  while (chartContainer.firstChild) {
    chartContainer.removeChild(chartContainer.firstChild);
  }
  const textElement = document.createElement("h2")
  textElement.innerText = chartText;
  textElement.style.textAlign = 'center';
  chartContainer.appendChild(textElement);
  chartContainer.style.height = "";
}

function renderData(stateOrCounty) {
  setChartContainerText("");
  parseSelection(stateOrCounty);
  if ($('#weather-data-checkbox').length && (!_.isEmpty(selectedCounties) || !_.isEmpty(selectedVenues))) {
    requestWeatherData(selectedState);
  }
  setNavLinks(stateOrCounty);
  parse(stateOrCounty);
}
