class App {
    handlePostUpload;
    splutter;
    urls;
    channels;
    info;
    captureButton;
    static init() {
        new App();
    }
    constructor() {
        this.urls = [];
        this._startCapture = this._startCapture.bind(this);
        this._getDeviceInfo = this._getDeviceInfo.bind(this);
        this.handleStartCapture = this.handleStartCapture.bind(this);
        this.handleStopCapture = this.handleStopCapture.bind(this);
        this.captureButtonClick = this.captureButtonClick.bind(this);
        const [channels, info, captureButton] = this.setUI();
        this.captureButton = captureButton;
        this.channels = channels;
        this.info = info;
        this.handlePostUpload = false;
    }
    existsOrThrow(item, selector) {
        if (!item) {
            throw Error(`No item ${selector}`);
        }
        return item;
    }
    getEl(selector) {
        return this.existsOrThrow(document.querySelector(selector), selector);
    }
    setUI() {
        const captureButton = this.getEl(`#capture`);
        captureButton.addEventListener(`click`, () => this.captureButtonClick());
        const channels = this.getEl(`#channels`);
        const info = this.getEl(`#info`);
        return [channels, info, captureButton];
    }
    div() {
        return document.createElement(`div`);
    }
    btn() {
        return document.createElement(`button`);
    }
    captureButtonClick() {
        if (this.captureButton.dataset.state === `inactive`) {
            this.handleStartCapture()
                .then(channels => {
                if (channels) {
                    this._getDeviceInfo();
                    this.captureButton.dataset.state = `active`;
                    this.captureButton.textContent = `Stop Capture`;
                }
            });
        }
        else {
            this.handleStopCapture();
            this.noCaptureUI();
        }
    }
    createRecord(channel) {
        const channelButton = this.btn();
        channelButton.dataset.state = `inactive`;
        channelButton.textContent = `Record ${channel}`;
        channelButton.addEventListener(`click`, () => {
            if (!this.splutter) {
                throw Error(`Splutter library failed to load.`);
            }
            if (channelButton.dataset.state === `inactive`) {
                this.splutter.recordInputChannel(channel);
                channelButton.dataset.state = `active`;
                channelButton.textContent = `Stop Record ${channel}`;
            }
            else {
                this.splutter.stopRecordInputChannel(channel);
                channelButton.dataset.state = `inactive`;
                channelButton.textContent = `Record ${channel}`;
            }
        });
        return channelButton;
    }
    createOutput(inputChannel, outputChannel) {
        const outputButton = this.btn();
        outputButton.dataset.state = `inactive`;
        outputButton.textContent = `Listen on ${outputChannel}`;
        outputButton.addEventListener(`click`, () => {
            if (!this.splutter) {
                throw Error(`Splutter library failed to load.`);
            }
            if (outputButton.dataset.state === `inactive`) {
                this.splutter.unmuteOutputChannelForInputChannel(inputChannel, outputChannel);
                outputButton.dataset.state = `active`;
                outputButton.textContent = `Mute on ${outputChannel}`;
            }
            else {
                this.splutter.muteOutputChannelForInputChannel(inputChannel, outputChannel);
                outputButton.dataset.state = `inactive`;
                outputButton.textContent = `Listen on ${outputChannel}`;
            }
        });
        return outputButton;
    }
    _getDeviceInfo() {
        if (!this.splutter) {
            throw Error(`Splutter library failed to load.`);
        }
        const { id, outputChannels, inputChannels, label } = this.splutter.inputDeviceInformation();
        this.info.textContent = `Device ID: ${id}\nDevice label: ${label}`;
        for (let i = 0; i < inputChannels; i++) {
            const ch = this.div();
            ch.appendChild(this.createRecord(i));
            for (let o = 0; o < outputChannels; o++) {
                ch.appendChild(this.createOutput(i, o));
            }
            this.urls[i] = [new URL(`/uploadAudio`, window.location.origin)];
            this.channels.appendChild(ch);
        }
    }
    async _startCapture() {
        if (!this.splutter) {
            throw Error(`Splutter library failed to load.`);
        }
        return this.splutter.startCapture();
    }
    async handleStartCapture() {
        if (!this.splutter) {
            return import(`../build/splutter.js`).then(({ Splutter }) => {
                this.splutter = new Splutter(this);
                return this._startCapture();
            });
        }
        else {
            return this._startCapture();
        }
    }
    handleStopCapture() {
        if (!this.splutter) {
            throw Error(`Splutter library failed to load.`);
        }
        this.splutter.stopCapture();
    }
    noCaptureUI() {
        this.captureButton.dataset.state = `inactive`;
        this.captureButton.textContent = `Start Capture`;
        this.channels.innerHTML = ``;
        this.info.textContent = ``;
    }
    onDevicePermissionRemoved() {
        this.noCaptureUI();
    }
    onWarning(message) {
        console.warn(message);
    }
    getStreamURLsForChannel(channel) {
        return this.urls[channel];
    }
    onUploaded(data, form, channel) {
        // console.log( data, form, channel )
    }
    onFailure(error) {
        throw error;
    }
}
App.init();
export {};
