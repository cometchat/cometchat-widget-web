import React from "react";
import PropTypes from 'prop-types';

import asyncComponent from '../../../hoc/asyncComponent';

const Embedded = asyncComponent("Embedded", () => {
	// Pass the component which you want to load dynamically.
	return import("../Embedded/index.js");
});

export class EmbedFrame extends React.Component {

    render() {

        let embedView = null;        
        if (this.props.launched === true) {
            embedView = (<Embedded {...this.props} />);
        }

        return (embedView);
    }
}
