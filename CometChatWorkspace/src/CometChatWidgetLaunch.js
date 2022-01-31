import React from 'react';
import ReactDOM from 'react-dom';

import { CometChat } from "@cometchat-pro/chat";
import CometChatWidgetEvent from "./CometChatWidgetEvent";
import * as widgetEnums from "./util/enums";
import asyncComponent from './hoc/asyncComponent';

const App = asyncComponent("App", () => {
    return import('./components/App/index.js');
});

export default class CometChatWidgetLaunch {

    options = {
        defaultID: "",
        defaultType: "",
        loggedInUser: {},
        settings: {},
        targetElement: null
    };
    
    constructor(options) {

        Object.assign(this.options, options);
    }

    getUserOrGroup = () => {

        const promise = new Promise((resolve, reject) => {

            if(!this.options.defaultID || this.options.defaultID.trim().length === 0) {
                const message = "defaultID not available.";
                console.log("CometChat Widget: ", message);
                return resolve({ "type": "", "user": {} });
            }

            if(!this.options.defaultType || this.options.defaultType.trim().length === 0) {

                const message = "defaultType not available.";
                console.log("CometChat Widget: ", message);
                resolve({ type: "", user: {} });
            }

            const id = this.options.defaultID.trim();
            const type = this.options.defaultType.trim();

            if (id && type === CometChat.ACTION_TYPE.TYPE_USER) {

                //if default id is same as loggedin userid, return empty
                if (this.options.loggedInUser.uid === id) {
                    resolve({ "type": "", "user": {} });
                }

                CometChat.getUser(id).then(user => {

                    resolve({ "type": CometChat.ACTION_TYPE.TYPE_USER, user });

                }).catch(error => {

                    console.log("CometChat Widget Error: ", error);
                    resolve({ "type": "", "user": {} });
                });

            } else if (id && type === CometChat.ACTION_TYPE.TYPE_GROUP) {

                CometChat.getGroup(id).then(group => {

                    if (!group.hasJoined) {

                        const guid = group.guid;
                        const groupType = group.type;
                        let password = "";
                        if (groupType === CometChat.GROUP_TYPE.PASSWORD) {
                            password = prompt("Enter password to join group");
                        }

                        CometChat.joinGroup(guid, groupType, password).then(group => {

                            console.log("CometChat Widget: Group joined successfully", group);
                            resolve({ "type": CometChat.ACTION_TYPE.TYPE_GROUP, "user": group });

                        }).catch(error => {

                            console.log("CometChat Widget Error: ", error);
                            resolve({ "type": "", "user": {} });
                        });

                    } else {
                        resolve({ "type": CometChat.ACTION_TYPE.TYPE_GROUP, "user": group });
                    }

                }).catch(error => {

                    console.log("CometChat Widget Error: ", error);
                    resolve({ "type": "", "user": {} });
                });
            }

        });

        return promise;
    }

    fetchSettings = () => {

        const env = "";
        const region = this.options.appRegion;
        const widgetid = this.options.widgetID;

        let apiUrl = `https://widget${env}-${region}.cometchat.io/v2/widget?id=${widgetid}`;

        return fetch(apiUrl);
    }

    checkForSettings = () => {

        const promise = new Promise((resolve, reject) => {

            if (this.options.hasOwnProperty("settings") && Object.keys(this.options.settings).length) {

                const message = "CometChat Widget: Settings already fetched.";
                console.log(message);
                resolve(message);

            } else {

                this.fetchSettings(this.options.appRegion, this.options.widgetID).then(response => response.json()).then(response => {

                    if (response.hasOwnProperty("data") && response.data.hasOwnProperty("configuration")) {

                        this.options.settings = response.data.configuration;
                        const message = "CometChat Widget: Settings fetched.";
                        console.log(message);
                        resolve(message);

                    } else {

                        const message = "Widget settings not found.";
                        reject(message);
                    }

                }).catch(error => reject(error));
            }
        });

        return promise;
    }

    render() {
        
        const promise = new Promise((resolve, reject) => {

            this.getUserOrGroup().then(response => {

                if (this.options.hasOwnProperty("docked") && (this.options.docked === true || this.options.docked === "true")) {

                    const el = document.createElement("div");
                    el.setAttribute("id", "cometchat__widget");
                    el.style.width = "100%";
                    el.style.height = "100%";
                    document.body.appendChild(el);

                    this.options.targetElement = el;
                } else {

                    if (this.options.hasOwnProperty("target") === false || this.options.target.trim().length === 0) {

                        const message = "Target not available.";
                        reject(message);
                    }

                    const el = document.createElement("div");
                    el.setAttribute("id", "cometchat__widget");
                    el.style.width = "100%";
                    el.style.height = "100%";
                    document.querySelector(this.options.target).appendChild(el);

                    this.options.targetElement = el;
                }

                const propObj = Object.assign({}, this.options, { user: response.user, type: response.type });
                ReactDOM.render(<App {...propObj} actionGenerated={this.actionHandler} />, this.options.targetElement, () => {

                    const message = "Widget launched.";
                    resolve(message);

                });
            });
        });
        return promise;
    }

    actionHandler = (action, item) => {

        switch (action) {
            case "onMessageReceived": {
                CometChatWidgetEvent.triggerHandler('onMessageReceived', { "status": "success", "response": item });
                return;
            }
            case widgetEnums["EVENTS"]["OPEN_CHAT"]: {
                CometChatWidgetEvent.triggerHandler(widgetEnums["EVENTS"]["OPEN_CHAT"], { ...item });
                return;
            }
            case widgetEnums["EVENTS"]["CLOSE_CHAT"]: {
                CometChatWidgetEvent.triggerHandler(widgetEnums["EVENTS"]["CLOSE_CHAT"], { ...item });
                return;
            }
            default:
                break;
        }
    }
}
