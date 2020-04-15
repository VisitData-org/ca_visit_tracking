function getDataLocation() {
  // return _fourSquareDataUrl;
  return "localdata";
}

function getRollupFile(whichPercentile) {
  // {rollup|percentile}{WeekAgo|VsMarchFirstWeek}
  return getDataLocation() + "/" + "rollup" + whichPercentile + ".csv"
}

function filterTableData(rawDataFromFile) {
  var filterProperties = {};
  tableFilters.forEach(function (value, field, map) {
    if (value != 'UNFILTERED') {
      filterProperties[field] = value;
    }
  })
  return _.where(rawDataFromFile, filterProperties);
}

function redoUIFilter() {
  if (dataTable) {
    dataTable.clearFilter();
    tableFilters.forEach(function (value, key, map) {
      if (value != 'UNFILTERED') {
        dataTable.addFilter(key, '=', value);
      }
    });
  }
}

function drawChart() {
  var seriesForPlot = seriesToPlot(stateOrCounty);
  if (isPlotDataEmpty(seriesForPlot)) {
    // handle empty plot
    var emptyDataNotice = document.createElement("h2")
    emptyDataNotice.innerText = 'No matching data to chart';
    emptyDataNotice.style.textAlign = 'center';
    document.getElementById('chartcontainer').appendChild(emptyDataNotice);
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
      }
}

var tableFilters = new Map();

var keyColumnValues = new Map();

function buildKeySelectionDiv() {
  var keySelectionDiv = document.getElementById("key-selection");
  keySelectionDiv.innerHTML = '';
  var filterSelects = [];
  _.each(
    _.where(rollupDataColumns, { "isKey": true }), function (column) {
      // make a new select and add it to the div
      var select = document.createElement("select");
      var selectHeading = document.createElement("option");
      selectHeading.text = column.title;
      selectHeading.value = 'UNFILTERED';
      select.appendChild(selectHeading);
      // let's check the options that are available for this key
      var columnValues = keyColumnValues.get(column.field);
      if (_.isUndefined(columnValues)) {
        columnValues = _.uniq(
          _.reject(
            _.pluck(parsedData, column.field),
            function (columnValue) { return (_.isUndefined(columnValue) || columnValue == '') }
          )
        ).sort();
        keyColumnValues.set(column.field, columnValues);
      }
      _.each(columnValues, function (columnValue) {
        var option = document.createElement("option");
        option.text = columnValue;
        option.value = columnValue;
        select.appendChild(option);
      });

      if (tableFilters.has(column.field)) {
        select.value = tableFilters.get(column.field);
      }

      select.addEventListener('change', function () {
        tableFilters.delete(column.field);
        tableFilters.set(column.field, select.value);
        if (column.filterData) {
          renderDataTable();
        } else {
          redoUIFilter();
        }
      })
      keySelectionDiv.appendChild(select);
      filterSelects.push(select);

    });
  var clearFilterButton = document.createElement("button");
  clearFilterButton.innerText = 'Clear Filters';
  clearFilterButton.addEventListener('click', function () {
    tableFilters.clear();
    _.each(filterSelects, function (select) { select.value = 'UNFILTERED' });
    renderDataTable();
  });
  keySelectionDiv.appendChild(clearFilterButton);
}

var rollupDataColumns = [
  { title: "Date", field: "date", isKey: true, filterData: true },
  { title: "Country", field: "country", isKey: true, drop: true },
  { title: "State", field: "state", isKey: true, filterData: true },
  { title: "County", field: "county", isKey: true, filterData: true },
  { title: "Zip", field: "zip", isKey: true, filterData: true },
  { title: "Category Id", field: "categoryid", drop: true },
  { title: "Category Name", field: "categoryname", isKey: true },
  { title: "Demo", field: "demo", isKey: true },
  { title: "Hour", field: "hour", isKey: true },
  { title: "# Visits", field: "visits", visible: true, isKey: false },
  { title: "Visit Index", field: "visitIndex", visible: true, isKey: false },
  { title: "Duration 0 to 10", field: "durationUnder10Mins", visible: false, isKey: false },
  { title: "Duration 10 to 20", field: "duration10To20Mins", visible: false, isKey: false },
  { title: "Duration 20 to 30", field: "duration20To30Mins", visible: false, isKey: false },
  { title: "Duration 30 to 60", field: "duration30To60Mins", visible: false, isKey: false },
  { title: "Duration 60 to 120", field: "duration1To2Hours", visible: false, isKey: false },
  { title: "Duration 120 to 240", field: "duration2To4Hours", visible: false, isKey: false },
  { title: "Duration 240 to 480", field: "duration4To8Hours", visible: false, isKey: false },
  { title: "Duration 480+", field: "durationOver8Hours", visible: false, isKey: false },
  { title: "Duraiton 0 to 10 Index", field: "durationUnder10MinsIndex", visible: false, isKey: false },
  { title: "Duration 10 to 20 Index", field: "duration10To20MinsIndex", visible: false, isKey: false },
  { title: "Duration 20 to 30 Index", field: "duration20To30MinsIndex", visible: false, isKey: false },
  { title: "Duration 30 to 60 Index", field: "duration30To60MinsIndex", visible: false, isKey: false },
  { title: "Duration 60 to 120 Index", field: "duration1To2HoursIndex", visible: false, isKey: false },
  { title: "Duration 120 to 240 Index", field: "duration2To4HoursIndex", visible: false, isKey: false },
  { title: "Duration 240 to 480 Index", field: "duration4To8HoursIndex", visible: false, isKey: false },
  { title: "Duration 480+ Index", field: "durationOver8HoursIndex", visible: false, isKey: false },
];

function getTabulatorRollupColumns() {
  var tabulatorColumns = _.map(
    _.reject(rollupDataColumns, { "drop": true }),
    function (column) {
      return {
        title: column.title,
        field: column.field,
        visible: (_.isUndefined(column.visible) ? true : column.visible)
      }
    });
  return tabulatorColumns;
}

var dataTable;

function renderDataTable() {
  console.log("rendering data table");
  var tableData = filterTableData(parsedData);
  if (tableData.length > 10000) {
    document.getElementById("data-table").innerHTML = "<p>Table too big, filter some values - " + tableData.length + "</p>"
  } else {
    dataTable = new Tabulator("#data-table", {
      data: tableData,
      pagination: "local",
      paginationSize: 10,
      layout: "fitColumns",
      height: "600px",
      columns: getTabulatorRollupColumns(),
    });
  }
  buildKeySelectionDiv();
  redoUIFilter();
}

function buildColumnSelectionDiv() {
  console.log("building column selectors");
  var columnSelectionDiv = document.getElementById("column-selection");
  _.each(
    _.where(rollupDataColumns, { "isKey": false }), function (column) {
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = column.field;
      checkbox.checked = column.visible;
      var label = document.createElement("label");
      label.innerText = column.title;
      checkbox.addEventListener("change", function () {
        var tableColumn = _.findWhere(rollupDataColumns, { field: column.field });
        tableColumn.visible = checkbox.checked;
        renderDataTable();
      })
      columnSelectionDiv.appendChild(checkbox);
      columnSelectionDiv.appendChild(label);
    }
  );
}

var parsedData;

function renderRollupCube() {

  buildColumnSelectionDiv();

  console.log("running render rollup cube");

  Papa.parse(getRollupFile("WeekAgo"), {
    download: true,
    header: true,
    complete: function (results, file) {

      parsedData = results.data;

      var tableData = filterTableData(parsedData);
      if (tableData.length > 10000) {
        document.getElementById("data-table").innerHTML = "<p>Table too big, filter some values - " + tableData.length + "</p>"
      } else {
        renderDataTable(tableData);
      }
      buildKeySelectionDiv();

    }
  }
  );

}