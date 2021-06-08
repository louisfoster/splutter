export declare enum ChannelState {
    connecting = 0,
    connected = 1,
    outputting = 2,
    recording = 3,
    outputtingAndRecording = 4
}
export interface ChannelStateChangeListener {
    onChannelStateChange?: (channel: number, state: ChannelState) => void;
}
export declare class Channel {
    index: number;
    private stateListener;
    private onChunk;
    input: BiquadFilterNode;
    output: ScriptProcessorNode;
    private state;
    private emptyBuffer;
    private unmutedStates;
    private recordingStates;
    constructor(index: number, stateListener: ChannelStateChangeListener, onChunk: (chunk: Float32Array, channelIndex: number) => void, context: AudioContext, bufferSize: number);
    private setState;
    private processChunk;
    unmute(): void;
    mute(): void;
    record(): void;
    stop(): void;
    isMuted(): boolean;
    isRecording(): boolean;
    getState(): ChannelState;
}
//# sourceMappingURL=channel.d.ts.map