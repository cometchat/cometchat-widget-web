import React from "react";
import ReactDOM from "react-dom";
/** @jsx jsx */
import { CacheProvider, jsx, css } from "@emotion/react";
import createCache from "@emotion/cache";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { EVENTS, CONSTANTS } from "../../util/enums";

import { CometChatIncomingCall, CometChatOutgoingCall, CometChatOutgoingDirectCall, CometChatIncomingDirectCall, CometChatErrorBoundary } from "UIKit/CometChatWorkspace/src/components";

import { CometChatContextProvider } from "UIKit/CometChatWorkspace/src/util/CometChatContext.js";
import * as enums from "UIKit/CometChatWorkspace/src/util/enums.js";
import { UIKitSettings } from "UIKit/CometChatWorkspace/src/util/UIKitSettings";
import { SoundManager } from "UIKit/CometChatWorkspace/src/util/SoundManager";

import Translator from "UIKit/CometChatWorkspace/src/resources/localization/translator";

import { AppManager } from "./controller";

import asyncComponent from "../../hoc/asyncComponent";

const DockedLauncher = asyncComponent("DockedLauncher", () => {
	// Pass the component which you want to load dynamically.
	return import("./DockedLauncher/index.js");
});

const EmbedFrame = asyncComponent("EmbedFrame", () => {
	// Pass the component which you want to load dynamically.
	return import("./EmbedFrame/index.js");
});

import { validateWidgetSettings } from "../../util";

import tabs from "UIKit/CometChatWorkspace/src/resources/tabs.json";
import { theme } from "../../resources/theme";

import { AppStyle } from "./style";

export class App extends React.Component {
	loggedInUser;

	constructor(props) {
		super(props);

		this.state = {
			item: props.user,
			type: props.type,
			embedded: null,
			dockedview: null,
			showEmbed: null,
			messagelist: [],
			lang: props.lang,
			callType: "",
			enableUnreadCount: true,
		};

		this.contextProviderRef = React.createRef();
		this.EmbedFrameRef = React.createRef();
		this.outgoingCallRef = React.createRef();
		this.outgoingDirectCallRef = React.createRef();

		CometChat.getLoggedinUser()
			.then(user => (this.loggedInUser = user))
			.catch(error => {
				const errorCode = error && error.hasOwnProperty("code") ? error.code : "USER_NOT_LOGGED_IN";
				throw new Error(errorCode);
			});

		CometChatWidget.on("onOpenChat", args => this.toggleChat(args));
		CometChatWidget.on("onCloseChat", args => this.toggleChat(args));
		CometChatWidget.on("chatWithUser", args => this.chatWithUser(args));
		CometChatWidget.on("chatWithGroup", args => this.chatWithGroup(args));
		CometChatWidget.on("callUser", args => this.callUser(args));
		CometChatWidget.on("callGroup", args => this.callGroup(args));

		CometChatWidget.on("localize", args => {
			const lang = args.lang.toLowerCase();

			Translator.setLanguage(lang);
			this.setState({ lang: lang });
		});
	}

	componentDidMount() {
		this.appManager = new AppManager();
		this.appManager.attachListeners(this.listenerCallback);

		this.contextProviderRef.setTypeAndItem(this.props.type, this.props.user);

		/**
		 * setup UIKit based on chat widget settings
		 */
		this.setUpUIKit();

		if (this.props.hasOwnProperty("docked") && (this.props.docked === true || this.props.docked === "true")) {
			this.setState({ dockedview: true });
		} else {
			this.setState({ dockedview: false, showEmbed: true });
		}

		this.enableUnreadCount().then(response => {
			if (response !== this.state.enableUnreadCount) {
				this.setState({ enableUnreadCount: response }, () => this.populateMessageList());
			} else {
				this.populateMessageList();
			}
		});
	}

	populateMessageList = () => {
		let messagelist = {};
		this.getUnreadMessageCount()
			.then(response => {
				if (Object.keys(response).length) {
					for (const key in response) {
						messagelist[key] = response[key];
					}
				}
				this.setState({ messagelist: messagelist });
			})
			.catch(error => console.log("CometChatWidget Error: ", error));
	};

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.lang !== this.props.lang) {
			Translator.setLanguage(lang);
			this.setState({ lang: this.props.lang });
		}

		this.enableUnreadCount();
	}

	enableUnreadCount = () => {
		return new Promise(resolve => {
			this.contextProviderRef.state.FeatureRestriction.isUnreadCountEnabled()
				.then(response => resolve(response))
				.catch(error => resolve(false));
		});
	};

	setUpUIKit = () => {
		const widgetSettings = { ...this.props.settings };

		/**
		 * If the chat widget settings has custom css applied
		 */
		if (validateWidgetSettings(widgetSettings, "style", "custom_css")) {
			const customCSS = widgetSettings["style"]["custom_css"].trim();
			this.contextProviderRef.state.UIKitSettings.setCustomCSS(customCSS);
		}

		/**
		 * If the chat widget settings has custom js applied
		 */
		if (validateWidgetSettings(widgetSettings, "style", "custom_js")) {
			const customJS = widgetSettings["style"]["custom_js"].trim();
			this.contextProviderRef.state.UIKitSettings.setCustomJS(customJS);
		}

		/**
		 * If the chat widget settings has tab sequence set
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "sidebar_navigation_sequence")) {
			this.contextProviderRef.state.UIKitSettings.setTabs(widgetSettings["sidebar"]["sidebar_navigation_sequence"]);
		}

		/**
		 * If the chat widget settings has key `recent_chat_listing`
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "recent_chat_listing")) {
			this.contextProviderRef.state.UIKitSettings.setChatListMode(widgetSettings["sidebar"]["recent_chat_listing"]);
		}

		/**
		 * If the chat widget settings has key `user_listing`
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "user_listing")) {
			this.contextProviderRef.state.UIKitSettings.setUserListMode(widgetSettings["sidebar"]["user_listing"]);
		}

		/**
		 * If the chat widget settings has chats in sidebar
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "chats") === true) {
			this.contextProviderRef.state.UIKitSettings.setChats(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setChats(false);
		}

		/**
		 * If the chat widget settings has users in sidebar
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "users") === true) {
			this.contextProviderRef.state.UIKitSettings.setUsers(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setUsers(false);
		}

		/**
		 * If the chat widget settings has groups in sidebar
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "groups") === true) {
			this.contextProviderRef.state.UIKitSettings.setGroups(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setGroups(false);
		}

		/**
		 * If the chat widget settings has calls in sidebar
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "calls") === true) {
			this.contextProviderRef.state.UIKitSettings.setCalls(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setCalls(false);
		}

		/**
		 * If the chat widget settings has user settings in sidebar
		 */
		if (validateWidgetSettings(widgetSettings, "sidebar", "user_settings") === true) {
			this.contextProviderRef.state.UIKitSettings.setUserSettings(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setUserSettings(false);
		}

		/**
		 * If the chat widget settings has allowed message reactions
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_message_reactions") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendMessageReaction(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendMessageReaction(false);
		}

		/**
		 * If the chat widget settings has allowed sharing collaborative whiteboard
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_collaborative_whiteboard") === true) {
			this.contextProviderRef.state.UIKitSettings.setCollaborativeWhiteboard(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setCollaborativeWhiteboard(false);
		}

		/**
		 * If the chat widget settings has allowed video calling
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_video_calling") === true) {
			this.contextProviderRef.state.UIKitSettings.setUserVideoCall(true);
			this.contextProviderRef.state.UIKitSettings.setGroupVideoCall(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setUserVideoCall(false);
			this.contextProviderRef.state.UIKitSettings.setGroupVideoCall(false);
		}

		/**
		 * If the chat widget settings has allowed sharing collaborative document
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_collaborative_document") === true) {
			this.contextProviderRef.state.UIKitSettings.setCollaborativeDocument(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setCollaborativeDocument(false);
		}

		/**
		 * If the chat widget settings has allowed editing messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_editing_messages") === true) {
			this.contextProviderRef.state.UIKitSettings.setEditMessage(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setEditMessage(false);
		}

		/**
		 * If the chat widget settings has allowed sending messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_sending_messages") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendMessageInOneOnOne(true);
			this.contextProviderRef.state.UIKitSettings.setSendMessageInGroup(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendMessageInOneOnOne(false);
			this.contextProviderRef.state.UIKitSettings.setSendMessageInGroup(false);
		}

		/**
		 * If the chat widget settings has allowed joining and leaving groups
		 */
		if (validateWidgetSettings(widgetSettings, "main", "join_or_leave_groups") === true) {
			this.contextProviderRef.state.UIKitSettings.setJoinOrLeaveGroup(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setJoinOrLeaveGroup(false);
		}

		/**
		 * If the chat widget settings has allowed blocking users
		 */
		if (validateWidgetSettings(widgetSettings, "main", "block_user") === true) {
			this.contextProviderRef.state.UIKitSettings.setBlockUser(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setBlockUser(false);
		}

		/**
		 * If the chat widget settings has allowed voice calling
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_voice_calling") === true) {
			this.contextProviderRef.state.UIKitSettings.setUserAudioCall(true);
			this.contextProviderRef.state.UIKitSettings.setGroupAudioCall(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setUserAudioCall(false);
			this.contextProviderRef.state.UIKitSettings.setGroupAudioCall(true);
		}

		/**
		 * If the chat widget settings has allowed sending emojis
		 */
		if (validateWidgetSettings(widgetSettings, "main", "send_emojis") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendEmojis(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendEmojis(false);
		}

		/**
		 * If the chat widget settings has allowed sending files/documents
		 */
		if (validateWidgetSettings(widgetSettings, "main", "send_files") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendFiles(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendFiles(false);
		}

		/**
		 * If the chat widget settings has allowed viewing shared media
		 */
		if (validateWidgetSettings(widgetSettings, "main", "view_shared_media") === true) {
			this.contextProviderRef.state.UIKitSettings.setViewShareMedia(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setViewShareMedia(false);
		}

		/**
		 * If the chat widget settings has allowed sound or incoming/outgoing messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_sound_for_messages") === true) {
			this.contextProviderRef.state.UIKitSettings.setEnableSoundForMessages(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setEnableSoundForMessages(false);
		}

		/**
		 * If the chat widget settings has allowed sending photos, videos, and audios
		 */
		if (validateWidgetSettings(widgetSettings, "main", "send_photos_videos") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendPhotoVideos(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendPhotoVideos(false);
		}

		/**
		 * If the chat widget settings has allowed stickers
		 */
		if (validateWidgetSettings(widgetSettings, "main", "show_stickers") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendStickers(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendStickers(false);
		}

		/**
		 * If the chat widget settings has allowed sound or incoming/outgoing calls
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_sound_for_calls") === true) {
			this.contextProviderRef.state.UIKitSettings.setEnableSoundForCalls(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setEnableSoundForCalls(false);
		}

		/**
		 * If the chat widget settings has allowed viewing group members
		 */
		if (validateWidgetSettings(widgetSettings, "main", "view_group_members") === true) {
			this.contextProviderRef.state.UIKitSettings.setViewGroupMembers(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setViewGroupMembers(false);
		}

		/**
		 * If the chat widget settings has enabled display of call action messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "show_call_notifications") === true) {
			this.contextProviderRef.state.UIKitSettings.setCallNotifications(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setCallNotifications(false);
		}

		/**
		 * If the chat widget settings has allowed deleting groups
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_delete_groups") === true) {
			this.contextProviderRef.state.UIKitSettings.setAllowDeleteGroup(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setAllowDeleteGroup(false);
		}

		/**
		 * If the chat widget settings has allowed kicking and banning of group members
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_kick_ban_members") === true) {
			this.contextProviderRef.state.UIKitSettings.setKickMember(true);
			this.contextProviderRef.state.UIKitSettings.setBanMember(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setKickMember(false);
			this.contextProviderRef.state.UIKitSettings.setBanMember(false);
		}

		/**
		 * If the chat widget settings has enabled display of group action messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "hide_join_leave_notifications") === true) {
			this.contextProviderRef.state.UIKitSettings.setJoinLeaveNotifications(false);
		} else {
			this.contextProviderRef.state.UIKitSettings.setJoinLeaveNotifications(true);
		}

		/**
		 * If the chat widget settings has enabled message translation
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_message_translation") === true) {
			this.contextProviderRef.state.UIKitSettings.setMessageTranslation(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setMessageTranslation(false);
		}

		/**
		 * If the chat widget settings has allowed creating groups
		 */
		if (validateWidgetSettings(widgetSettings, "main", "create_groups") === true) {
			this.contextProviderRef.state.UIKitSettings.setGroupCreation(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setGroupCreation(false);
		}

		/**
		 * If the chat widget settings has enabled typing indicators
		 */
		if (validateWidgetSettings(widgetSettings, "main", "show_typing_indicators") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendTypingIndicator(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendTypingIndicator(false);
		}

		/**
		 * If the chat widget settings has enabled user presence
		 */
		if (validateWidgetSettings(widgetSettings, "main", "show_user_presence") === true) {
			this.contextProviderRef.state.UIKitSettings.setShowUserPresence(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setShowUserPresence(false);
		}

		/**
		 * If the chat widget settings has allowed adding group members
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_add_members") === true) {
			this.contextProviderRef.state.UIKitSettings.setAllowAddMembers(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setAllowAddMembers(false);
		}

		/**
		 * If the chat widget settings has enabled deleting messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_deleting_messages") === true) {
			this.contextProviderRef.state.UIKitSettings.setDeleteMessage(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setDeleteMessage(false);
		}

		/**
		 * If the chat widget settings has enabled threaded chats
		 */
		if (validateWidgetSettings(widgetSettings, "main", "enable_threaded_replies") === true) {
			this.contextProviderRef.state.UIKitSettings.setThreadedChats(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setThreadedChats(false);
		}

		/**
		 * If the chat widget settings has enabled read receipts
		 */
		if (validateWidgetSettings(widgetSettings, "main", "show_delivery_read_indicators") === true) {
			this.contextProviderRef.state.UIKitSettings.setShowReadDeliveryReceipts(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setShowReadDeliveryReceipts(false);
		}

		/**
		 * If the chat widget settings has allowed creating polls
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_creating_polls") === true) {
			this.contextProviderRef.state.UIKitSettings.setPolls(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setPolls(false);
		}

		/**
		 * If the chat widget settings has enabled larger size emojis
		 */
		if (validateWidgetSettings(widgetSettings, "main", "show_emojis_in_larger_size") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendEmojisInLargerSize(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendEmojisInLargerSize(false);
		}

		/**
		 * If the chat widget settings has allowed sharing live reactions
		 */
		if (validateWidgetSettings(widgetSettings, "main", "share_live_reactions") === true) {
			this.contextProviderRef.state.UIKitSettings.setSendLiveReaction(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setSendLiveReaction(false);
		}

		/**
		 * If the chat widget settings has allowed sharing live reactions
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_promote_demote_members") === true) {
			this.contextProviderRef.state.UIKitSettings.setAllowPromoteDemoteMembers(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setAllowPromoteDemoteMembers(false);
		}

		/**
		 * If the chat widget settings has enabled hide deleted messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "hide_deleted_messages") === true) {
			this.contextProviderRef.state.UIKitSettings.setHideDeletedMessages(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setHideDeletedMessages(false);
		}

		/**
		 * If the chat widget settings has enabled send message in private
		 */
		if (validateWidgetSettings(widgetSettings, "main", "send_message_in_private_to_group_member") === true) {
			this.contextProviderRef.state.UIKitSettings.setMessageInPrivate(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setMessageInPrivate(false);
		}

		/**
		 * If the chat widget settings has allowed moderator to delete messages
		 */
		if (validateWidgetSettings(widgetSettings, "main", "allow_moderator_to_delete_member_messages") === true) {
			this.contextProviderRef.state.UIKitSettings.setAllowModeratorToDeleteMemberMessages(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setAllowModeratorToDeleteMemberMessages(false);
		}

		/**
		 * If the chat widget settings has enabled show_call_recording_option
		 */
		if (validateWidgetSettings(widgetSettings, CONSTANTS["WIDGET_SETTINGS"]["MAIN"], "show_call_recording_option") === true) {
			this.contextProviderRef.state.UIKitSettings.setShowCallRecordingOption(true);
		} else {
			this.contextProviderRef.state.UIKitSettings.setShowCallRecordingOption(false);
		}
	};

	chatWithUser = args => {
		return new Promise((resolve, reject) => {
			CometChat.getLoggedinUser()
				.then(loggedInUser => {
					//if user is not logged in
					if (loggedInUser === null || Object.keys(loggedInUser).length === 0) {
						const message = "CometChat Widget Error: User not logged in.";
						console.error(message);
						return reject(message);
					}

					//if uid is not available
					if (!args.uid) {
						const message = "User does not exists";
						console.log("CometChat Widget: ", message);
						return resolve({ type: "", user: {} });
					}

					const id = args.uid;
					//if user id is same as loggedin userid, return empty
					if (loggedInUser.uid === id) {
						return resolve({ type: "", user: {} });
					}

					CometChat.getUser(id)
						.then(user => {
							this.contextProviderRef.state.setTypeAndItem(CometChat.ACTION_TYPE.TYPE_USER, user);
							return resolve({ type: CometChat.ACTION_TYPE.TYPE_USER, user });
						})
						.catch(error => {
							console.log("CometChat Widget Error: ", error);
							return resolve({ type: "", user: {} });
						});
				})
				.catch(error => {
					console.error("CometChat Widget Error: ", error);
					return reject(error);
				});
		});
	};

	chatWithGroup = args => {
		return new Promise((resolve, reject) => {
			CometChat.getLoggedinUser()
				.then(loggedInUser => {
					if (loggedInUser === null || Object.keys(loggedInUser).length === 0) {
						const message = "CometChat Widget Error: User not logged in.";
						console.error(message);
						return reject(message);
					}

					//if guid is not available
					if (!args.guid) {
						const message = "Group does not exists";
						console.log("CometChat Widget: ", message);
						return resolve({ type: "", group: {} });
					}

					CometChat.getGroup(args.guid)
						.then(group => {
							if (!group.hasJoined) {
								const guid = group.guid;
								const groupType = group.type;
								let password = "";
								if (groupType === CometChat.GROUP_TYPE.PASSWORD) {
									password = prompt("Enter password to join group");
								}

								CometChat.joinGroup(guid, groupType, password)
									.then(group => {
										console.log("CometChat Widget: Group joined successfully", group);
										this.contextProviderRef.state.setTypeAndItem(CometChat.ACTION_TYPE.TYPE_GROUP, group);
										return resolve({ type: CometChat.ACTION_TYPE.TYPE_GROUP, group: group });
									})
									.catch(error => {
										console.log("CometChat Widget Error: ", error);
										return resolve({ type: CometChat.ACTION_TYPE.TYPE_GROUP, group: {} });
									});
							} else {
								this.contextProviderRef.state.setTypeAndItem(CometChat.ACTION_TYPE.TYPE_GROUP, group);
								return resolve({ type: CometChat.ACTION_TYPE.TYPE_GROUP, group: group });
							}
						})
						.catch(error => {
							console.log("CometChat Widget Error: ", error);
							return resolve({ type: CometChat.ACTION_TYPE.TYPE_GROUP, group: {} });
						});
				})
				.catch(error => {
					console.error("CometChat Widget Error: ", error);
					reject(error);
					return;
				});
		});
	};

	getUnreadMessageCount = () => {
		let messagelist = {};
		const promise = new Promise((resolve, reject) => {
			/**
			 * Is unreadcount feature is disabled, return empty object
			 */
			if (this.state.enableUnreadCount === false) {
				resolve(messagelist);
			}
			if (this.isChatsTabEnabled()) {
				const chatListMode = this.contextProviderRef.state.UIKitSettings.chatListMode;
				const chatListFilterOptions = UIKitSettings.chatListFilterOptions;

				if (chatListMode === chatListFilterOptions["USERS_AND_GROUPS"]) {
					CometChat.getUnreadMessageCount()
						.then(messages => {
							if (messages.hasOwnProperty("users")) {
								for (const user in messages["users"]) {
									messagelist[user] = messages["users"][user];
								}
							}

							if (messages.hasOwnProperty("groups")) {
								for (const group in messages["groups"]) {
									messagelist[group] = messages["groups"][group];
								}
							}

							resolve(messagelist);
						})
						.catch(error => reject(error));
				} else if (chatListMode === chatListFilterOptions["USERS"]) {
					CometChat.getUnreadMessageCountForAllUsers()
						.then(messages => {
							if (Object.keys(messages).length) {
								for (const user in messages) {
									messagelist[user] = messages[user];
								}
							}

							resolve(messagelist);
						})
						.catch(error => reject(error));
				} else if (chatListMode === chatListFilterOptions["GROUPS"]) {
					CometChat.getUnreadMessageCountForAllGroups()
						.then(messages => {
							if (Object.keys(messages).length) {
								for (const group in messages) {
									messagelist[group] = messages[group];
								}
							}

							resolve(messagelist);
						})
						.catch(error => reject(error));
				}
			} else if (this.props.defaultType === CometChat.ACTION_TYPE.TYPE_USER) {
				const uid = this.props.defaultID;
				CometChat.getUnreadMessageCountForUser(uid)
					.then(response => resolve(response))
					.catch(error => reject(error));
			} else if (this.props.defaultType === CometChat.ACTION_TYPE.TYPE_GROUP) {
				const guid = this.props.defaultID;
				CometChat.getUnreadMessageCountForGroup(guid)
					.then(response => resolve(response))
					.catch(error => reject(error));
			}
		});

		return promise;
	};

	toggleChat = params => {
		if (this.state.dockedview !== true || (this.state.showEmbed === true && params.flag === true) || (!this.state.showEmbed && params.flag === false)) {
			return false;
		}

		this.setState({ showEmbed: params.flag }, this.afterToggleChat);
	};

	afterToggleChat = args => {
		let eventName;
		if (this.state.showEmbed) {
			eventName = EVENTS["OPEN_CHAT"];
		} else {
			eventName = EVENTS["CLOSE_CHAT"];
		}

		this.props.actionGenerated(eventName, { success: true });
	};

	activateChat = () => {
		const showEmbed = this.state.showEmbed;
		this.setState({ showEmbed: !showEmbed }, this.afterToggleChat);
	};

	listenerCallback = (key, message) => {
		switch (key) {
			case enums.TEXT_MESSAGE_RECEIVED:
			case enums.MEDIA_MESSAGE_RECEIVED: {
				/**
				 * Don't increment the unread count if the message is sent by the loggedin user
				 */
				if (message.sender.uid === this.loggedInUser?.uid) {
					return false;
				}
				this.triggerMessageReceivedEvent(message);
				this.incrementUnreadMessageCount(message);
				return;
			}
			case enums.CUSTOM_MESSAGE_RECEIVED: {
				/**
				 * Don't increment the unread count if the message is sent by the loggedin user
				 */
				if (message.sender.uid === this.loggedInUser?.uid) {
					return false;
				}

				if (
					this.contextProviderRef.state.hasKeyValue(message, enums.KEYS["METADATA"]) &&
					this.contextProviderRef.state.hasKeyValue(message[enums.KEYS["METADATA"]], enums.KEYS["INCREMENT_UNREAD_COUNT"]) &&
					message[enums.KEYS["METADATA"]][enums.KEYS["INCREMENT_UNREAD_COUNT"]] === true
				) {
					this.incrementUnreadMessageCount(message);
				}

				this.triggerMessageReceivedEvent(message);
				break;
			}
			case enums.MESSAGE_READ:
				this.onMessagesRead(message, key);
				break;
			default:
				break;
		}
	};

	onMessagesRead = (message, key) => {
		/**
		 * Don't decrement the unread count if the read receipt is sent by some other user(not loggedin user)
		 */
		if (message.sender.uid !== this.loggedInUser?.uid) {
			return false;
		}

		this.decrementUnreadMessageCount(message.receiver);
	};

	messageReadActionHandler = message => {
		const receiverType = message.receiverType;
		const receiverId = receiverType === CometChat.RECEIVER_TYPE.USER ? message.sender.uid : message.receiverId;

		this.decrementUnreadMessageCount(receiverId);
	};

	incrementUnreadMessageCount = message => {
		/**
		 * Is unreadcount feature is disabled, return empty object
		 */
		if (this.state.enableUnreadCount === false) {
			return false;
		}

		//don't update unreadcount if the respective chat window is open
		if (this.checkIfChatWindowMatches(message) === false) {
			return false;
		}

		const receiverType = message.receiverType;
		const receiverId = receiverType === CometChat.RECEIVER_TYPE.USER ? message.sender.uid : message.receiverId;

		const messagelist = { ...this.state.messagelist };

		if (messagelist.hasOwnProperty(receiverId)) {
			let unreadcount = messagelist[receiverId];
			messagelist[receiverId] = unreadcount + 1;
		} else {
			messagelist[receiverId] = 1;
		}

		/**
		 * Sound alert for incoming messages
		 */
		if (receiverType === this.contextProviderRef.state.type) {
			if ((receiverType === CometChat.RECEIVER_TYPE.USER && receiverId === this.contextProviderRef.state.item.uid) || (receiverType === CometChat.RECEIVER_TYPE.GROUP && receiverId === this.contextProviderRef.state.item.guid)) {
				SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_MESSAGE"], this.contextProviderRef.state);
			} else {
				SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"], this.contextProviderRef.state);
			}
		} else {
			SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"], this.contextProviderRef.state);
		}

		this.setState({ messagelist: messagelist });
	};

	//update unread message count
	decrementUnreadMessageCount = id => {
		const messagelist = { ...this.state.messagelist };
		if (messagelist.hasOwnProperty(id)) {
			let unreadcount = messagelist[id];
			messagelist[id] = unreadcount ? unreadcount - 1 : 0;

			this.setState({ messagelist: messagelist });
		}
	};

	isSidebarEnabled = () => {
		if (this.props.settings.hasOwnProperty("sidebar") === false) {
			return false;
		}

		const values = [];
		Object.entries(tabs).forEach(([key, tab]) => {
			if (this.props.settings.sidebar.hasOwnProperty(tab)) {
				values.push(this.props.settings.sidebar[tab]);
			}
		});

		return values.some(val => val === true);
	};

	isChatsTabEnabled = () => {
		if (this.props.settings.hasOwnProperty("sidebar") === false) {
			return false;
		}

		return this.props.settings.sidebar.hasOwnProperty(tabs["SIDEBAR_CHATS"]) && this.props.settings.sidebar[tabs["SIDEBAR_CHATS"]];
	};

	ifChatsTabFilterMatches = message => {
		const chatListMode = this.contextProviderRef.state.UIKitSettings.chatListMode;
		const chatListFilterOptions = UIKitSettings.chatListFilterOptions;

		if (chatListMode !== chatListFilterOptions["USERS_AND_GROUPS"]) {
			if ((chatListMode === chatListFilterOptions["USERS"] && message.receiverType === CometChat.RECEIVER_TYPE.GROUP) || (chatListMode === chatListFilterOptions["GROUPS"] && message.receiverType === CometChat.RECEIVER_TYPE.USER)) {
				return false;
			}
		}

		return true;
	};

	checkIfChatWindowMatches = message => {
		const isChatsTabEnabled = this.isChatsTabEnabled();

		//when chat window is closed
		if (this.state.showEmbed !== true) {
			//if chats tab is enabled
			if (isChatsTabEnabled === true && this.ifChatsTabFilterMatches(message) === true) {
				return true;
			} else if (isChatsTabEnabled === false) {
				//if the default id and type matches with the message receiver id and type
				if (Object.keys(this.contextProviderRef.state.item).length && this.contextProviderRef.state.type) {
					let item = this.contextProviderRef.state.item;
					let type = this.contextProviderRef.state.type;

					if (
						(type === CometChat.RECEIVER_TYPE.GROUP && message.receiverType === CometChat.RECEIVER_TYPE.GROUP && message.receiverId === item.guid) ||
						(type === CometChat.RECEIVER_TYPE.USER && message.receiverType === CometChat.RECEIVER_TYPE.USER && message.sender.uid === item.uid)
					) {
						return true;
					}
				}
			}
		} else if (this.state.showEmbed === true) {
			if (isChatsTabEnabled === true && this.ifChatsTabFilterMatches(message) === true) {
				if (Object.keys(this.contextProviderRef.state.item).length && this.contextProviderRef.state.type) {
					let item = this.contextProviderRef.state.item;
					let type = this.contextProviderRef.state.type;

					//if the default id and type matches with the message receiver id and type
					if (
						(type === CometChat.RECEIVER_TYPE.GROUP && message.receiverType === CometChat.RECEIVER_TYPE.GROUP && message.receiverId === item.guid) ||
						(type === CometChat.RECEIVER_TYPE.USER && message.receiverType === CometChat.RECEIVER_TYPE.USER && message.sender.uid === item.uid)
					) {
						return false;
					}
					return true;
				} else {
					return true;
				}
			}
		}

		return false;
	};

	//dispatch a message received event to the chat widget user
	triggerMessageReceivedEvent = message => {
		this.props.actionGenerated("onMessageReceived", message);

		// if (Object.keys(this.contextProviderRef.state.item).length && this.contextProviderRef.state.type) {
		// 	let item = this.contextProviderRef.state.item;
		// 	let type = this.contextProviderRef.state.type;

		// 	if ((type === CometChat.RECEIVER_TYPE.GROUP && message.receiverType === CometChat.RECEIVER_TYPE.GROUP && message.receiverId === item.guid) || (type === CometChat.RECEIVER_TYPE.USER && message.receiverType === CometChat.RECEIVER_TYPE.USER && message.sender.uid === item.uid)) {
		// 		this.props.actionGenerated("onMessageReceived", message);
		// 	}
		// }
	};

	actionHandler = (action, messages, otherMessage) => {
		switch (action) {
			case enums.ACTIONS["MESSAGE_READ"]:
				this.messageReadActionHandler(messages);
				break;
			case enums.ACTIONS["START_AUDIO_CALL"]:
			case enums.ACTIONS["START_VIDEO_CALL"]:
				this.startCall(messages);
				break;
			case enums.ACTIONS["START_DIRECT_CALL"]:
				this.startDirectCall(messages);
				break;
			case enums.ACTIONS["JOIN_DIRECT_CALL"]:
				this.joinDirectCall();
				break;
			case enums.ACTIONS["OUTGOING_CALL_ACCEPTED"]:
			case enums.ACTIONS["USER_JOINED_CALL"]:
			case enums.ACTIONS["USER_LEFT_CALL"]:
				break;
			case enums.ACTIONS["INCOMING_CALL_ACCEPTED"]:
				this.setState({ callType: enums.CONSTANTS["INCOMING_DEFAULT_CALLING"] });
				break;
			case enums.ACTIONS["ACCEPT_DIRECT_CALL"]:
				this.setState({ callType: enums.CONSTANTS["INCOMING_DIRECT_CALLING"] });
				break;
			case enums.ACTIONS["OUTGOING_CALL_ENDED"]:
			case enums.ACTIONS["OUTGOING_CALL_REJECTED"]:
			case enums.ACTIONS["OUTGOING_CALL_CANCELLED"]:
			case enums.ACTIONS["INCOMING_CALL_ENDED"]:
			case enums.ACTIONS["INCOMING_CALL_REJECTED"]:
			case enums.ACTIONS["DIRECT_CALL_ENDED"]:
			case enums.ACTIONS["DIRECT_CALL_ERROR"]:
				this.setState({ callType: "" });
				break;
			case enums.ACTIONS["MESSAGE_COMPOSED"]:
				this.contextProviderRef.setDirectCallCustomMessage(messages, action);
				break;
			case enums.ACTIONS["MESSAGE_SENT"]:
			case enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"]:
				this.contextProviderRef.setDirectCallCustomMessage(messages, action);
				break;
			default:
				break;
		}
	};

	callUser = args => {

		if(this.loggedInUser?.uid === args.uid) {
			return false;
		}	
		const call = new CometChat.Call(args.uid, CometChat.CALL_TYPE.VIDEO, CometChat.RECEIVER_TYPE.USER);
		CometChat.initiateCall(call)
			.then(outgoingCall => this.startCall(outgoingCall))
			.catch(error => console.error("CometChatWidget Error: ", error));
	};

	callGroup = args => {
		this.startDirectCall(args.guid);
	};

	startCall = outgoingCall => {
		this.setState({ callType: enums.CONSTANTS["OUTGOING_DEFAULT_CALLING"] });
		this.outgoingCallRef.startCall(outgoingCall);
		this.contextProviderRef.state.setCallInProgress(outgoingCall);
	};

	startDirectCall = sessionID => {
		this.setState({ callType: enums.CONSTANTS["OUTGOING_DIRECT_CALLING"] });
		//const sessionID = this.contextProviderRef.state.type === CometChat.ACTION_TYPE.TYPE_GROUP ? this.contextProviderRef.state.item.guid : null;
		this.outgoingDirectCallRef.startCall(sessionID);
	};

	joinDirectCall = () => {
		this.setState({ callType: enums.CONSTANTS["OUTGOING_DIRECT_CALLING"] });
		const sessionID = this.contextProviderRef.state.type === CometChat.ACTION_TYPE.TYPE_GROUP ? this.contextProviderRef.state.item.guid : null;
		this.outgoingDirectCallRef.joinCall(sessionID);
	};

	render() {
		const widgetSettings = Object.assign({}, this.props.settings, {
			launched: this.state.showEmbed,
			dockedview: this.state.dockedview,
			alignment: this.props.alignment,
			height: this.props.height,
			width: this.props.width,
		});

		let dockedLauncher = null;
		let EmbedView = null;
		if (this.state.dockedview === true) {
			dockedLauncher = <DockedLauncher {...this.props} theme={this.props.theme} lang={this.state.lang} messagelist={this.state.messagelist} active={this.state.showEmbed} clicked={this.activateChat} />;

			if (this.state.showEmbed !== null) {
				EmbedView = (
					<EmbedFrame
						{...this.props}
						ref={this.EmbedFrameRef}
						theme={this.props.theme}
						lang={this.state.lang}
						launched={this.state.showEmbed}
						isSidebarEnabled={this.isSidebarEnabled}
						widgetsettings={widgetSettings}
						actionGenerated={this.actionHandler}
						dockedview={this.state.dockedview}
					/>
				);
			}
		} else if (this.state.dockedview === false) {
			EmbedView = (
				<EmbedFrame
					{...this.props}
					ref={this.EmbedFrameRef}
					theme={this.props.theme}
					type={this.state.type}
					user={this.state.item}
					lang={this.state.lang}
					launched={this.state.showEmbed}
					isSidebarEnabled={this.isSidebarEnabled}
					widgetsettings={widgetSettings}
					actionGenerated={this.actionHandler}
				/>
			);
		}

		let incomingDirectCallAlertScreen = <CometChatIncomingDirectCall theme={this.props.theme} lang={this.state.lang} widgetsettings={widgetSettings} actionGenerated={this.actionHandler} />;

		let incomingCallAlertScreen = <CometChatIncomingCall theme={this.props.theme} lang={this.state.lang} widgetsettings={widgetSettings} actionGenerated={this.actionHandler} />;

		const outgoingCallScreenCache = createCache({
			key: "outgoingcall",
			stylisPlugins: [],
		});

		let outgoingCallScreen = (
			<CacheProvider value={outgoingCallScreenCache}>
				<CometChatOutgoingCall ref={el => (this.outgoingCallRef = el)} widgetsettings={widgetSettings} theme={this.props.theme} lang={this.state.lang} actionGenerated={this.actionHandler} />
			</CacheProvider>
		);

		const directCallScreenCache = createCache({
			key: "directcall",
			stylisPlugins: [],
		});

		let directCallScreen = (
			<CacheProvider value={directCallScreenCache}>
				<CometChatOutgoingDirectCall ref={el => (this.outgoingDirectCallRef = el)} widgetsettings={widgetSettings} theme={this.props.theme} lang={this.state.lang} actionGenerated={this.actionHandler} />
			</CacheProvider>
		);

		let toastNotificationPosition = "top-right";
		if (this.props.hasOwnProperty("docked") && (this.props.docked === true || this.props.docked === "true")) {
			if (this.props.hasOwnProperty("alignment") && this.props.alignment === "left") {
				toastNotificationPosition = "top-left";
			}
		}

		return (
			<div css={AppStyle(this.props)} className="app__wrapper">
				<CometChatContextProvider ref={el => (this.contextProviderRef = el)} _component={enums.CONSTANTS["EMBEDDED_COMPONENT"]} language={this.state.lang} toastNotificationPos={toastNotificationPosition}>
					{EmbedView}
					{dockedLauncher}
					{incomingDirectCallAlertScreen}
					{incomingCallAlertScreen}
					{outgoingCallScreen}
					{directCallScreen}
				</CometChatContextProvider>
			</div>
		);
	}

	componentWillUnmount() {
		this.appManager.removeListeners();
		this.appManager = null;
	}
}

// Specifies the default values for props:
App.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
};

App.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
};
