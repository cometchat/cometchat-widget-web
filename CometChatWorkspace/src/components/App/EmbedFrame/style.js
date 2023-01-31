import { getResponsiveData, minHeight, minWidth } from "../utils";

export const embedWrapperStyle = (props) => {

    const responsiveData = getResponsiveData()

    let roundedCornerStyle = {};
    if (props.hasOwnProperty("roundedCorners") && (props.roundedCorners === true || props.roundedCorners === "true")) {
        roundedCornerStyle = {
            borderRadius: "20px"
        }
    }

    let alignmentStyle = {};
    if (props.hasOwnProperty("alignment") && props.alignment === "left") {
        alignmentStyle = {
            left: `${responsiveData.dockedHorizontalPadding}px`,
            right: "unset",
        }
    }

    let dockedStyle = {};
    if (props.docked && (props.docked === true || props.docked === "true")) {
        dockedStyle = {
            position: "fixed",
            bottom: `${responsiveData.dockedIconHeight + (responsiveData.dockedBottomPadding * 2)}px`,
            right: `${responsiveData.dockedHorizontalPadding}px`,
            zIndex: "2147483000",
            boxShadow: "rgba(0, 0, 0, 0.11) 0px 5px 40px",
        }
    }

    const launchedStyle = (props.launched) ? { opacity: "1" } : { opacity: "0", display: "none" };

    return {
        opacity: "0",
        overflow: "hidden",
        boxSizing: "border-box",
        border: "2px solid #eaeaea",
        opacity: ".2s linear",
        position: "relative",
        ...launchedStyle,
        ...roundedCornerStyle,
        ...alignmentStyle,
        ...dockedStyle
    }
}