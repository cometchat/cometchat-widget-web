export const AppStyle = (props) => {

    let alignmentStyle = {};
    if (props.docked && (props.docked === true || props.docked === "true")) {

        if (props.hasOwnProperty("alignment") && props.alignment === "right") {

            alignmentStyle = {
                bottom: "390px",
                right: "40px",
                left: "unset"
            }

        } else if (props.hasOwnProperty("alignment") && props.alignment === "left") {

            alignmentStyle = {
                bottom: "390px",
                left: "40px",
                right: "unset"
            }
        }

    } else {

        alignmentStyle = {
            position: "absolute",
            top: "12px",
            right: "12px",
        }
    }

    return {
        position: "relative",
        boxSizing: "border-box",
        fontFamily: `${props.theme.fontFamily}`,
        fontSize: "14px",
        width: "inherit",
        height: "inherit",
        ".toast__notification": {
            zIndex: "2147483001",
            position: "fixed",
            top: "unset",
            ...alignmentStyle
        }
    }
}
