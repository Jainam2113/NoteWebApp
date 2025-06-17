
import root from '../root.svelte';
import { set_building } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	track_server_fetches: false,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\" class=\"%sveltekit.theme%\">\n<head>\n    <meta charset=\"utf-8\" />\n    <link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"description\" content=\"Advanced note-taking app with rich text editing and drawing capabilities\" />\n    <title>Advanced Notes App</title>\n\n    <!-- Preload fonts -->\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap\" rel=\"stylesheet\">\n\n    <!-- PWA Icons and Manifest -->\n    <link rel=\"manifest\" href=\"" + assets + "/manifest.json\">\n    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"" + assets + "/apple-touch-icon.png\">\n    <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"" + assets + "/favicon-32x32.png\">\n    <link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"" + assets + "/favicon-16x16.png\">\n    <link rel=\"mask-icon\" href=\"" + assets + "/safari-pinned-tab.svg\" color=\"#3b82f6\">\n\n    <!-- Meta tags -->\n    <meta name=\"theme-color\" content=\"#3b82f6\">\n    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n    <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">\n    <meta name=\"apple-mobile-web-app-title\" content=\"Notes\">\n\n    <!-- Open Graph -->\n    <meta property=\"og:title\" content=\"Advanced Notes App\">\n    <meta property=\"og:description\" content=\"A modern note-taking application with rich text editing and drawing capabilities\">\n    <meta property=\"og:type\" content=\"website\">\n    <meta property=\"og:image\" content=\"" + assets + "/og-image.png\">\n\n    <!-- Twitter Card -->\n    <meta name=\"twitter:card\" content=\"summary_large_image\">\n    <meta name=\"twitter:title\" content=\"Advanced Notes App\">\n    <meta name=\"twitter:description\" content=\"A modern note-taking application with rich text editing and drawing capabilities\">\n    <meta name=\"twitter:image\" content=\"" + assets + "/og-image.png\">\n\n    " + head + "\n</head>\n<body\n        data-sveltekit-preload-data=\"hover\"\n        class=\"antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200\"\n        style=\"font-family: 'Inter', system-ui, -apple-system, sans-serif;\"\n>\n<div style=\"display: contents\">" + body + "</div>\n\n<!-- Service worker registration with error handling -->\n<script>\n    if ('serviceWorker' in navigator) {\n        navigator.serviceWorker.register('/sw.js').catch(function(error) {\n            console.log('Service worker registration failed:', error);\n        });\n    }\n</script>\n</body>\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "3glsaj"
};

export function get_hooks() {
	return {};
}

export { set_assets, set_building, set_private_env, set_public_env };
