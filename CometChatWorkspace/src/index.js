import { CometChat } from "@cometchat-pro/chat";

import CometChatWidgetLaunch from "./CometChatWidgetLaunch";
import CometChatWidgetEvent from "./CometChatWidgetEvent";

export default class CometChatWidget {
	static appID;
	static appRegion;
	static authKey;
	static widgetID;
	static settings = {};
	static on = CometChatWidgetEvent.on;
	static CometChat = CometChat;

	static init(params) {
		const promise = new Promise((resolve, reject) => {
			if (CometChat.isInitialized()) {
				const message = "CometChat Widget: CometChat already initialized";
				console.log(message);
				resolve(message);
				return;
			}

			if (!params) {
				const message = "CometChat Widget Error: App ID and Region not available.";
				console.error(message);
				reject(message);
				return;
			}

			if (!params.appID) {
				const message = "CometChat Widget Error: App ID not available.";
				console.error(message);
				reject(message);
				return;
			}

			if (!params.appRegion) {
				const message = "CometChat Widget Error: Region not available.";
				console.error(message);
				reject(message);
				return;
			}

			CometChatWidget.appID = params.appID;
			CometChatWidget.appRegion = params.appRegion;

			if (params.authKey) {
				CometChatWidget.authKey = params.authKey;
			}

			const appSetting = new CometChat.AppSettingsBuilder().subscribePresenceForAllUsers().setRegion(CometChatWidget.appRegion).build();
			CometChat.init(CometChatWidget.appID, appSetting)
				.then(response => {
					if (CometChat.setSource) {
						CometChat.setSource("chat-widget", "web", "reactjs");
					}
					const message = "CometChat Widget: CometChat initialised successfully";
					console.log(message);
					resolve(response);
				})
				.catch(error => {
					console.error("CometChat Widget Error: ", error);
					reject(error);
				});
		});

		return promise;
	}

	static login(params) {
		const promise = new Promise((resolve, reject) => {
			if (!CometChat.isInitialized()) {
				const message = "CometChat Widget Error: CometChat not initialized.";
				console.error(message);
				reject(message);
				return;
			}

			if (!params || (!params.uid && !params.authToken)) {
				const message = "CometChat Widget Error: uid OR AuthToken is not available.";
				console.error(message);
				reject(message);
				return;
			}

			const args = [];
			if (params.authToken) {
				args.push(params.authToken);
				CometChatWidget.authToken = params.authToken;
			} else if (params.uid) {
				if (!CometChatWidget.authKey) {
					const message = "CometChat Widget Error: AuthKey is not available.";
					console.error(message);
					reject(message);
					return;
				}

				CometChatWidget.UID = params.uid;
				args.push(CometChatWidget.UID, CometChatWidget.authKey);
			}

			CometChat.login(...args)
				.then(user => {
					if (!user) {
						const message = "CometChat Widget Error: Error in login.";
						console.error(message);
						reject(message);
						return;
					} else {
						const message = "CometChat Widget: User logged in successfully";
						console.log(message);
						resolve(user);
						return;
					}
				})
				.catch(error => {
					console.error("CometChat Widget Error: ", error);
					reject(error);
					return;
				});
		});

		return promise;
	}

	static logout() {
		const promise = new Promise((resolve, reject) => {
			CometChat.logout()
				.then(response => {
					console.log("CometChat Widget: Logged out successfully.");
					resolve(response);
					return;
				})
				.catch(error => {
					console.error("CometChat Widget Error: ", error);
					reject(error);
					return;
				});
		});

		return promise;
	}

	static createOrUpdateUser(user) {
		return this.updateUser(user);
	}

	static updateUser(user) {
		const promise = new Promise((resolve, reject) => {
			if (!CometChat.isInitialized()) {
				const message = "CometChat Widget Error: CometChat not initialized.";
				console.error(message);
				reject(message);
				return;
			}

			if (!user) {
				const message = "CometChat Widget Error: User details not available.";
				console.error(message);
				return reject(message);
			}

			if (!CometChatWidget.authKey) {
				const message = "CometChat Widget Error: AuthKey is not available.";
				console.error(message);
				return reject(message);
			}

			CometChat.updateUser(user, CometChatWidget.authKey)
				.then(updatedUser => {
					console.log("CometChat Widget: User updated successfully.", updatedUser);
					return resolve(updatedUser);
				})
				.catch(error => {
					if (error.code && error.code === "ERR_UID_NOT_FOUND") {
						CometChat.createUser(user, CometChatWidget.authKey)
							.then(createdUser => {
								console.log("CometChat Widget: User created.", createdUser);
								return resolve(createdUser);
							})
							.catch(error => {
								console.error("CometChat Widget Error: ", error);
								return reject(error);
							});
					} else {
						console.error("CometChat Widget Error: ", error);
						return reject(error);
					}
				});
		});

		return promise;
	}

	static createOrUpdateGroup(group) {
		return this.updateGroup(group);
	}

	static groupValidator = params => {
		return new Promise((resolve, reject) => {
			if (!params) {
				const message = "CometChat Widget Error: Group details not available.";
				console.error(message);
				return reject(message);
			}

			if (params instanceof CometChat.Group) {
				resolve(params);
			} else {
				if (!params.guid) {
					const message = "CometChat Widget Error: guid is not available.";
					console.error(message);
					return reject(message);
				}

				if (!params.groupName) {
					const message = "CometChat Widget Error: groupName is not available.";
					console.error(message);
					return reject(message);
				}

				if (!params.groupType) {
					const message = "CometChat Widget Error: groupType is not available.";
					console.error(message);
					return reject(message);
				}

				let password = "";
				if (params.groupType === CometChat.GROUP_TYPE.PASSWORD) {
					if (!params.password) {
						const message = "CometChat Widget Error: password is not available.";
						console.error(message);
						return reject(message);
					} else {
						password = params.password;
					}
				}

				const groupObject = new CometChat.Group(params.guid, params.groupName, params.groupType, password);
				return resolve(groupObject);
			}
		});
	};

	static updateGroup(params) {
		const promise = new Promise((resolve, reject) => {
			if (!CometChat.isInitialized()) {
				const message = "CometChat Widget Error: CometChat not initialized.";
				console.error(message);
				return reject(message);
			}

			CometChat.getLoggedinUser()
				.then(user => this.groupValidator(params))
				.then(group => CometChat.updateGroup(group))
				.then(updatedGroup => {
					console.log("CometChat Widget: Group details updated successfully.", updatedGroup);
					return resolve(updatedGroup);
				})
				.catch(error => {
					if (error.code && error.code === "ERR_GUID_NOT_FOUND") {
						this.groupValidator(params)
							.then(group => CometChat.createGroup(group))
							.then(newGroup => {
								console.log("CometChat Widget: Group created.", newGroup);
								return resolve(newGroup);
							})
							.catch(error => {
								console.error("CometChat Widget Error: ", error);
								return reject(error);
							});
					} else {
						console.error("CometChat Widget Error: ", error);
						return reject(error);
					}
				});
		});

		return promise;
	}

	static launch(params) {
		const promise = new Promise((resolve, reject) => {
			if (!CometChat.isInitialized()) {
				const message = "CometChat Widget Error: CometChat not initialized";
				console.error(message);
				reject(message);
				return;
			}

			CometChat.getLoggedinUser()
				.then(user => {
					if (user === null || Object.keys(user).length === 0) {
						const message = "CometChat Widget Error: User not logged in.";
						console.error(message);
						reject(message);
						return;
					}

					if (!params.widgetID) {
						const message = "CometChat Widget Error: widgetID is not available.";
						console.error(message);
						reject(message);
						return;
					}

					const options = { ...params, appID: CometChatWidget.appID, appRegion: CometChatWidget.appRegion, loggedInUser: user };
					const launch = new CometChatWidgetLaunch(options);
					launch
						.checkForSettings()
						.then(response => {
							launch
								.render()
								.then(response => {
									console.log("CometChat Widget: ", response);
									resolve(response);
									return;
								})
								.catch(error => {
									console.error("CometChat Widget Error: ", error);
									reject(error);
									return;
								});
						})
						.catch(error => {
							console.error("CometChat Widget Error: ", error);
							reject(error);
							return;
						});
				})
				.catch(error => {
					console.error("CometChat Widget Error: ", error);
					reject(error);
					return;
				});
		});

		return promise;
	}

	static chatWithUser(uid) {
		if (!uid) {
			console.error("CometChat Widget Error: uid not available");
			return;
		}

		uid = uid.toString();
		CometChatWidgetEvent.triggerHandler("chatWithUser", { uid: uid });
	}

	static chatWithGroup(guid) {
		if (!guid) {
			console.error("CometChat Widget Error: guid not available");
			return;
		}

		guid = guid.toString();
		CometChatWidgetEvent.triggerHandler("chatWithGroup", { guid: guid });
	}

	static callUser(uid) {
		if (!uid) {
			console.error("CometChat Widget Error: uid not available");
			return;
		}

		uid = uid.toString();
		CometChatWidgetEvent.triggerHandler("callUser", { uid: uid });
	}

	static callGroup(guid) {
		if (!guid) {
			console.error("CometChat Widget Error: guid not available");
			return;
		}

		guid = guid.toString();
		CometChatWidgetEvent.triggerHandler("callGroup", { guid: guid });
	}

	static openOrCloseChat(flag) {
		const eventType = flag ? "onOpenChat" : "onCloseChat";
		CometChatWidgetEvent.triggerHandler(eventType, { flag });
	}

	static localize(lang) {
		if (!lang.trim().length) {
			console.error("CometChat Widget Error: language not available");
			return;
		}

		CometChatWidgetEvent.triggerHandler("localize", { lang: lang });
	}
}
