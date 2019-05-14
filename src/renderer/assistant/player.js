import { EventEmitter } from 'events';

/**
 * Audio Player for Google Assistant
 */
export default class Player extends EventEmitter {
	constructor({ previousPlayer = null } = {}) {
		super();

		/** Variables for the Audio Player */
		this.mediaSource = new MediaSource();

		this.audioPlayer = new Audio();
		this.previousPlayer = previousPlayer;
		console.log(this.previousPlayer);
		console.log(this);
		console.log(this === this.previousPlayer);

		this.audioBuffer = null;

		this.audioQueue = [];

		this.setup();
		this.setupAudioProcessor();
	}
	/**
	 * Reconstructs the current player.
	 */
	reset() {
		this.constructor({ previousPlayer: this.audioPlayer });
	}

	/**
	 * Setups the player with the given buffer as source.
	 */
	setup() {
		this.audioPlayer.addEventListener('waiting', () => {
			console.log('[Audio Player] Player is waiting on data...');
			this.emit('waiting');
		});

		this.audioPlayer.preload = 'none';
		this.audioPlayer.autoplay = true;
		this.audioPlayer.src = URL.createObjectURL(this.mediaSource);
	}

	/**
	 * Appends or queue's audio data into the buffer.
	 * @param {*} buffer
	 */
	appendBuffer(buffer) {
		if (this.audioBuffer.updating || this.audioQueue.length > 0) {
			this.audioQueue.push(buffer);
		} else {
			this.audioBuffer.appendBuffer(buffer);
		}
	}

	/**
	 * Set's up the audio processor required to process the mpeg receiving by Google.
	 */
	setupAudioProcessor() {
		this.mediaSource.addEventListener('sourceopen', () => {
			this.audioBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
			this.audioBuffer.mode = 'sequence';
			this.audioBuffer.addEventListener('update', () => {
				if (this.audioQueue.length > 0 && this.audioBuffer && !this.audioBuffer.updating) {
					this.audioBuffer.appendBuffer(this.audioQueue.shift());
					this.play();
				}
			});

			this.audioBuffer.addEventListener('error', (e) => {
				console.log('AudioBuffer Error: ', e);
			});

			this.emit('ready');
		});
	}

	/**
	 * Play's the Audio Player if nessesary.
	 */
	play() {
		if (this.audioPlayer.paused) {
			this.audioPlayer.play().then(() => {
				console.log('Assistant Audio is playing...');
			}).catch(e => console.log('something went wrong starting the player...', e));
		}
	}

	pause() {
		if (!this.audioPlayer.paused) {
			this.audioPlayer.pause().then(() => {
				console.log('Assistant Audio is paused.');
			}).catch(e => console.log('something went wrong pausing the player...', e));
		}
	}

	isPaused() {
		return this.audioPlayer.paused;
	}

	/**
	 * Empties the audioQueue and resets the current player.
	 */
	stop() {
		this.audioQueue = [];
		this.audioPlayer.src = '';
		this.reset();
	}

	playPing() {
		const pingPlayer = new Audio('static/ping.mp3');
		pingPlayer.play();
		this.emit('ping');
	}

	playTimerBeep(type) {
		const timerBeep = new Audio('static/Spokes.ogg');
		timerBeep.play();
		// timerBeep.addEventListener('ended', () => {
		// 	const timerSpokenNotification = new Audio(`static/${type}.wav`);
		// 	timerSpokenNotification.play();
		// });
		console.log(type);
		this.emit('nothing');
	}
}
