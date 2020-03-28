
var table;
var countySel;
var ageGroupSel;
var locationTypeSel;
var counties = [];
var locationTypes = [];

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
//      {title:"State", field:"state"},
    ],
    height:"600px",
    layout:"fitColumns",
    initialSort:[
      {column:"visit_index", dir:"desc"}
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
Papa.parse('catgroups_0321.csv', {download: true, complete: parsingDone});
