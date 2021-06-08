interface Window {
	webkitAudioContext: typeof AudioContext
}

declare module "worker!*" {
	const Content: string;
	export default Content;
}