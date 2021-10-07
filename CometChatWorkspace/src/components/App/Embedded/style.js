export const embedWrapperStyle = (props) => {

  let roundedCornerStyle = {};
  if (props.hasOwnProperty("roundedCorners") && (props.roundedCorners === true || props.roundedCorners === "true")) {
    roundedCornerStyle = {
      borderRadius: "20px"
    }
  }

  let alignmentStyle = {};
  if (props.hasOwnProperty("alignment") && props.alignment === "left") {
    alignmentStyle = {
      left: "20px",
      right: "unset",
    }
  }

  let dockedStyle = {};
  if (props.docked && (props.docked === true || props.docked === "true")) {
    dockedStyle = {
      position: "fixed",
      bottom: "100px",
      right: "20px",
      boxShadow: "rgba(0, 0, 0, 0.11) 0px 5px 40px",
    }
  }

  const launchedStyle = (props.launched) ? { opacity: "1" } : { opacity: "0", display: "none" };

  return {
    opacity: "0",
    overflow: "hidden",
    minWidth: "350px",
    minHeight: "450px",
    boxSizing: "border-box",
    border: "2px solid #eaeaea",
    opacity: ".2s linear",
    position: "relative",
    zIndex: "2147483000",
    ...launchedStyle,
    ...roundedCornerStyle,
    ...alignmentStyle,
    ...dockedStyle,
  }
}

export const embedFrameStyle = () => {

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

export const embedContentWrapperStyle = (sidebar, props, keyframes) => {

  let pos = {};
  let borderColor = props.theme.borderColor.primary;
  
  if (props.docked && (props.docked === true || props.docked === "true")) {
    pos = { position: "fixed" };
    borderColor = props.theme.borderColor.white;
  }

  const show = keyframes`
    0% {
      display: none;
      opacity: 0;
    }
    1% {
      display: flex;
      opacity: 0;
    }
    100% {
      display: flex;
      opacity: 1;
    }`;

  return {
    display: "flex",
    flexDirection: "row",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    animation: `${show} 500ms linear`,
    ...pos
  }
}

export const embedSidebarStyle = (props, state) => {

  const sidebarView = (state.sidebarview) ? {
    left: "0"
  } : {};

  const mq = [...props.theme.breakPoints];
  
  return {
		width: "280px",
		borderRight: "1px solid #eaeaea",
		height: "100%",
		position: "relative",
		display: "flex",
		flexDirection: "column",
		"> .contacts, .chats, .groups": {
			height: "calc(100% - 64px)",
		},
		[`@media ${mq[1]}, ${mq[2]}`]: {
			position: "absolute!important",
			left: "-100%",
			top: "0",
			bottom: "0",
			width: "100%!important",
			zIndex: "2",
			backgroundColor: `${props.theme.backgroundColor.white}`,
			transition: "all .3s ease-out",
			...sidebarView,
		},
	};
}

export const embedMainStyle = (sidebar, state, props) => {

  const mq = [...props.theme.breakPoints];

  let widthProp = null;

  if (sidebar === null) {
    
    widthProp = {
      width: "100%"
    }

  } else {

    widthProp = {

      width: "calc(100% - 280px)",
      [`@media ${mq[1]}, ${mq[2]}`]: {
        width: "100%!important",
      },
    }
  }

  return {
    height: "100%",
    order: "2",
    display: "flex",
    flexDirection: "row",
    ...widthProp,
  }
}

export const embedLoadingStyle = () => {

  return {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
    fontSize: "14px"
  };
}
