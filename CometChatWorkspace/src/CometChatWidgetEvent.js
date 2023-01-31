export default class CometChatWidgetEvent {

   static _triggers = {};

    static on(event, callback) {
        if (!CometChatWidgetEvent._triggers[event])
            CometChatWidgetEvent._triggers[event] = [];
        CometChatWidgetEvent._triggers[event].push(callback);
    }

    static triggerHandler(event, params) {
        if (CometChatWidgetEvent._triggers[event]) {
            for (const i in CometChatWidgetEvent._triggers[event])
                CometChatWidgetEvent._triggers[event][i](params);
        }
    }

    static remove(event) {
		if (CometChatWidgetEvent._triggers[event]) {
			delete CometChatWidgetEvent._triggers[event];
		}
	}
}