interface Window {
	webkitAudioContext: typeof AudioContext
}

// declare module 'opus-recorder/dist/recorder.min.js';
declare module "worker!*" {
	const Content: string;
	export default Content;
}