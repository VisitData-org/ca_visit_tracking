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
    return undefined;
};

function setupSettingsModal(settingsModalId) {

    $(settingsModalId).on('show.bs.modal', function (event) {
        // pull the settings from the cookie
        const modal = $(this);

        const numberOfCategoriesToPlotCookie = getCookie('numberOfCategoriesToPlot');
        if (numberOfCategoriesToPlotCookie) {
            const numberOfCategoriesToPlotInput = $('#numberOfCategoriesToPlot');
            numberOfCategoriesToPlotInput.val(numberOfCategoriesToPlotCookie);
        }

        const chartHeightCookie = getCookie('chartHeight');
        if (chartHeightCookie) {
            const chartHeightInput = $('#chartHeight');
            chartHeightInput.val(chartHeightCookie);
        }

        const plotValueTypeCookie = getCookie('plotValueType');
        if (plotValueTypeCookie) {
            const plotValueTypeInput = $('#plotValueType');
            plotValueTypeInput.val(plotValueTypeCookie);
        }
    });

    $(settingsModalId).on('hide.bs.modal', function (event) {
        // write the settings to the cookie
        const modal = $(this);
        const expiry = new Date((new Date()).getTime() + 365 * 24 * 3600 * 1000);

        const numberOfCategoriesToPlot = $('#numberOfCategoriesToPlot').val();
        if (numberOfCategoriesToPlot && numberOfCategoriesToPlot.trim().length > 0) {
            document.cookie = "numberOfCategoriesToPlot=" + numberOfCategoriesToPlot + "; expires=" + expiry.toUTCString() + "; path=/";
        }

        const chartHeight = $('#chartHeight').val();
        if (chartHeight && chartHeight.trim().length > 0) {
            document.cookie = "chartHeight=" + chartHeight + "; expires=" + expiry.toUTCString() + "; path=/";
        }

        const plotValueType = $('#plotValueType').val();
        if (plotValueType && plotValueType.trim().length > 0) {
            document.cookie = "plotValueType=" + plotValueType + "; expires=" + expiry.toUTCString() + "; path=/";
        }

        location.reload();
    });

};