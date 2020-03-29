
var table;
var countySel;
var ageGroupSel;
var locationTypeSel;
var counties = [];
var locationTypes = [];
var dateToShow;
var selectedCounties;
var selectedVenues;

function findDateToShow(parsedRows) {
  var allDatesSorted = _.uniq(_.pluck(parsedRows, 'date')).sort();
  allDatesSorted.pop(); // the last day is incomplete unfortunately. up to 5pm Pacific time,
  // and so the data is no good.
  return allDatesSorted.pop(); // this is the date we have complete data for
}

function redoFilter() {
  table.clearFilter();
  if (countySel.value) {
    table.addFilter("county", "=", countySel.value);    
  }
  if (locationTypeSel.value) {
    table.addFilter("location_type", "=", locationTypeSel.value);    
  }
}

function populateSelect(selectElement, stringList, selected) {
  _.each(stringList, function(theString) {
    var option = document.createElement("option");
    option.value = theString;
    option.text = theString;
    if (_.contains(selected, option.text)) {
      option.selected = true;
    }
    selectElement.add(option);
  });
}

function cleanLocType(string) {
  if (string == "Cafￃﾩs") {
    return "Cafes";
  }
  return string;
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
    rank: row[7]
  };
}

function parsingDone(results, file) {

  var parsed = _.map(results.data.slice(1), parseGroupedRow);
  dateToShow = findDateToShow(parsed);
  document.getElementById('table-title').appendChild(document.createTextNode("Visit data for " + dateToShow));
  var oneDateOnly = _.where(parsed, { date: dateToShow });
  _.each(oneDateOnly, function (parsedRow) {
    counties.push(parsedRow.county);
    locationTypes.push(parsedRow.location_type);
  });

  counties = _.uniq(counties).sort();
  locationTypes = _.uniq(locationTypes).sort();

  table = new Tabulator("#data-table", {
    data:oneDateOnly,
    columns:[
      {title:"Location Type", field:"location_type"},
      {title:"% of Usual Visits", field:"visit_index", visible: true},
      {title:"% of Usual Visits", field:"visit_index_over65", visible: false},
      {title:"% of Usual Visits", field:"visit_index_under65", visible: false},
      {title:"County", field:"county"},
    ],
    height:"600px",
    layout:"fitColumns",
    initialSort:[
      {column:"visit_index", dir:"desc"}
    ],
  });

  countySel = document.getElementById('county-select');
  populateSelect(countySel, counties, selectedCounties);

  locationTypeSel = document.getElementById('location-type-select');
  populateSelect(locationTypeSel, locationTypes, selectedVenues);

  redoFilter();

  countySel.addEventListener('change', function() {
    window.location = "/counties/" + countySel.value;
  });

  locationTypeSel.addEventListener('change', function() {
    window.location = "/venues/" + locationTypeSel.value;
  });

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
  });
}

function parseSelection() {
  selectedCounties = _selectedCounties.split(',');
  selectedVenues = _selectedVenues.split(',');
}

parseSelection();
Papa.parse('/data/grouped.csv', {download: true, complete: parsingDone});
