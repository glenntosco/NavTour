/**
 * NavTour Extension Constants — mirrors Navattic's constant architecture
 */

// Storage key prefix for all NavTour data
export const STORAGE_PREFIX = '__NAVTOUR_FLOW__';

// Session storage keys
export const CAPTURE_OPEN_KEY = `${STORAGE_PREFIX}__CAPTURE_OPEN__`;
export const CAPTURE_MODE_KEY = '__NAVTOUR____CAPTURE_MODE__';
export const CAPTURING_ENABLED_KEY = 'navtour:capturing-enabled';
export const CLICK_TO_CAPTURE_PAUSED_KEY = 'navtour:click-to-capture-paused';
export const SANDBOX_HIGHLIGHTS_DISABLED_KEY = 'navtour:sandbox-highlights-disabled';
export const VIDEO_CAPTURE_KEY = 'navtour:video-capture';
export const GENERATE_SANDBOX_KEY = 'navtour:generate-sandbox';
export const SERVICE_WORKER_DOWNLOADS_KEY = 'navtour:service-worker-downloads-enabled';
export const DOWNLOAD_RESTRICTIONS_KEY = 'navtour:enable-download-restrictions';

// Window globals
export const ADD_WINDOW_LISTENERS = '__nv_add_window_listeners';
export const MESSAGE_ID_KEY = '__nv_message_id';
export const DYNAMIC_STYLE_TEXT = '__nv_dynamic_style_text';
export const DYNAMIC_STYLE_UPDATES = '__nv_dynamic_style_updates';
export const DYNAMIC_STYLE_MAP = '__nv_dynamic_style_map';
export const SHADOW_ID_ATTR = 'data-nv-shadow-id';
export const SHADOW_COUNTER = '__nv_shadow_counter';
export const NATIVE_FUNCTIONS = '__nv_native_functions';
export const INJECTED_FONTS = '__nv_injected_fonts';
export const SERIALIZED_INJECTED_FONTS = '__nv_serialized_injected_fonts';
export const IS_SALESFORCE = '__nv_is_salesforce';
export const NODE_REF = Symbol('nv_node_ref');

// NavTour JS marker
export const NAVTOUR_JS_PREFIX = '__NAVTOUR_JS__';
export const CSP_TAB_KEY = `${NAVTOUR_JS_PREFIX}__CSP_TAB_`;
export const ACTIVE_TAB_KEY = `${NAVTOUR_JS_PREFIX}__ACTIVE_TAB__`;

// Allowed origins for externally_connectable
export const ALLOWED_ORIGINS = [
  'http://localhost:5017',
  'http://localhost:3000',
  'https://navtour.cloud',
  'https://app.navtour.cloud',
];

// Feature flags
export const FeatureFlags = {
  AbTesting: 'AB_TESTING',
  AiCloning: 'AI_CLONING',
  Collaboration: 'COLLABORATION',
  Copilot: 'COPILOT',
  CopilotCaptureEdit: 'COPILOT_CAPTURE_EDIT',
  CopilotGenerateDemo: 'COPILOT_GENERATE_DEMO',
  CopilotGenerateSandbox: 'COPILOT_GENERATE_SANDBOX',
  DemoBuilder: 'DEMO_BUILDER',
  DemoTemplates: 'DEMO_TEMPLATES',
  DevToolEdits: 'DEV_TOOL_EDITS',
  ForceHover: 'FORCE_HOVER',
  Multilingual: 'MULTILINGUAL',
  Offline: 'OFFLINE',
  Sandbox: 'SANDBOX',
  ServiceWorkerDownloads: 'SERVICE_WORKER_DOWNLOADS',
  StitchCaptures: 'STITCH_CAPTURES',
  TooltipPreview: 'TOOLTIP_PREVIEW',
  ZoomIn: 'ZOOM_IN',
} as const;

// API URLs
export const API_URLS = {
  APP_URL: {
    PROD: 'https://navtour.cloud',
    DEV: 'http://localhost:5017',
  },
  API: {
    PROD: 'https://navtour.cloud/api/v1',
    DEV: 'http://localhost:5017/api/v1',
  },
} as const;

// Extension environment — detect dev by checking if running on localhost
export const IS_DEV = typeof location !== 'undefined' && location.hostname === 'localhost';

export function getApiUrl(): string {
  return IS_DEV ? API_URLS.API.DEV : API_URLS.API.PROD;
}

export function getAppUrl(): string {
  return IS_DEV ? API_URLS.APP_URL.DEV : API_URLS.APP_URL.PROD;
}
