export const minWidth = "100%";
export const minHeight = "100%";
export const smallScreenWidth = 450;

export const getResponsiveData = () => {
    let data = {
        dockedIconWidth: 60,
        dockedIconHeight: 60,
        dockedBottomPadding: 20,
        dockedHorizontalPadding: 20,
        dockedIconHorizontalPadding: 20,
    }
    
    const availWidth = window.innerWidth;
    if(availWidth <= smallScreenWidth) {
        data.dockedIconWidth = 40;
        data.dockedIconHeight = 40;
        data.dockedBottomPadding = 5;
        data.dockedHorizontalPadding = 0;
        data.dockedIconHorizontalPadding = 5;
    }

    return data;
}

export const getCallingPopUpOrigin = (width) => {
    const availWidth = window.innerWidth;
    if(availWidth <= smallScreenWidth) {
        /**Small screens */
        return availWidth
    } else {
        return width
    }
}