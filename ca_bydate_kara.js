
var table;
var countySel;
var ageGroupSel;
var locationTypeSel;
var counties = [];
var locationTypes = [];

function fileDataToHighcharts(fileDataToPlot) {
  return _.map(fileDataToPlot, function(fileDataRow) {
    var date = fileDataRow.date;
    var year = date.slice(0, 4);
    var month = date.slice(5, 7);
    var day = date.slice(8, 10);
    return [Date.UTC(year, month-1, day), parseInt(fileDataRow.visit_index)];
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
    var results = _.map(locationTypes, function(locationType) {
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
  Highcharts.chart('container', {
    chart: {
      animation: false
    },
    title: {   text: '% of Usual Visits, by Date'  },
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
//  if (ageGroupSel.value) {
//    table.addFilter("agegroup", "=", ageGroupSel.value);
//  }

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

function parsingDone(results, file) {
//  console.log("Parsing complete:", results, file);
  fileData = _.map(results.data.slice(1), function (row) {
    var county = row[1];
    var location_type = cleanLocType(row[2]);
    var date = row[0];
    counties.push(county);
    locationTypes.push(location_type);
    return {location_type: location_type,
            visit_index: row[3],
            date: date,
//            agegroup: row[2],
//            state: row[3],
            county: county
           };
  });

  counties = _.uniq(counties).sort();
  locationTypes = _.uniq(locationTypes).sort();

  table = new Tabulator("#example-table", {
    data:fileData,
    columns:[
      {title:"Location Type", field:"location_type"},
      {title:"% of Usual Visits", field:"visit_index"},
//      {title:"Age Group", field:"agegroup"},
      {title:"County", field:"county"},
      {title:"Date", field:"date"},
//      {title:"State", field:"state"},
    ],
    height:"600px",
    layout:"fitColumns",
    initialSort:[
      {column:"date", dir:"asc"},
      {column:"county", dir:"asc"},
    ],
//    pagination: "local",
  });

  countySel = document.getElementById('county-select');
  populateSelect(countySel, counties);

  locationTypeSel = document.getElementById('location-type-select');
  populateSelect(locationTypeSel, locationTypes);

  // ageGroupSel = document.getElementById('agegroup-select');
  // option1 = document.createElement("option");
  // option1.value = "Over 65";
  // option1.text = "Over 65";
  // ageGroupSel.add(option1);
  // option1 = document.createElement("option");
  // option1.value = "Under 65";
  // option1.text = "Under 65";
  // ageGroupSel.add(option1);

  _.each([countySel, locationTypeSel], function(sel) { sel.addEventListener('change', redoFilter); });
}

// WARNING when using rawcats files, gotta get rid of column 3 you dont need it
Papa.parse('catgroups.csv', {download: true, complete: parsingDone});
