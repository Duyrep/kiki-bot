export interface QueueResponse {
	items: QueueItem[];
	autoPlaying: boolean;
	continuation: string;
}

export interface QueueItem {
	playlistPanelVideoWrapperRenderer?: PlaylistPanelVideoWrapperRenderer;
	playlistPanelVideoRenderer?: ItemPlaylistPanelVideoRenderer;
}

export interface ItemPlaylistPanelVideoRenderer {
	title: ShortBylineText;
	longBylineText: LongBylineText;
	thumbnail: PlaylistPanelVideoRendererThumbnail;
	lengthText: LengthText;
	selected: boolean;
	navigationEndpoint: PlaylistPanelVideoRendererNavigationEndpoint;
	videoId: string;
	shortBylineText: ShortBylineText;
	trackingParams: string;
	menu: PurpleMenu;
	playlistSetVideoId: string;
	canReorder: boolean;
	playlistEditParams: PlaylistEditParams;
	queueNavigationEndpoint: PurpleQueueNavigationEndpoint;
	badges?: Badge[];
}

export interface Badge {
	musicInlineBadgeRenderer: MusicInlineBadgeRenderer;
}

export interface MusicInlineBadgeRenderer {
	trackingParams: string;
	icon: Icon;
	accessibilityData: Accessibility;
}

export interface Accessibility {
	accessibilityData: AccessibilityData;
}

export interface AccessibilityData {
	label: string;
}

export interface Icon {
	iconType: IconType;
}

export enum IconType {
	AddToPlaylist = "ADD_TO_PLAYLIST",
	AddToRemoteQueue = "ADD_TO_REMOTE_QUEUE",
	Album = "ALBUM",
	Artist = "ARTIST",
	Bookmark = "BOOKMARK",
	BookmarkBorder = "BOOKMARK_BORDER",
	DismissQueue = "DISMISS_QUEUE",
	Favorite = "FAVORITE",
	Flag = "FLAG",
	Keep = "KEEP",
	KeepOff = "KEEP_OFF",
	Mix = "MIX",
	MusicExplicitBadge = "MUSIC_EXPLICIT_BADGE",
	PeopleGroup = "PEOPLE_GROUP",
	QueuePlayNext = "QUEUE_PLAY_NEXT",
	Remove = "REMOVE",
	RemoveFromPlaylist = "REMOVE_FROM_PLAYLIST",
	Share = "SHARE",
	Unfavorite = "UNFAVORITE",
}

export interface LengthText {
	runs: LengthTextRun[];
	accessibility: Accessibility;
}

export interface LengthTextRun {
	text: string;
}

export interface LongBylineText {
	runs?: LongBylineTextRun[];
}

export interface LongBylineTextRun {
	text: string;
	navigationEndpoint?: RunNavigationEndpoint;
}

export interface RunNavigationEndpoint {
	clickTrackingParams: string;
	browseEndpoint: BrowseEndpoint;
}

export interface BrowseEndpoint {
	browseId: string;
	browseEndpointContextSupportedConfigs: BrowseEndpointContextSupportedConfigs;
}

export interface BrowseEndpointContextSupportedConfigs {
	browseEndpointContextMusicConfig: BrowseEndpointContextMusicConfig;
}

export interface BrowseEndpointContextMusicConfig {
	pageType: PageType;
}

export enum PageType {
	MusicPageTypeAlbum = "MUSIC_PAGE_TYPE_ALBUM",
	MusicPageTypeArtist = "MUSIC_PAGE_TYPE_ARTIST",
	MusicPageTypeTrackCredits = "MUSIC_PAGE_TYPE_TRACK_CREDITS",
	MusicPageTypeUserChannel = "MUSIC_PAGE_TYPE_USER_CHANNEL",
}

export interface PurpleMenu {
	menuRenderer: PurpleMenuRenderer;
}

export interface PurpleMenuRenderer {
	items: PurpleItem[];
	trackingParams: string;
	accessibility: Accessibility;
}

export interface PurpleItem {
	menuNavigationItemRenderer?: MenuItemRenderer;
	menuServiceItemRenderer?: MenuItemRenderer;
	toggleMenuServiceItemRenderer?: PurpleToggleMenuServiceItemRenderer;
	menuServiceItemDownloadRenderer?: MenuServiceItemDownloadRenderer;
}

export interface MenuItemRenderer {
	text: ShortBylineText;
	icon: Icon;
	navigationEndpoint?: MenuNavigationItemRendererNavigationEndpoint;
	trackingParams: string;
	serviceEndpoint?: MenuNavigationItemRendererServiceEndpoint;
}

export interface MenuNavigationItemRendererNavigationEndpoint {
	clickTrackingParams: string;
	watchEndpoint?: PurpleWatchEndpoint;
	addToPlaylistEndpoint?: AddToPlaylistEndpoint;
	shareEntityEndpoint?: ShareEntityEndpoint;
	browseEndpoint?: BrowseEndpoint;
}

export interface AddToPlaylistEndpoint {
	videoId: string;
}

export interface ShareEntityEndpoint {
	serializedShareEntity: string;
	sharePanelType: SharePanelType;
}

export enum SharePanelType {
	SharePanelTypeUnifiedSharePanel = "SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL",
}

export interface PurpleWatchEndpoint {
	videoId: string;
	playlistId: string;
	params: WatchEndpointParams;
	loggingContext: LoggingContext;
	watchEndpointMusicSupportedConfigs: PurpleWatchEndpointMusicSupportedConfigs;
	playerParams?: PlayerParams;
}

export interface LoggingContext {
	vssLoggingContext: VssLoggingContext;
}

export interface VssLoggingContext {
	serializedContextData: string;
}

export enum WatchEndpointParams {
	WAEB = "wAEB",
}

export enum PlayerParams {
	The0GcJCZQAzrrq1RT = "0gcJCZQAzrrq_1rT",
}

export interface PurpleWatchEndpointMusicSupportedConfigs {
	watchEndpointMusicConfig: PurpleWatchEndpointMusicConfig;
}

export interface PurpleWatchEndpointMusicConfig {
	musicVideoType: MusicVideoType;
}

export enum MusicVideoType {
	MusicVideoTypeAtv = "MUSIC_VIDEO_TYPE_ATV",
	MusicVideoTypeOmv = "MUSIC_VIDEO_TYPE_OMV",
	MusicVideoTypeUgc = "MUSIC_VIDEO_TYPE_UGC",
}

export interface MenuNavigationItemRendererServiceEndpoint {
	clickTrackingParams: string;
	queueAddEndpoint?: ServiceEndpointQueueAddEndpoint;
	playlistEditEndpoint?: PlaylistEditEndpoint;
	removeFromQueueEndpoint?: RemoveFromQueueEndpoint;
	getReportFormEndpoint?: GetReportFormEndpoint;
	deletePlaylistEndpoint?: DeletePlaylistEndpoint;
}

export interface DeletePlaylistEndpoint {
	playlistId: PlaylistID;
	command: DeletePlaylistEndpointCommand;
}

export interface DeletePlaylistEndpointCommand {
	clickTrackingParams: string;
}

export enum PlaylistID {
	QPAPFtr6GAbNQxolV3K7Uf6UWFc8SJchXM = "QP-APFtr6GAbNQxolV3k7Uf6UWFc8SJchXM",
}

export interface GetReportFormEndpoint {
	params: string;
}

export interface PlaylistEditEndpoint {
	playlistId: PlaylistEditEndpointPlaylistID;
	actions: PlaylistEditEndpointAction[];
}

export interface PlaylistEditEndpointAction {
	setVideoId: string;
	action: ActionEnum;
	removedVideoId: string;
}

export enum ActionEnum {
	ActionRemoveVideo = "ACTION_REMOVE_VIDEO",
}

export enum PlaylistEditEndpointPlaylistID {
	PLodPdiR1DiHRMcHhTrLc3HiGUCpNuDyo = "PLodPdiR1DiHRMcHhTrLc3HiGUCp_nuDyo",
}

export interface ServiceEndpointQueueAddEndpoint {
	queueTarget: PurpleQueueTarget;
	queueInsertPosition: QueueInsertPosition;
	commands: CommandElement[];
}

export interface CommandElement {
	clickTrackingParams: string;
	addToToastAction: AddToToastAction;
}

export interface AddToToastAction {
	item: AddToToastActionItem;
}

export interface AddToToastActionItem {
	notificationTextRenderer: NotificationTextRenderer;
}

export interface NotificationTextRenderer {
	successResponseText: ShortBylineText;
	trackingParams: string;
}

export interface ShortBylineText {
	runs?: LengthTextRun[];
}

export enum QueueInsertPosition {
	InsertAfterCurrentVideo = "INSERT_AFTER_CURRENT_VIDEO",
	InsertAtEnd = "INSERT_AT_END",
}

export interface PurpleQueueTarget {
	videoId: string;
	onEmptyQueue: OnEmptyQueue;
	backingQueuePlaylistId?: PlaylistID;
}

export interface OnEmptyQueue {
	clickTrackingParams: string;
	watchEndpoint: AddToPlaylistEndpoint;
}

export interface RemoveFromQueueEndpoint {
	videoId: string;
	commands: CommandElement[];
	itemId: string;
}

export interface MenuServiceItemDownloadRenderer {
	serviceEndpoint: MenuServiceItemDownloadRendererServiceEndpoint;
	trackingParams: string;
}

export interface MenuServiceItemDownloadRendererServiceEndpoint {
	clickTrackingParams: string;
	offlineVideoEndpoint: OfflineVideoEndpoint;
}

export interface OfflineVideoEndpoint {
	videoId: string;
	onAddCommand: OnAddCommand;
}

export interface OnAddCommand {
	clickTrackingParams: string;
	getDownloadActionCommand: GetDownloadActionCommand;
}

export interface GetDownloadActionCommand {
	videoId: string;
	params: GetDownloadActionCommandParams;
}

export enum GetDownloadActionCommandParams {
	CAI3D = "CAI%3D",
}

export interface PurpleToggleMenuServiceItemRenderer {
	defaultText: ShortBylineText;
	defaultIcon: Icon;
	defaultServiceEndpoint: PurpleDefaultServiceEndpoint;
	toggledText: ShortBylineText;
	toggledIcon: Icon;
	toggledServiceEndpoint: PurpleToggledServiceEndpoint;
	trackingParams: string;
}

export interface PurpleDefaultServiceEndpoint {
	clickTrackingParams: string;
	likeEndpoint?: DefaultServiceEndpointLikeEndpoint;
	feedbackEndpoint?: FeedbackEndpoint;
}

export interface FeedbackEndpoint {
	feedbackToken: string;
}

export interface DefaultServiceEndpointLikeEndpoint {
	status: PurpleStatus;
	target: AddToPlaylistEndpoint;
	likeParams: LikeParams;
	actions?: LikeEndpointAction[];
}

export interface LikeEndpointAction {
	clickTrackingParams: string;
	musicLibraryStatusUpdateCommand: MusicLibraryStatusUpdateCommand;
}

export interface MusicLibraryStatusUpdateCommand {
	libraryStatus: LibraryStatus;
	addToLibraryFeedbackToken: string;
}

export enum LibraryStatus {
	MusicLibraryStatusInLibrary = "MUSIC_LIBRARY_STATUS_IN_LIBRARY",
}

export enum LikeParams {
	Oai3D = "OAI%3D",
}

export enum PurpleStatus {
	Like = "LIKE",
}

export interface PurpleToggledServiceEndpoint {
	clickTrackingParams: string;
	likeEndpoint?: ToggledServiceEndpointLikeEndpoint;
	feedbackEndpoint?: FeedbackEndpoint;
}

export interface ToggledServiceEndpointLikeEndpoint {
	status: FluffyStatus;
	target: AddToPlaylistEndpoint;
	removeLikeParams: LikeParams;
}

export enum FluffyStatus {
	Indifferent = "INDIFFERENT",
}

export interface PlaylistPanelVideoRendererNavigationEndpoint {
	clickTrackingParams: string;
	watchEndpoint: FluffyWatchEndpoint;
}

export interface FluffyWatchEndpoint {
	videoId: string;
	playlistId: PlaylistEditEndpointPlaylistID;
	index: number;
	params: string;
	playerParams: string;
	playlistSetVideoId: string;
	loggingContext: LoggingContext;
	watchEndpointMusicSupportedConfigs: FluffyWatchEndpointMusicSupportedConfigs;
}

export interface FluffyWatchEndpointMusicSupportedConfigs {
	watchEndpointMusicConfig: FluffyWatchEndpointMusicConfig;
}

export interface FluffyWatchEndpointMusicConfig {
	hasPersistentPlaylistPanel: boolean;
	musicVideoType: MusicVideoType;
}

export enum PlaylistEditParams {
	SiNRUC1BUEZ0CjZHQWJOUXhvbFYzazdVZjZVV0ZjOFNKY2HYTQ3D3D = "SiNRUC1BUEZ0cjZHQWJOUXhvbFYzazdVZjZVV0ZjOFNKY2hYTQ%3D%3D",
}

export interface PurpleQueueNavigationEndpoint {
	clickTrackingParams: string;
	queueAddEndpoint: PurpleQueueAddEndpoint;
}

export interface PurpleQueueAddEndpoint {
	queueTarget: FluffyQueueTarget;
	queueInsertPosition: QueueInsertPosition;
	params: QueueAddEndpointParams;
}

export enum QueueAddEndpointParams {
	Q0Fjjtne = "Q0FJJTNE",
}

export interface FluffyQueueTarget {
	videoId: string;
	backingQueuePlaylistId: PlaylistID;
}

export interface PlaylistPanelVideoRendererThumbnail {
	thumbnails: ThumbnailElement[];
}

export interface ThumbnailElement {
	url: string;
	width: number;
	height: number;
}

export interface PlaylistPanelVideoWrapperRenderer {
	primaryRenderer: PrimaryRenderer;
	counterpart: Counterpart[];
}

export interface Counterpart {
	counterpartRenderer: CounterpartRenderer;
	segmentMap: SegmentMap;
}

export interface CounterpartRenderer {
	playlistPanelVideoRenderer: CounterpartRendererPlaylistPanelVideoRenderer;
}

export interface CounterpartRendererPlaylistPanelVideoRenderer {
	title: ShortBylineText;
	longBylineText: LongBylineText;
	thumbnail: PlaylistPanelVideoRendererThumbnail;
	lengthText: LengthText;
	selected: boolean;
	navigationEndpoint: PlaylistPanelVideoRendererNavigationEndpoint;
	videoId: string;
	shortBylineText: ShortBylineText;
	trackingParams: string;
	menu: FluffyMenu;
	playlistSetVideoId: string;
	canReorder: boolean;
	playlistEditParams: PlaylistEditParams;
	queueNavigationEndpoint: FluffyQueueNavigationEndpoint;
}

export interface FluffyMenu {
	menuRenderer: FluffyMenuRenderer;
}

export interface FluffyMenuRenderer {
	items: FluffyItem[];
	trackingParams: string;
	accessibility: Accessibility;
}

export interface FluffyItem {
	menuNavigationItemRenderer?: MenuItemRenderer;
	menuServiceItemRenderer?: MenuItemRenderer;
	toggleMenuServiceItemRenderer?: FluffyToggleMenuServiceItemRenderer;
	menuServiceItemDownloadRenderer?: MenuServiceItemDownloadRenderer;
}

export interface FluffyToggleMenuServiceItemRenderer {
	defaultText: ShortBylineText;
	defaultIcon: Icon;
	defaultServiceEndpoint: FluffyDefaultServiceEndpoint;
	toggledText: ShortBylineText;
	toggledIcon: Icon;
	toggledServiceEndpoint: FluffyToggledServiceEndpoint;
	trackingParams: string;
}

export interface FluffyDefaultServiceEndpoint {
	clickTrackingParams: string;
	likeEndpoint: DefaultServiceEndpointLikeEndpoint;
}

export interface FluffyToggledServiceEndpoint {
	clickTrackingParams: string;
	likeEndpoint: ToggledServiceEndpointLikeEndpoint;
}

export interface FluffyQueueNavigationEndpoint {
	clickTrackingParams: string;
	queueAddEndpoint: FluffyQueueAddEndpoint;
}

export interface FluffyQueueAddEndpoint {
	queueTarget: AddToPlaylistEndpoint;
	queueInsertPosition: QueueInsertPosition;
	params: QueueAddEndpointParams;
}

export interface SegmentMap {
	segment?: Segment[];
}

export interface Segment {
	primaryVideoStartTimeMilliseconds: string;
	counterpartVideoStartTimeMilliseconds: string;
	durationMilliseconds: string;
}

export interface PrimaryRenderer {
	playlistPanelVideoRenderer: ItemPlaylistPanelVideoRenderer;
}
