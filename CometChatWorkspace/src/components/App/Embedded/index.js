import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
/** @jsx jsx */
import { jsx, keyframes, Global } from "@emotion/core";
import Frame from "react-frame-component";
import { CometChat } from "@cometchat-pro/chat";

const CometChatMessages = asyncComponent("CometChatMessages", () => {
	return import("UIKit/CometChatWorkspace/src/components/Messages/CometChatMessages/index.js");
});

const CometChatNavBar = asyncComponent("CometChatNavBar", () => {
	return import("UIKit/CometChatWorkspace/src/components/CometChatUI/CometChatNavBar/index.js");
});

import { CometChatContext } from "UIKit/CometChatWorkspace/src/util/CometChatContext";
import * as enums from "UIKit/CometChatWorkspace/src/util/enums.js";

import Translator from "UIKit/CometChatWorkspace/src/resources/localization/translator";

import asyncComponent from "../../../hoc/asyncComponent";
import { FrameProvider } from "../../../hoc/FrameProvider";

import { theme } from "UIKit/CometChatWorkspace/src/resources/theme";

import { embedGlobalStyles } from "./globalStyle";

import { embedWrapperStyle, embedFrameStyle, embedContentWrapperStyle, embedSidebarStyle, embedMainStyle, embedLoadingStyle } from "./style";

export class Embedded extends React.PureComponent {
	parentNode = null;
	static contextType = CometChatContext;

	constructor(props) {
		super(props);

		this.embedFrame = React.createRef();

		this.state = {
			tab: "",
			type: props.type,
			item: props.user,
			width: "400px",
			height: "450px",
			launched: null,
			sidebarview: false,
			parentNode: null,
			customJS: "",
		};

		CometChat.getLoggedinUser()
			.then(user => (this.loggedInUser = user))
			.catch(error => {
				const errorCode = error && error.hasOwnProperty("code") ? error.code : "USER_NOT_LOGGED_IN";
				throw new Error(errorCode);
			});
	}

	componentDidMount() {
		this.applyStyle();
		
		setTimeout(() => {
			this.applyCustomJS();
		}, 1000)

		const parentNode = ReactDOM.findDOMNode(this).parentNode;
		this.setState({ parentNode: parentNode });

		/**
		 * set iframe's window
		 */
		const chatWindow = ReactDOM.findDOMNode(this).parentNode.querySelector("iframe").contentWindow;
		this.context.UIKitSettings.setChatWindow(chatWindow);

		if (Object.keys(this.context.item).length == 0) {
			this.toggleLeftPanel();
		}

		this.item = this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP || CometChat.ACTION_TYPE.TYPE_USER ? this.context.item : {};
	}

	componentDidUpdate(prevProps, prevState) {


		const previousItem = JSON.stringify(this.item);
		const currentItem = JSON.stringify(this.context.item);

		if (previousItem !== currentItem) {
			//bugfix menu open chatwith bugfix
			if (Object.keys(this.context.item).length) {
				this.setState({ sidebarview: false });
			} else {
				this.setState({ sidebarview: true });
			}
		}
		
		this.item = this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP || CometChat.ACTION_TYPE.TYPE_USER ? this.context.item : {};
	}

	applyStyle = () => {
		const styles = [];
		if (this.props.height) {
			styles.push(`height:${this.props.height};`);
		}

		if (this.props.width) {
			styles.push(`width:${this.props.width};`);
		}

		this.embedFrame.setAttribute("style", styles.join(""));
	};

	getCustomJS = () => {
		
		let customJS = "";
		if (this.context.UIKitSettings.customJS.trim().length) {
			customJS = this.context.UIKitSettings.customJS;
		}

		return customJS;
	};

	applyCustomJS = () => {

		const iframeEl = this.embedFrame.querySelector("iframe");

		if(iframeEl) {

			const iframeDocument = iframeEl.contentWindow ? iframeEl.contentWindow.document : iframeEl.contentDocument;
			if (iframeEl.contentWindow) {
				iframeEl.contentWindow.CometChat = CometChat;
			}

			const customJS = this.getCustomJS();
			const scriptId = "custom_js";
			let scriptElement = iframeDocument.getElementById(scriptId);
			if (!scriptElement) {

				scriptElement = iframeDocument.createElement("script");
				scriptElement.setAttribute("type", "text/javascript");
				scriptElement.setAttribute("id", scriptId);
				scriptElement.innerHTML = customJS;
				iframeDocument.head.appendChild(scriptElement);
			}
		}
	}; 

	itemClickHandler = (item, type) => {
		this.toggleLeftPanel();
		this.context.setTypeAndItem(type, item);
	};

	actionHandler = (action, item, count, ...otherProps) => {
		switch (action) {
			case enums.ACTIONS["TOGGLE_SIDEBAR"]:
				this.toggleLeftPanel();
				break;
			case enums.ACTIONS["ITEM_CLICKED"]:
				this.itemClickHandler(count, item);
				break;
			case enums.GROUP_MEMBER_SCOPE_CHANGED:
			case enums.GROUP_MEMBER_KICKED:
			case enums.GROUP_MEMBER_BANNED:
				this.groupUpdated(action, item, count, ...otherProps);
				break;
			case "messageRead":
				{
					this.props.actionGenerated(action, item);
				}
				break;
			case enums.ACTIONS["START_AUDIO_CALL"]:
			case enums.ACTIONS["START_VIDEO_CALL"]:
			case enums.ACTIONS["START_DIRECT_CALL"]:
			case enums.ACTIONS["JOIN_DIRECT_CALL"]:
				this.props.actionGenerated(action, item);
				break;
			case enums.ACTIONS["CALL_ACCEPTED"]:
			case enums.ACTIONS["CALL_REJECTED"]:
			case enums.ACTIONS["USER_JOINED_CALL"]:
			case enums.ACTIONS["USER_LEFT_CALL"]:
			case enums.ACTIONS["CALL_ENDED"]:
			case enums.ACTIONS["DIRECT_CALL_ENDED"]:
			case enums.ACTIONS["DIRECT_CALL_ERROR"]:
				break;
			default:
				break;
		}
	};

	toggleLeftPanel = event => {
		const sidebarview = this.state.sidebarview;
		this.setState({ sidebarview: !sidebarview });
	};

	groupUpdated = (key, message, group, options) => {
		switch (key) {
			case enums.GROUP_MEMBER_BANNED:
			case enums.GROUP_MEMBER_KICKED: {
				if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.item.guid === group.guid && options.user.uid === this.loggedInUser.uid) {
					this.context.setItem({});
					this.context.setType("");
				}
				break;
			}
			case enums.GROUP_MEMBER_SCOPE_CHANGED: {
				if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.item.guid === group.guid && options.user.uid === this.loggedInUser.uid) {
					const groupObject = Object.assign({}, this.context.item, {
						scope: options["scope"],
					});
					this.context.setItem(groupObject);
					this.context.setType(CometChat.ACTION_TYPE.TYPE_GROUP);
				}
				break;
			}
			default:
				break;
		}
	};

	//if custom css is added
	getStyle = () => {
		let customCss = "";
		if (this.context.UIKitSettings.customCSS.trim().length) {
			customCss = this.context.UIKitSettings.customCSS;
		}

		return <style>{customCss}</style>;
	};

	render() {
		let sidebar = null;
		if (this.props.isSidebarEnabled()) {
			sidebar = (
				<div css={embedSidebarStyle(this.props, this.state)} className="embedded__sidebar">
					<CometChatNavBar theme={this.props.theme} lang={this.props.lang} settings={this.props.settings} actionGenerated={this.actionHandler} />
				</div>
			);
		}

		const widgetSettings = Object.assign({}, this.props.settings, {
			parentNode: this.state.parentNode,
			launch: this.props,
		});
		let messageScreen = <CometChatMessages theme={this.props.theme} sidebar={sidebar === null ? 0 : 1} lang={this.props.lang} widgetsettings={this.props.widgetsettings} _parent={enums.CONSTANTS["EMBEDDED_COMPONENT"]} actionGenerated={this.actionHandler} />;

		return (
			<div css={embedWrapperStyle(this.props)} className="app__messenger" ref={el => (this.embedFrame = el)}>
				<Frame css={embedFrameStyle()} head={this.getStyle()} allow="geolocation; microphone; camera; autoplay; fullscreen; midi; encrypted-media; display-capture;">
					<FrameProvider>
						<Global styles={embedGlobalStyles} />
						<div css={embedContentWrapperStyle(sidebar, this.props, keyframes)} className="messenger__wrapper">
							{sidebar}
							<div css={embedMainStyle(sidebar, this.state, this.props)} className="embedded__main">
								{messageScreen}
							</div>
						</div>
					</FrameProvider>
				</Frame>
			</div>
		);
	}
}

// Specifies the default values for props:
Embedded.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  settings: {},
};

Embedded.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  settings: PropTypes.object,
};
