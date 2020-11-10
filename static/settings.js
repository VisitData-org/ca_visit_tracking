function getCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
};

function setupSettingsModal(settingsModalId) {

    $(settingsModalId).on('show.bs.modal', function (event) {
        // pull the settings from the cookie
        const modal = $(this);

        const numberOfCategoriesToPlotCookie = getCookie('numberOfCategoriesToPlot');
        const numberOfCategoriesToPlotInput = $('#numberOfCategoriesToPlot');
        numberOfCategoriesToPlotInput.val(numberOfCategoriesToPlotCookie);

        const chartHeightCookie = getCookie('chartHeight');
        const chartHeightInput = $('#chartHeight');
        chartHeightInput.val(chartHeightCookie);

        const plotValueTypeCookie = getCookie('plotValueType');
        const plotValueTypeInput = $('#plotValueType');
        plotValueTypeInput.val(plotValueTypeCookie);
    });

    $(settingsModalId).on('hide.bs.modal', function (event) {
        // write the settings to the cookie
        const modal = $(this);
        const expiry = new Date((new Date()).getTime() + 365 * 24 * 3600 * 1000);

        const numberOfCategoriesToPlot = $('#numberOfCategoriesToPlot').val();
        document.cookie = "numberOfCategoriesToPlot=" + numberOfCategoriesToPlot + "; expires=" + expiry.toUTCString() + "; path=/";

        const chartHeight = $('#chartHeight').val();
        document.cookie = "chartHeight=" + chartHeight + "; expires=" + expiry.toUTCString() + "; path=/";

        const plotValueType = $('#plotValueType').val();
        document.cookie = "plotValueType=" + plotValueType + "; expires=" + expiry.toUTCString() + "; path=/";

        location.reload();
    });

};