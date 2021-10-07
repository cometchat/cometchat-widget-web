import React, { Component } from 'react';

const asyncComponent = (componentName, importComponent) => {
    return class extends Component {
        state = {
            component: null
        };

        componentDidMount() {
            // import component should be function refererce.
            // it returns promise
            importComponent().then(cpm => {
                // it has default property to load component dynamically (cpm.default)
                this.setState({ component: (componentName) ? cpm[componentName] : cpm.default });
            }).catch(error => {

                console.log("asyncComponent error", error);
            });
        }
        render() {
            // render method renders the component dynamically.
            const C = this.state.component; //console.log("C", C);
            return C ? <C {...this.props} /> : null;

        }
    }
}

export default asyncComponent;
