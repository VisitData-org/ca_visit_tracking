
var table;
var fileData;  //  globalish variable holding the parsed file data rows
var countySel;
var ageGroupSel;
var locationTypeSel;
var counties = [];
var locationTypes = [];

const urlParams = new URLSearchParams(window.location.search);
var datafilename = urlParams.get('datafilename');
var maxLocationTypeLinesParam = urlParams.get('maxlocationtypes')

const MAX_LOCATIONTYPE_LINES_DEFAULT = 10;

var maxLocationTypes = MAX_LOCATIONTYPE_LINES_DEFAULT;

if(maxLocationTypeLinesParam) {
  maxLocationTypes = Math.max(maxLocationTypeLinesParam,1);
}

function chartTitle() {
  var result = "";
  if (countySel.value) {
    result += countySel.value + ", ";
  }
  if (locationTypeSel.value) {
    result += locationTypeSel.value + ", ";
  }
  switch (ageGroupSel.value) {
  case "all":
    result += "all ages, ";
    break;
  case "under65":
    result += "under 65 years old, ";
    break;
  case "over65":
    result += "over 65 years old, ";
    break;
  }
  result += " % of Usual Visits";
  return result;
}

function datenum(datestring) {
  var year = parseInt(datestring.slice(0, 4));
  var month = parseInt(datestring.slice(5, 7));
  var day = parseInt(datestring.slice(8, 10));
  return year * 10000 + month * 100 + day;
}

// for a given county, which locationtype lines should we show in the chart?
// let's show the top N locationtype that people were visiting on the most recent date,
// and if there aren't enough on the most recent date, then use the previous date as well,
// and so on until we have N locationtypes.
// 
function locationTypesToChart(fileDataForCounty) {

  // sort by rank ascending,
  var sortStepOne = _.sortBy(fileDataForCounty, function(fileDataRow) { return fileDataRow.rank });
  
  // then sort by date descending,
  var sortStepTwo = _.sortBy(sortStepOne, function(fileDataRow) { return -1 * fileDataRow.datenum; });
  
  // then remove duplicates.
  var locationTypes = _.uniq(_.pluck(sortStepTwo, 'location_type'));
  
  // the top N locationtypes are then from the latest date, going back to previous dates if necessary.
  return locationTypes.slice(0, maxLocationTypes);
}

var visitIndexToShow = {
  all: 'visit_index',
  under65: 'visit_index_under65',
  over65: 'visit_index_over65'
};

function fileDataToHighcharts(fileDataToPlot) {
  return _.map(fileDataToPlot, function(fileDataRow) {
    var date = fileDataRow.date;
    var year = date.slice(0, 4);
    var month = date.slice(5, 7);
    var day = date.slice(8, 10);
    return [Date.UTC(year, month-1, day), parseInt(fileDataRow[visitIndexToShow[ageGroupSel.value]])];
  });
}

function styleSeries(series) {
  series.lineWidth = 1;
  series.marker = {radius: 5};
  return series;
}

function seriesToPlot() {
  if (countySel.value && !locationTypeSel.value) {
    var fileDataToPlot = _.where(fileData, { county: countySel.value });
    var lts = locationTypesToChart(fileDataToPlot);
    var results = _.map(lts, function(locationType) {
      return styleSeries({
        name: locationType,
        data: fileDataToHighcharts(_.where(fileDataToPlot, { location_type: locationType }))
      });
    });
    results = _.filter(results, function(series) {
      return series.data.length > 0;
    });
    return results;
  }
  if (!countySel.value && locationTypeSel.value) {
    var fileDataToPlot = _.where(fileData, { location_type: locationTypeSel.value });
    var results = _.map(counties, function(county) {
      return styleSeries({
        name: county,
        data: fileDataToHighcharts(_.where(fileDataToPlot, { county: county }))
      });
    });
    results = _.filter(results, function(series) {
      return series.data.length > 0;
    });
    return results;
  }
  if (countySel.value && locationTypeSel.value) {
    var fileDataToPlot = _.where(fileData, { location_type: locationTypeSel.value, county: countySel.value });
    return [styleSeries({
      name: locationTypeSel.value + " in " + countySel.value,
      data: fileDataToHighcharts(fileDataToPlot)
    })];
  }
}

function drawChart() {
  Highcharts.chart('chartcontainer', {
    chart: {
      animation: false
    },
    title: {   text: chartTitle()  },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        day: '%a %b %e',
        week: '%a %b %e',
        month: '%a %b %e',
      },
      title: {
        text: 'Date'
      }
    },
    yAxis: { title: { text: '% of Usual Visits' }, min: 0 },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%a %b %e}: {point.y}%'
    },
    plotOptions: {  series: {    animation: false   }   },
    series: seriesToPlot()
  });
}

function cleanLocType(string) {
  if (string == "Cafￃﾩs") {
    return "Cafes";
  }
  return string;
}


function redoFilter() {
  table.clearFilter();
  if (countySel.value) {
    table.addFilter("county", "=", countySel.value);
  }
  if (locationTypeSel.value) {
    table.addFilter("location_type", "=", locationTypeSel.value);
  }
  if (countySel.value || locationTypeSel.value) {
    drawChart();
  }
}

function populateSelect(selectElement, stringList) {
  _.each(stringList, function(theString) {
    var option = document.createElement("option");
    option.value = theString;
    option.text = theString;
    selectElement.add(option);
  });
}

function parseGroupedRow(row) {
  return {
    date: row[0],
    state: row[1],
    county: row[2],
    location_type: row[3],
    visit_index: row[4],
    visit_index_over65: row[5],
    visit_index_under65: row[6],
    rank: parseInt(row[7]),
    datenum: datenum(row[0])
  };
}

function parseRawRow(row) {
  return {
    date: row[0],
    state: row[1],
    county: row[2],
    location_type: row[4],
    visit_index: row[5],
    visit_index_over65: row[6],
    visit_index_under65: row[7],
    rank: parseInt(row[8]),
    datenum: datenum(row[0])
  };
}

function parseRow(row) {
  // WARNING hack
  if (datafilename.includes('raw')) {
    return parseRawRow(row);
  }
  return parseGroupedRow(row);
}


function parsingDone(results, file) {

  fileData = _.map(results.data.slice(1), function (row) {
    var parsed = parseRow(row);
    counties.push(parsed.county);
    locationTypes.push(parsed.location_type);
    return parsed;
  });

  counties = _.uniq(counties).sort();
  locationTypes = _.uniq(locationTypes).sort();

  table = new Tabulator("#data-table", {
    data:fileData,
    columns:[
      {title:"Location Type", field:"location_type"},
      {title:"% of Usual Visits", field:"visit_index", visible: true},
      {title:"% of Usual Visits", field:"visit_index_over65", visible: false},
      {title:"% of Usual Visits", field:"visit_index_under65", visible: false},
      {title:"County", field:"county"},
      {title:"Date", field:"date"},
    ],
    height:"600px",
    layout:"fitColumns",
    initialSort:[
      {column:"date", dir:"asc"},
      {column:"county", dir:"asc"},
    ],
  });

  countySel = document.getElementById('county-select');
  populateSelect(countySel, counties);

  locationTypeSel = document.getElementById('location-type-select');
  populateSelect(locationTypeSel, locationTypes);

  _.each([countySel, locationTypeSel], function(sel) { sel.addEventListener('change', redoFilter); });

  ageGroupSel = document.getElementById('agegroup-select');
  ageGroupSel.addEventListener('change', function(event) {
    // hide all 3
    table.hideColumn("visit_index");
    table.hideColumn("visit_index_over65");
    table.hideColumn("visit_index_under65");
    switch (ageGroupSel.value) {
    case "all":
      table.showColumn("visit_index");
      break;
    case "under65":
      table.showColumn("visit_index_under65");
      break;
    case "over65":
      table.showColumn("visit_index_over65");
      break;
    }

    if (countySel.value || locationTypeSel.value) {
      drawChart();
    }
  });
}

if (!datafilename) {
  datafilename = 'data/grouped.csv';
} else {
  datafilename = 'data/' + datafilename + '.csv';
}

Papa.parse(datafilename, {download: true, complete: parsingDone});
