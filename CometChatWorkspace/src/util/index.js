export const validateWidgetSettings = (wSettings, section, checkAgainst) => {

    let output = null;

    if (wSettings && wSettings.hasOwnProperty(section)) {

        if (wSettings[section].hasOwnProperty(checkAgainst)) {
            output = wSettings[section][checkAgainst];
        } else {
            output = false;
        }
    }

    return output;
}