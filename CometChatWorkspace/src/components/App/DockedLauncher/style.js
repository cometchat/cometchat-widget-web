import { validateWidgetSettings } from "../../../util";

export const launcherWrapperStyle = (props, keyframes) => {

    const alignmentStyle = (props.hasOwnProperty("alignment") && props.alignment === "left") ? {
        left: "20px",
        right: "unset",
    } : {};

    let backgroundProp = {
        background: "#03a9f4",
    };

    if (validateWidgetSettings(props.settings, "style", "docked_layout_icon_background")) {

        const customColor = props.settings.style["docked_layout_icon_background"];
        backgroundProp = {
            background: customColor,
        }
    }

    const launcherAnimation = keyframes`
    from {
        opacity: 0;
        transform: scale(0.5);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }`;


    return {
        zIndex: "2147483000",
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        boxShadow: "rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px",
        borderRadius: "50%",
        cursor: "pointer",
        boxShadow: "0 1px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 32px 0 rgba(0, 0, 0, 0.16)",
        animation: `${launcherAnimation} 250ms ease`,
        ...alignmentStyle,
        ...backgroundProp,
    }
}

export const launcherFrameStyle = () => {

    return {
        maxHeight: "none",
        maxWidth: "none",
        minHeight: "0px",
        minWidth: "0px",
        boxSizing: "border-box",
        border: "none",
        width: "100%",
        height: "100%",
    }
}

export const launcherStyle = (props) => {

    let backgroundProp = {
        background: "#03a9f4",
    };

    if (validateWidgetSettings(props.settings, "style", "docked_layout_icon_background")) {

        const customColor = props.settings.style["docked_layout_icon_background"];
        backgroundProp = {
            background: customColor,
        }
    }

    return {
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "60px",
        height: "60px",
        cursor: "pointer",
        transformOrigin: "center center 0px",
        borderRadius: "50%",
        overflow: "hidden",
        opacity: "1",
        ...backgroundProp
    }
}

export const launcherContainerStyle = () => {

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "img": {
            outline: "none",
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            transition: "transform 0.16s linear, opacity 0.08s linear",
            objectFit: "contain"
        }
    }
}

export const openLauncherIconStyle = (state) => {

    const openIconState = (state.active === false) ? { 
        opacity: "1",
        transform: "rotate(0deg) scale(1)",
    } : {
        opacity: "0",
        transform: "rotate(30deg) scale(0)",
    };

    return {
        ...openIconState
    }
}

export const closeLauncherIconStyle = (state) => {

    const closeIconState = (state.active === true) ? { 
        opacity: "1",
        transform: "rotate(0deg)", 
    } : { 
        opacity: "0",
        transform: "rotate(-60deg)",
    };

    return {
        ...closeIconState
    }
}

export const notificationIconWrapperStyle = () => {

    return {
        position: "relative",
        zIndex: "2"
    }
}

export const notificationIconStyle = (props) => {

    return {
        backgroundColor: "#FF5757",
        borderRadius: "50%",
        textAlign: "center",
        color: "#FFFFFF",
        position: "absolute",
        top: "-8px",
        right: "-6px",
        display: "block",
        minWidth: "18px",
        minHeight: "18px",
        lineHeight: "18px",
        padding: "2px",
        fontSize: "13px",
        fontWeight: "bold",
        fontFamily: `${props.theme.fontFamily}`,
    }
}
