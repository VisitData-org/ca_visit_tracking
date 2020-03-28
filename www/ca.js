
var table;
var countySel;
var ageGroupSel;
var locationTypeSel;
var counties = [];
var locationTypes = [];
var dateToShow = '2020-03-23';

function redoFilter() {
  table.clearFilter();
  if (countySel.value) {
    table.addFilter("county", "=", countySel.value);
  }
  if (locationTypeSel.value) {
    table.addFilter("location_type", "=", locationTypeSel.value);
  }
  if (ageGroupSel.value) {
    table.addFilter("agegroup", "=", ageGroupSel.value);
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

  var parsed = _.map(results.data, parseGroupedRow);
  var latestDateOnly = _.where(parsed, { date: dateToShow });
  _.each(latestDateOnly, function (parsedRow) {
    counties.push(parsedRow.county);
    locationTypes.push(parsedRow.location_type);
  });

  counties = _.uniq(counties).sort();
  locationTypes = _.uniq(locationTypes).sort();

  table = new Tabulator("#data-table", {
    data:latestDateOnly,
    columns:[
      {title:"Location Type", field:"location_type"},
      {title:"% of Usual Visits", field:"visit_index"},
//      {title:"% Usual, Over 65", field:"visit_index_over65"},
//      {title:"% Usual, Under 65", field:"visit_index_under65"},
      {title:"County", field:"county"},
    ],
    height:"600px",
    layout:"fitColumns",
    initialSort:[
      {column:"visit_index", dir:"desc"}
    ],
  });

  countySel = document.getElementById('county-select');
  populateSelect(countySel, counties);

  locationTypeSel = document.getElementById('location-type-select');
  populateSelect(locationTypeSel, locationTypes);

  _.each([countySel, locationTypeSel], function(sel) { sel.addEventListener('change', redoFilter); });
}

Papa.parse('data/grouped.csv', {download: true, complete: parsingDone});
