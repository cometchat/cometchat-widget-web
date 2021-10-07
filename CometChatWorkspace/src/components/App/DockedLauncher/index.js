import React from "react";
import PropTypes from 'prop-types';

/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core';

import Frame from "react-frame-component";

import { FrameProvider } from "../../../hoc/FrameProvider";
import { validateWidgetSettings } from "../../../util";

import { 
    launcherWrapperStyle,
    launcherFrameStyle,
    launcherStyle, 
    launcherContainerStyle,
    openLauncherIconStyle, 
    closeLauncherIconStyle,
    notificationIconWrapperStyle,
    notificationIconStyle
} from "./style";

import chatBubble from './resources/chat_bubble.svg';
import chatClose from './resources/chat_close.svg';

export class DockedLauncher extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            active: false,
            unreadcount: 0
        }
    }

    componentDidMount = () => {

        this.updateUnreadCount();
    }

    componentDidUpdate = (prevProps) => {

        if (prevProps.messagelist !== this.props.messagelist) {
            this.updateUnreadCount();
        }

        if (prevProps.active !== this.props.active) {
            this.setState({ active: this.props.active });
        }
    }

    updateUnreadCount = () => {

        if (Object.keys(this.props.messagelist).length === 0) 
            return false;

        const messagelist = this.props.messagelist;
        const reducer = (accumulator, currentValue) => accumulator + currentValue;

        const total = Object.values(messagelist).reduce(reducer);
        this.setState({ unreadcount: total });
    }

    toggleView = () => {

        const active = this.state.active; 
        this.setState({ active: !active});

        this.props.clicked();
    }

    render() {

        let notificationIcon = null;
        if (this.state.unreadcount) {
            notificationIcon = (<div css={notificationIconWrapperStyle()}><span css={notificationIconStyle(this.props)}>{this.state.unreadcount}</span></div>);
        }

        let openIcon = (<img src={chatBubble} css={openLauncherIconStyle(this.state)} />);
        if (validateWidgetSettings(this.props.settings, "style", "docked_layout_icon_open")) {

            const chatBubble = this.props.settings.style["docked_layout_icon_open"];
            openIcon = (<img src={chatBubble} css={openLauncherIconStyle(this.state)} />);
        }

        let closeIcon = (<img src={chatClose} css={closeLauncherIconStyle(this.state)} />);
        if (validateWidgetSettings(this.props.settings, "style", "docked_layout_icon_close")) {

            const chatClose = this.props.settings.style["docked_layout_icon_close"];
            closeIcon = (<img src={chatClose} css={closeLauncherIconStyle(this.state)} />);
        }

        return (
            <div css={launcherWrapperStyle(this.props, keyframes)} className="app__launcher">
                <Frame css={launcherFrameStyle()}>
                    <FrameProvider>
                        {notificationIcon}
                        <div css={launcherStyle(this.props)} onClick={this.toggleView} className="launcher__wrapper">
                            <div css={launcherContainerStyle()} className="launcher__container">
                                {openIcon}
                                {closeIcon}
                            </div>
                        </div>
                        
                    </FrameProvider>
                </Frame>
            </div>
        );
    }
}

// Specifies the default values for props:
DockedLauncher.defaultProps = {
    active: false,
};

DockedLauncher.propTypes = {
    active: PropTypes.bool
}