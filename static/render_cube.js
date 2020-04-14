function getFileToParse() {
  // {rollup|percentile}{WeekAgo|VsMarchFirstWeek}
  return _fourSquareDataUrl + "/" + "percentileWeekAgo.csv"
}

function renderCube() {

  Papa.parse(getFileToParse(), {
    download: true,
    header: true,
    complete: function (results, file) {

      var dataTable = new Tabulator("#data-table", {
        data: results.data,
        columns: [
          { title: "Date", field: "date"},
          { title: "Country", field: "country"},
          { title: "State", field: "state"},
          { title: "County", field: "county"},
          { title: "Zip", field: "zip"},
          { title: "Category Id", field: "categoryid"},
          { title: "Category Name", field: "categoryname"},
          { title: "Hour", field: "hour"},
          { title: "25th %-ile Duration", field: "p25Duration" },
          { title: "50th %-ile Duration", field: "p50Duration" },
          { title: "75th %-ile Duration", field: "p75Duration" },
          { title: "90th %-ile Duration", field: "p90Duration" },
          { title: "99th %-ile Duration", field: "p99Duration" },
          { title: "Prev 25th %-ile Duration", field: "prevP25Duration" },
          { title: "Prev 50th %-ile Duration", field: "prevP50Duration" },
          { title: "Prev 75th %-ile Duration", field: "prevP75Duration" },
          { title: "Prev 90th %-ile Duration", field: "prevP90Duration" },
          { title: "Prev 99th %-ile Duration", field: "prevP99Duration" },
        ],
        // height: "600px",
        layout: "fitColumns",
      });
    }
  }
  );

}