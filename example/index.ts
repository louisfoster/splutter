import type { Splutter, SplutterContextInterface, OnUploadedData } from "../build/splutter.js"

class App implements SplutterContextInterface
{
	public handlePostUpload: boolean

	private splutter?: Splutter

	private urls: URL[][]

	private channels: HTMLDivElement

	private info: HTMLPreElement

	private captureButton: HTMLButtonElement

	public static init()
	{
		new App()
	}

	constructor()
	{
		this.urls = []

		this._startCapture = this._startCapture.bind( this )

		this._getDeviceInfo = this._getDeviceInfo.bind( this )

		this.handleStartCapture = this.handleStartCapture.bind( this )

		this.handleStopCapture = this.handleStopCapture.bind( this )

		this.captureButtonClick = this.captureButtonClick.bind( this )

		const [ channels, info, captureButton ] = this.setUI()

		this.captureButton = captureButton

		this.channels = channels

		this.info = info

		this.handlePostUpload = false
	}

	private existsOrThrow<T>( item: unknown, selector: string )
	{
		if ( !item )
		{
			throw Error( `No item ${selector}` )
		}

		return item as T
	}

	private getEl<T extends HTMLElement>( selector: string ): T
	{
		return this.existsOrThrow( document.querySelector( selector ), selector )
	}

	private setUI(): [HTMLDivElement, HTMLPreElement, HTMLButtonElement]
	{
		const captureButton = this.getEl<HTMLButtonElement>( `#capture` )

		captureButton.addEventListener( `click`, () => this.captureButtonClick() )

		const channels = this.getEl<HTMLDivElement>( `#channels` )

		const info = this.getEl<HTMLPreElement>( `#info` )

		return [ channels, info, captureButton ]
	}

	private div(): HTMLDivElement
	{
		return document.createElement( `div` )
	}

	private btn(): HTMLButtonElement
	{
		return document.createElement( `button` )
	}

	private captureButtonClick()
	{
		if ( this.captureButton.dataset.state === `inactive` )
		{
			this.handleStartCapture()
				.then( channels =>
				{
					if ( channels )
					{
						this._getDeviceInfo()

						this.captureButton.dataset.state = `active`

						this.captureButton.textContent = `Stop Capture`
					}
				} )
		}
		else
		{
			this.handleStopCapture()

			this.noCaptureUI()
		}
	}

	private createRecord( channel: number )
	{
		const channelButton = this.btn()

		channelButton.dataset.state = `inactive`

		channelButton.textContent = `Record ${channel}`

		channelButton.addEventListener( `click`, () =>
		{
			if ( !this.splutter )
			{
				throw Error( `Splutter library failed to load.` )
			}

			if ( channelButton.dataset.state === `inactive` )
			{
				this.splutter.recordInputChannel( channel )

				channelButton.dataset.state = `active`

				channelButton.textContent = `Stop Record ${channel}`
			}
			else
			{
				this.splutter.stopRecordInputChannel( channel )

				channelButton.dataset.state = `inactive`

				channelButton.textContent = `Record ${channel}`
			}
		} )

		return channelButton
	}

	private createOutput( inputChannel: number, outputChannel: number )
	{
		const outputButton = this.btn()

		outputButton.dataset.state = `inactive`

		outputButton.textContent = `Listen on ${outputChannel}`

		outputButton.addEventListener( `click`, () =>
		{
			if ( !this.splutter )
			{
				throw Error( `Splutter library failed to load.` )
			}

			if ( outputButton.dataset.state === `inactive` )
			{
				this.splutter.unmuteOutputChannelForInputChannel( inputChannel, outputChannel )

				outputButton.dataset.state = `active`

				outputButton.textContent = `Mute on ${outputChannel}`
			}
			else
			{
				this.splutter.muteOutputChannelForInputChannel( inputChannel, outputChannel )

				outputButton.dataset.state = `inactive`

				outputButton.textContent = `Listen on ${outputChannel}`
			}
		} )

		return outputButton
	}

	private _getDeviceInfo()
	{
		if ( !this.splutter )
		{
			throw Error( `Splutter library failed to load.` )
		}

		const { id, outputChannels, inputChannels, label } = this.splutter.inputDeviceInformation()

		this.info.textContent = `Device ID: ${id}\nDevice label: ${label}`

		for ( let i = 0; i < inputChannels; i++ )
		{
			const ch = this.div()

			ch.appendChild( this.createRecord( i ) )

			for ( let o = 0; o < outputChannels; o++ )
			{
				ch.appendChild( this.createOutput( i, o ) )
			}

			this.urls[ i ] = [ new URL( `/uploadAudio`, window.location.origin ) ]

			this.channels.appendChild( ch )
		}
	}

	private async _startCapture()
	{
		if ( !this.splutter )
		{
			throw Error( `Splutter library failed to load.` )
		}

		return this.splutter.startCapture()
	}

	private async handleStartCapture()
	{
		if ( !this.splutter )
		{
			return import( `../build/splutter.js` ).then( ( { Splutter } ) =>
			{
				this.splutter = new Splutter( this )

				return this._startCapture()
			} )
		}
		else
		{
			return this._startCapture()
		}
	}

	private handleStopCapture()
	{
		if ( !this.splutter )
		{
			throw Error( `Splutter library failed to load.` )
		}

		this.splutter.stopCapture()
	}

	private noCaptureUI()
	{
		this.captureButton.dataset.state = `inactive`

		this.captureButton.textContent = `Start Capture`

		this.channels.innerHTML = ``

		this.info.textContent = ``
	}

	public onDevicePermissionRemoved(): void
	{
		this.noCaptureUI()
	}

	public onWarning( message: string | Error | ErrorEvent ): void
	{
		console.warn( message )
	}

	public getStreamURLsForChannel( channel: number ): URL[]
	{
		return this.urls[ channel ]
	}

	public onUploaded( data: OnUploadedData[], form: FormData, channel: number ): void
	{
		// console.log( data, form, channel )
	}

	public onFailure( error: Error ): void
	{
		throw error
	}
}

App.init()