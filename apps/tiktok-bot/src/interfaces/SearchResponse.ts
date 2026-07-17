export interface SearchResponse {
	responseContext: ResponseContext;
	contents: Contents;
	trackingParams: string;
}

export interface Contents {
	tabbedSearchResultsRenderer: TabbedSearchResultsRenderer;
}

export interface TabbedSearchResultsRenderer {
	tabs: Tab[];
}

export interface Tab {
	tabRenderer: TabRenderer;
}

export interface TabRenderer {
	title: string;
	selected?: boolean;
	content: TabRendererContent;
	tabIdentifier: string;
	trackingParams: string;
	endpoint?: Endpoint;
}

export interface TabRendererContent {
	sectionListRenderer: SectionListRenderer;
}

export interface SectionListRenderer {
	contents?: SectionListRendererContent[];
	trackingParams: string;
	header?: Header;
	continuations?: Continuation[];
}

export interface SectionListRendererContent {
	musicCardShelfRenderer?: MusicCardShelfRenderer;
	itemSectionRenderer?: ItemSectionRenderer;
}

export interface ItemSectionRenderer {
	contents: ItemSectionRendererContent[];
	trackingParams: string;
}

export interface ItemSectionRendererContent {
	musicResponsiveListItemRenderer: PurpleMusicResponsiveListItemRenderer;
}

export interface PurpleMusicResponsiveListItemRenderer {
	trackingParams: string;
	thumbnail: MusicResponsiveListItemRendererThumbnail;
	overlay?: PurpleOverlay;
	flexColumns: FlexColumn[];
	menu: PurpleMenu;
	playlistItemData?: PlaylistItemData;
	flexColumnDisplayStyle: string;
	itemHeight: ItemHeight;
	navigationEndpoint?: MusicResponsiveListItemRendererNavigationEndpoint;
}

export interface FlexColumn {
	musicResponsiveListItemFlexColumnRenderer: MusicResponsiveListItemFlexColumnRenderer;
}

export interface MusicResponsiveListItemFlexColumnRenderer {
	text: MusicResponsiveListItemFlexColumnRendererText;
	displayPriority: DisplayPriority;
}

export enum DisplayPriority {
	MusicResponsiveListItemColumnDisplayPriorityHigh = "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH",
}

export interface MusicResponsiveListItemFlexColumnRendererText {
	runs: PurpleRun[];
	accessibility?: AccessibilityPauseDataClass;
}

export interface AccessibilityPauseDataClass {
	accessibilityData: AccessibilityAccessibilityData;
}

export interface AccessibilityAccessibilityData {
	label: string;
}

export interface PurpleRun {
	text: string;
	navigationEndpoint?: PurpleNavigationEndpoint;
}

export interface PurpleNavigationEndpoint {
	clickTrackingParams: string;
	watchEndpoint?: PurpleWatchEndpoint;
	browseEndpoint?: BrowseEndpoint;
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
	MusicPageTypeNonMusicAudioTrackPage = "MUSIC_PAGE_TYPE_NON_MUSIC_AUDIO_TRACK_PAGE",
	MusicPageTypePlaylist = "MUSIC_PAGE_TYPE_PLAYLIST",
	MusicPageTypePodcastShowDetailPage = "MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE",
	MusicPageTypeTrackCredits = "MUSIC_PAGE_TYPE_TRACK_CREDITS",
	MusicPageTypeUserChannel = "MUSIC_PAGE_TYPE_USER_CHANNEL",
}

export interface PurpleWatchEndpoint {
	videoId: string;
	watchEndpointMusicSupportedConfigs: WatchEndpointMusicSupportedConfigs;
}

export interface WatchEndpointMusicSupportedConfigs {
	watchEndpointMusicConfig: WatchEndpointMusicConfig;
}

export interface WatchEndpointMusicConfig {
	musicVideoType: MusicVideoType;
}

export enum MusicVideoType {
	MusicVideoTypeAtv = "MUSIC_VIDEO_TYPE_ATV",
	MusicVideoTypeOfficialSourceMusic = "MUSIC_VIDEO_TYPE_OFFICIAL_SOURCE_MUSIC",
	MusicVideoTypeOmv = "MUSIC_VIDEO_TYPE_OMV",
	MusicVideoTypePodcastEpisode = "MUSIC_VIDEO_TYPE_PODCAST_EPISODE",
	MusicVideoTypeUgc = "MUSIC_VIDEO_TYPE_UGC",
}

export enum ItemHeight {
	MusicResponsiveListItemHeightTall = "MUSIC_RESPONSIVE_LIST_ITEM_HEIGHT_TALL",
}

export interface PurpleMenu {
	menuRenderer: PurpleMenuRenderer;
}

export interface PurpleMenuRenderer {
	items: PurpleItem[];
	trackingParams: string;
	accessibility: AccessibilityPauseDataClass;
	topLevelButtons?: TopLevelButton[];
}

export interface PurpleItem {
	menuNavigationItemRenderer?: MenuItemRenderer;
	menuServiceItemRenderer?: MenuItemRenderer;
	toggleMenuServiceItemRenderer?: PurpleToggleMenuServiceItemRenderer;
	menuServiceItemDownloadRenderer?: MenuServiceItemDownloadRenderer;
}

export interface MenuItemRenderer {
	text: DefaultTextClass;
	icon: Icon;
	navigationEndpoint?: MenuNavigationItemRendererNavigationEndpoint;
	trackingParams: string;
	serviceEndpoint?: MenuNavigationItemRendererServiceEndpoint;
}

export interface Icon {
	iconType: string;
}

export interface MenuNavigationItemRendererNavigationEndpoint {
	clickTrackingParams: string;
	watchEndpoint?: FluffyWatchEndpoint;
	addToPlaylistEndpoint?: AddToPlaylistEndpoint;
	browseEndpoint?: BrowseEndpoint;
	shareEntityEndpoint?: ShareEntityEndpoint;
	watchPlaylistEndpoint?: WatchPlaylistEndpoint;
}

export interface AddToPlaylistEndpoint {
	videoId?: string;
	playlistId?: string;
}

export interface ShareEntityEndpoint {
	serializedShareEntity: string;
	sharePanelType: SharePanelType;
}

export enum SharePanelType {
	SharePanelTypeUnifiedSharePanel = "SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL",
}

export interface FluffyWatchEndpoint {
	videoId: string;
	playlistId: string;
	params: WatchEndpointParams;
	loggingContext: LoggingContext;
	watchEndpointMusicSupportedConfigs: WatchEndpointMusicSupportedConfigs;
	playerParams?: string;
}

export interface LoggingContext {
	vssLoggingContext: VssLoggingContext;
}

export interface VssLoggingContext {
	serializedContextData: string;
}

export enum WatchEndpointParams {
	WAEB = "wAEB",
	WAEB8GECGAE3D = "wAEB8gECGAE%3D",
	WAEB8GECKAE3D = "wAEB8gECKAE%3D",
}

export interface WatchPlaylistEndpoint {
	playlistId: string;
	params?: WatchEndpointParams;
}

export interface MenuNavigationItemRendererServiceEndpoint {
	clickTrackingParams: string;
	queueAddEndpoint: QueueAddEndpoint;
}

export interface QueueAddEndpoint {
	queueTarget: QueueTarget;
	queueInsertPosition: QueueInsertPosition;
	commands: QueueAddEndpointCommand[];
}

export interface QueueAddEndpointCommand {
	clickTrackingParams: string;
	addToToastAction: CommandAddToToastAction;
}

export interface CommandAddToToastAction {
	item: FluffyItem;
}

export interface FluffyItem {
	notificationTextRenderer: NotificationTextRenderer;
}

export interface NotificationTextRenderer {
	successResponseText: DefaultTextClass;
	trackingParams: string;
}

export interface DefaultTextClass {
	runs: DefaultTextRun[];
}

export interface DefaultTextRun {
	text: string;
}

export enum QueueInsertPosition {
	InsertAfterCurrentVideo = "INSERT_AFTER_CURRENT_VIDEO",
	InsertAtEnd = "INSERT_AT_END",
}

export interface QueueTarget {
	videoId?: string;
	onEmptyQueue: OnEmptyQueue;
	playlistId?: string;
}

export interface OnEmptyQueue {
	clickTrackingParams: string;
	watchEndpoint: AddToPlaylistEndpoint;
}

export interface MenuServiceItemDownloadRenderer {
	serviceEndpoint: MenuServiceItemDownloadRendererServiceEndpoint;
	trackingParams: string;
	badgeIcon?: Icon;
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
	defaultText: DefaultTextClass;
	defaultIcon: Icon;
	defaultServiceEndpoint: PurpleDefaultServiceEndpoint;
	toggledText: DefaultTextClass;
	toggledIcon: Icon;
	toggledServiceEndpoint: ToggledServiceEndpoint;
	trackingParams: string;
	isToggled?: boolean;
}

export interface PurpleDefaultServiceEndpoint {
	clickTrackingParams: string;
	feedbackEndpoint?: PurpleFeedbackEndpoint;
	likeEndpoint?: PurpleLikeEndpoint;
	commandExecutorCommand?: CommandExecutorCommand;
}

export interface CommandExecutorCommand {
	commands: CommandExecutorCommandCommand[];
}

export interface CommandExecutorCommandCommand {
	clickTrackingParams: string;
	playlistEditEndpoint: CommandPlaylistEditEndpoint;
}

export interface CommandPlaylistEditEndpoint {
	playlistId: string;
	actions: PurpleAction[];
	params: string;
}

export interface PurpleAction {
	action: string;
	suppressSuccessToast?: boolean;
	addedVideoId?: string;
	dedupeOption?: string;
	addedVideoPositionIfManualSort?: number;
}

export interface PurpleFeedbackEndpoint {
	feedbackToken: string;
	actions?: FeedbackEndpointAction[];
}

export interface FeedbackEndpointAction {
	clickTrackingParams: string;
	addToToastAction: ActionAddToToastAction;
}

export interface ActionAddToToastAction {
	item: TentacledItem;
}

export interface TentacledItem {
	notificationActionRenderer: NotificationActionRenderer;
}

export interface NotificationActionRenderer {
	responseText: DefaultTextClass;
	trackingParams: string;
}

export interface PurpleLikeEndpoint {
	status: Status;
	target: AddToPlaylistEndpoint;
	actions?: LikeEndpointAction[];
}

export interface LikeEndpointAction {
	clickTrackingParams: string;
	musicLibraryStatusUpdateCommand: MusicLibraryStatusUpdateCommand;
}

export interface MusicLibraryStatusUpdateCommand {
	libraryStatus: string;
	addToLibraryFeedbackToken: string;
}

export enum Status {
	Dislike = "DISLIKE",
	Indifferent = "INDIFFERENT",
	Like = "LIKE",
}

export interface ToggledServiceEndpoint {
	clickTrackingParams: string;
	feedbackEndpoint?: PurpleFeedbackEndpoint;
	likeEndpoint?: FluffyLikeEndpoint;
	playlistEditEndpoint?: ToggledServiceEndpointPlaylistEditEndpoint;
}

export interface FluffyLikeEndpoint {
	status: Status;
	target: AddToPlaylistEndpoint;
}

export interface ToggledServiceEndpointPlaylistEditEndpoint {
	playlistId: string;
	actions: FluffyAction[];
	params: string;
}

export interface FluffyAction {
	action: string;
	removedVideoId?: string;
	suppressSuccessToast?: boolean;
}

export interface TopLevelButton {
	likeButtonRenderer: LikeButtonRenderer;
}

export interface LikeButtonRenderer {
	target: PlaylistItemData;
	likeStatus: Status;
	trackingParams: string;
	likesAllowed: boolean;
	serviceEndpoints: ServiceEndpointElement[];
}

export interface ServiceEndpointElement {
	clickTrackingParams: string;
	likeEndpoint: ServiceEndpointLikeEndpoint;
}

export interface ServiceEndpointLikeEndpoint {
	status: Status;
	target: PlaylistItemData;
}

export interface PlaylistItemData {
	videoId: string;
}

export interface MusicResponsiveListItemRendererNavigationEndpoint {
	clickTrackingParams: string;
	browseEndpoint: BrowseEndpoint;
}

export interface PurpleOverlay {
	musicItemThumbnailOverlayRenderer: PurpleMusicItemThumbnailOverlayRenderer;
}

export interface PurpleMusicItemThumbnailOverlayRenderer {
	background: Background;
	content: PurpleContent;
	contentPosition: ContentPosition;
	displayStyle: DisplayStyle;
}

export interface Background {
	verticalGradient: VerticalGradient;
}

export interface VerticalGradient {
	gradientLayerColors: string[];
}

export interface PurpleContent {
	musicPlayButtonRenderer: PurpleMusicPlayButtonRenderer;
}

export interface PurpleMusicPlayButtonRenderer {
	playNavigationEndpoint: PlayNavigationEndpoint;
	trackingParams: string;
	playIcon: Icon;
	pauseIcon: Icon;
	iconColor: number;
	backgroundColor: number;
	activeBackgroundColor: number;
	loadingIndicatorColor: number;
	playingIcon: Icon;
	iconLoadingColor: number;
	activeScaleFactor: number;
	buttonSize: ButtonSize;
	rippleTarget: RippleTarget;
	accessibilityPlayData: AccessibilityPauseDataClass;
	accessibilityPauseData: AccessibilityPauseDataClass;
}

export enum ButtonSize {
	MusicPlayButtonSizeSmall = "MUSIC_PLAY_BUTTON_SIZE_SMALL",
}

export interface PlayNavigationEndpoint {
	clickTrackingParams: string;
	watchEndpoint?: CommandWatchEndpoint;
	watchPlaylistEndpoint?: WatchPlaylistEndpoint;
}

export interface CommandWatchEndpoint {
	videoId: string;
	watchEndpointMusicSupportedConfigs: WatchEndpointMusicSupportedConfigs;
	playerParams?: string;
	params?: string;
}

export enum RippleTarget {
	MusicPlayButtonRippleTargetSelf = "MUSIC_PLAY_BUTTON_RIPPLE_TARGET_SELF",
}

export enum ContentPosition {
	MusicItemThumbnailOverlayContentPositionCentered = "MUSIC_ITEM_THUMBNAIL_OVERLAY_CONTENT_POSITION_CENTERED",
}

export enum DisplayStyle {
	MusicItemThumbnailOverlayDisplayStylePersistent = "MUSIC_ITEM_THUMBNAIL_OVERLAY_DISPLAY_STYLE_PERSISTENT",
}

export interface MusicResponsiveListItemRendererThumbnail {
	musicThumbnailRenderer: MusicThumbnailRenderer;
}

export interface MusicThumbnailRenderer {
	thumbnail: MusicThumbnailRendererThumbnail;
	thumbnailCrop: ThumbnailCrop;
	thumbnailScale: ThumbnailScale;
	trackingParams: string;
}

export interface MusicThumbnailRendererThumbnail {
	thumbnails: ThumbnailElement[];
}

export interface ThumbnailElement {
	url: string;
	width: number;
	height: number;
}

export enum ThumbnailCrop {
	MusicThumbnailCropCircle = "MUSIC_THUMBNAIL_CROP_CIRCLE",
	MusicThumbnailCropUnspecified = "MUSIC_THUMBNAIL_CROP_UNSPECIFIED",
}

export enum ThumbnailScale {
	MusicThumbnailScaleAspectFill = "MUSIC_THUMBNAIL_SCALE_ASPECT_FILL",
	MusicThumbnailScaleAspectFit = "MUSIC_THUMBNAIL_SCALE_ASPECT_FIT",
}

export interface MusicCardShelfRenderer {
	trackingParams: string;
	thumbnail: MusicResponsiveListItemRendererThumbnail;
	title: Title;
	subtitle: Subtitle;
	contents: MusicCardShelfRendererContent[];
	buttons: Button[];
	menu: MusicCardShelfRendererMenu;
	onTap: OnTap;
	thumbnailOverlay: ThumbnailOverlay;
}

export interface Button {
	buttonRenderer: ButtonRenderer;
}

export interface ButtonRenderer {
	style: string;
	size?: string;
	isDisabled?: boolean;
	text: DefaultTextClass;
	icon: Icon;
	accessibility: AccessibilityAccessibilityData;
	trackingParams: string;
	accessibilityData: AccessibilityPauseDataClass;
	command: ButtonRendererCommand;
}

export interface ButtonRendererCommand {
	clickTrackingParams: string;
	watchEndpoint?: CommandWatchEndpoint;
	addToPlaylistEndpoint?: PlaylistItemData;
}

export interface MusicCardShelfRendererContent {
	messageRenderer?: MessageRenderer;
	musicResponsiveListItemRenderer?: FluffyMusicResponsiveListItemRenderer;
}

export interface MessageRenderer {
	text: DefaultTextClass;
	trackingParams: string;
	style: MessageRendererStyle;
}

export interface MessageRendererStyle {
	value: string;
}

export interface FluffyMusicResponsiveListItemRenderer {
	trackingParams: string;
	thumbnail: MusicResponsiveListItemRendererThumbnail;
	overlay: FluffyOverlay;
	flexColumns: FlexColumn[];
	menu: FluffyMenu;
	playlistItemData: PlaylistItemData;
	flexColumnDisplayStyle: string;
	itemHeight: ItemHeight;
}

export interface FluffyMenu {
	menuRenderer: FluffyMenuRenderer;
}

export interface FluffyMenuRenderer {
	items: StickyItem[];
	trackingParams: string;
	accessibility: AccessibilityPauseDataClass;
}

export interface StickyItem {
	menuNavigationItemRenderer?: MenuItemRenderer;
	menuServiceItemRenderer?: MenuItemRenderer;
	toggleMenuServiceItemRenderer?: FluffyToggleMenuServiceItemRenderer;
	menuServiceItemDownloadRenderer?: MenuServiceItemDownloadRenderer;
}

export interface FluffyToggleMenuServiceItemRenderer {
	defaultText: DefaultTextClass;
	defaultIcon: Icon;
	defaultServiceEndpoint: ServiceEndpoint;
	toggledText: DefaultTextClass;
	toggledIcon: Icon;
	toggledServiceEndpoint: ServiceEndpoint;
	trackingParams: string;
}

export interface ServiceEndpoint {
	clickTrackingParams: string;
	likeEndpoint?: ServiceEndpointLikeEndpoint;
	feedbackEndpoint?: FluffyFeedbackEndpoint;
}

export interface FluffyFeedbackEndpoint {
	feedbackToken: string;
}

export interface FluffyOverlay {
	musicItemThumbnailOverlayRenderer: FluffyMusicItemThumbnailOverlayRenderer;
}

export interface FluffyMusicItemThumbnailOverlayRenderer {
	background: Background;
	content: FluffyContent;
	contentPosition: ContentPosition;
	displayStyle: DisplayStyle;
}

export interface FluffyContent {
	musicPlayButtonRenderer: FluffyMusicPlayButtonRenderer;
}

export interface FluffyMusicPlayButtonRenderer {
	playNavigationEndpoint: OnTap;
	trackingParams: string;
	playIcon: Icon;
	pauseIcon: Icon;
	iconColor: number;
	backgroundColor: number;
	activeBackgroundColor: number;
	loadingIndicatorColor: number;
	playingIcon: Icon;
	iconLoadingColor: number;
	activeScaleFactor: number;
	buttonSize: ButtonSize;
	rippleTarget: RippleTarget;
	accessibilityPlayData: AccessibilityPauseDataClass;
	accessibilityPauseData: AccessibilityPauseDataClass;
}

export interface OnTap {
	clickTrackingParams: string;
	watchEndpoint: CommandWatchEndpoint;
}

export interface MusicCardShelfRendererMenu {
	menuRenderer: TentacledMenuRenderer;
}

export interface TentacledMenuRenderer {
	items: IndigoItem[];
	trackingParams: string;
	accessibility: AccessibilityPauseDataClass;
}

export interface IndigoItem {
	menuNavigationItemRenderer?: MenuItemRenderer;
	menuServiceItemRenderer?: MenuItemRenderer;
	toggleMenuServiceItemRenderer?: TentacledToggleMenuServiceItemRenderer;
	menuServiceItemDownloadRenderer?: MenuServiceItemDownloadRenderer;
}

export interface TentacledToggleMenuServiceItemRenderer {
	defaultText: DefaultTextClass;
	defaultIcon: Icon;
	defaultServiceEndpoint: FluffyDefaultServiceEndpoint;
	toggledText: DefaultTextClass;
	toggledIcon: Icon;
	toggledServiceEndpoint: ServiceEndpoint;
	trackingParams: string;
}

export interface FluffyDefaultServiceEndpoint {
	clickTrackingParams: string;
	feedbackEndpoint?: FluffyFeedbackEndpoint;
	likeEndpoint?: TentacledLikeEndpoint;
}

export interface TentacledLikeEndpoint {
	status: Status;
	target: PlaylistItemData;
	actions: LikeEndpointAction[];
}

export interface Subtitle {
	runs: SubtitleRun[];
	accessibility: AccessibilityPauseDataClass;
}

export interface SubtitleRun {
	text: string;
	navigationEndpoint?: MusicResponsiveListItemRendererNavigationEndpoint;
}

export interface ThumbnailOverlay {
	musicItemThumbnailOverlayRenderer: ThumbnailOverlayMusicItemThumbnailOverlayRenderer;
}

export interface ThumbnailOverlayMusicItemThumbnailOverlayRenderer {
	background: Background;
	content: TentacledContent;
	contentPosition: ContentPosition;
	displayStyle: DisplayStyle;
}

export interface TentacledContent {
	musicPlayButtonRenderer: TentacledMusicPlayButtonRenderer;
}

export interface TentacledMusicPlayButtonRenderer {
	playNavigationEndpoint: NavigationEndpoint;
	trackingParams: string;
	playIcon: Icon;
	pauseIcon: Icon;
	iconColor: number;
	backgroundColor: number;
	activeBackgroundColor: number;
	loadingIndicatorColor: number;
	playingIcon: Icon;
	iconLoadingColor: number;
	activeScaleFactor: number;
	buttonSize: string;
	rippleTarget: RippleTarget;
	accessibilityPlayData: AccessibilityPauseDataClass;
	accessibilityPauseData: AccessibilityPauseDataClass;
}

export interface NavigationEndpoint {
	clickTrackingParams: string;
	watchEndpoint: PurpleWatchEndpoint;
}

export interface Title {
	runs: TitleRun[];
}

export interface TitleRun {
	text: string;
	navigationEndpoint: NavigationEndpoint;
}

export interface Continuation {
	reloadContinuationData: ReloadContinuationData;
}

export interface ReloadContinuationData {
	continuation: string;
	clickTrackingParams: string;
}

export interface Header {
	chipCloudRenderer: ChipCloudRenderer;
}

export interface ChipCloudRenderer {
	chips: Chip[];
	collapsedRowCount: number;
	trackingParams: string;
	horizontalScrollable: boolean;
}

export interface Chip {
	chipCloudChipRenderer: ChipCloudChipRenderer;
}

export interface ChipCloudChipRenderer {
	style: ChipCloudChipRendererStyle;
	text: DefaultTextClass;
	navigationEndpoint: Endpoint;
	trackingParams: string;
	accessibilityData: AccessibilityPauseDataClass;
	isSelected: boolean;
	uniqueId: string;
}

export interface Endpoint {
	clickTrackingParams: string;
	searchEndpoint: SearchEndpoint;
}

export interface SearchEndpoint {
	query: Query;
	params: string;
}

export enum Query {
	TheLampIsLow = "the lamp is low",
}

export interface ChipCloudChipRendererStyle {
	styleType: string;
}

export interface ResponseContext {
	serviceTrackingParams: ServiceTrackingParam[];
	maxAgeSeconds: number;
	responseId: string;
}

export interface ServiceTrackingParam {
	service: string;
	params: Param[];
}

export interface Param {
	key: string;
	value: string;
}
