export enum ChannelState
{
	connecting,
	connected,
	outputting,
	recording,
	outputtingAndRecording
}

export interface ChannelStateChangeListener
{
	onChannelStateChange?: ( channel: number, state: ChannelState ) => void
}

export class Channel
{
	public input: BiquadFilterNode

	public output: ScriptProcessorNode

	private state: ChannelState

	private emptyBuffer: Float32Array

	private unmutedStates: [ChannelState, ChannelState]

	private recordingStates: [ChannelState, ChannelState]

	constructor(
		public index: number,
		private stateListener: ChannelStateChangeListener,
		private onChunk: ( chunk: Float32Array, channelIndex: number ) => void,
		context: AudioContext,
		bufferSize: number
	)
	{
		this.processChunk = this.processChunk.bind( this )

		this.mute = this.mute.bind( this )

		this.unmute = this.unmute.bind( this )

		this.state = ChannelState.connecting

		this.input = context.createBiquadFilter()

		this.input.type = `lowpass`

		this.input.channelCount = 1

		this.input.frequency.setValueAtTime( 6000, context.currentTime )

		this.output = context.createScriptProcessor(
			bufferSize,
			1,
			1
		)

		this.output.onaudioprocess = this.processChunk

		this.input.connect( this.output )

		this.state = ChannelState.connected

		this.emptyBuffer = new Float32Array( bufferSize )

		this.unmutedStates = [
			ChannelState.outputting,
			ChannelState.outputtingAndRecording
		]

		this.recordingStates = [
			ChannelState.recording,
			ChannelState.outputtingAndRecording
		]
	}

	private setState( state: ChannelState )
	{
		this.state = state

		if ( this.stateListener.onChannelStateChange )
			this.stateListener.onChannelStateChange( this.index, this.state )
	}

	private processChunk( event: AudioProcessingEvent )
	{
		/**
		 * chrome and safari reuse the buffer, so it needs to be copied
		 */
		const data: Float32Array = Float32Array.from(
			event.inputBuffer.getChannelData( 0 )
		)

		if ( this.isRecording() ) this.onChunk( data, this.index )

		event.outputBuffer
			.getChannelData( 0 )
			.set( !this.isMuted()
				? data 
				: this.emptyBuffer )
	}

	public unmute(): void
	{
		if ( this.state === ChannelState.connecting ) return

		this.setState( this.state = this.state === ChannelState.recording
			? ChannelState.outputtingAndRecording
			: ChannelState.outputting )
	}

	public mute(): void
	{
		if ( this.state === ChannelState.connecting ) return

		this.setState( this.state === ChannelState.outputtingAndRecording
			? ChannelState.recording
			: ChannelState.connected )
	}

	public record(): void
	{
		if ( this.state === ChannelState.connecting ) return

		this.setState( this.state === ChannelState.outputting
			? ChannelState.outputtingAndRecording
			: ChannelState.recording )
	}

	public stop(): void
	{
		if ( this.state === ChannelState.connecting ) return

		this.setState( this.state === ChannelState.outputtingAndRecording
			? ChannelState.outputting
			: ChannelState.connected )
	}

	public isMuted(): boolean
	{
		return !this.unmutedStates.includes( this.state )
	}

	public isRecording(): boolean
	{
		return this.recordingStates.includes( this.state )
	}

	public getState(): ChannelState
	{
		return this.state
	}
}