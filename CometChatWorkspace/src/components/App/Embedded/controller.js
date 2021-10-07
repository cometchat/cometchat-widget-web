import { CometChat } from "@cometchat-pro/chat";

import * as enums from "UIKit/CometChat/util/enums.js";

export class EmbedManager {

    msgListenerId = "embed_" + new Date().getTime();
    
    constructor() {

    }

    attachListeners(callback) {

        CometChat.addMessageListener(
            this.msgListenerId,
            new CometChat.MessageListener({
                onTextMessageReceived: textMessage => {
                    callback(enums.TEXT_MESSAGE_RECEIVED, textMessage);
                },
                onMediaMessageReceived: mediaMessage => {
                    callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
                },
                onCustomMessageReceived: customMessage => {
                    callback(enums.CUSTOM_MESSAGE_RECEIVED, customMessage);
                },
                onMessagesRead: messageReceipt => {
                    callback(enums.MESSAGE_READ, messageReceipt);
                }
            })
        );
    }

    removeListeners() {
        CometChat.removeMessageListener(this.msgListenerId);
    }
}

