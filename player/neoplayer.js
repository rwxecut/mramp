document.ready(() => {
	player = w('m-window.player');

	player.prev = () => {
		pipe.prev();
		player.audio.load();
	};

	player.play = () => {
		if(
			!state.authenticated &&
			state.status.state == 'stop'
		) return;

		if(
			state.authenticated &&
			state.client != 'noneresumed' &&
			state.status.state == 'stop'
		) pipe.play();

		player.audio.load();
		dispatchEvent(new Event('play'));
	}

	player.pause = () => {
		player.status.clear();
		if(
			player.audio.paused &&
			player.audio.currentTime != 0
		) {
			player.audio.play();
			player.status.addcls('play');
		} else {
			player.audio.pause();
			player.status.addcls('pause');
		}
	}

	player.stop = () => {
		if(state.client =='stop') return;
		if(
			state.authenticated &&
			state.status.state == 'play'
		)	pipe.stop();

		player.audio.pause();
		dispatchEvent(new Event('stop'));
	} 

	player.next = () => {
		pipe.next();
		player.audio.load();
	};

	player.shuffle = () => {}
	player.repeat = () => {}
	player.eject = () => {}
	
	player.init = () => {
		player.initaudio();
		player.initvisuals();
		player.initvolumebar();
		player.initseekbar();
		player.initminiseekbar();
		player.initsongtitle();

		player.bitrate = w('m-black-area.bitrate');
		player.samplerate = w('m-black-area.samplerate');

		addEventListener('play', () => {
			var audio = state.status.audio.split(':');
			player.bitrate.innerHTML = state.status.bitrate;
			player.samplerate.innerHTML = Math.floor(audio[0]/1000);
		});
		addEventListener('stop', () => {
			player.bitrate.innerHTML = '';
			player.samplerate.innerHTML = '';
		});

		pipe.status();
	}

	player.initaudio = () => {
		player.audioctx = new (window.AudioContext || window.webkitAudioContext)();

		player.anal = player.audioctx.createAnalyser();
		player.anal.fftSize = 2048;

		player.audio = new Audio('/stream');
		player.audio.addEventListener('canplaythrough', player.audio.play);
		//player.audio.addEventListener('canplay', player.audio.play);

		player.audiosrc = player.audioctx.createMediaElementSource(player.audio);
		player.audiosrc.connect(player.anal);

		player.anal.connect(player.audioctx.destination);
	}

	player.initvisuals = () => {
		player.status = w('m-playback-status');
		player.status.clear = () => {
			player.status.rmcls('stop');
			player.status.rmcls('pause');
			player.status.rmcls('play');
		}

		player.hist = w('m-black-area.visuals canvas');
		player.inithistogram(
			player.hist,
			{
				'columns': 20,
				'colwidth': 12,
				'offset': 4
			}
		);

		player.minihist = w('m-black-area.histogram canvas');
		player.inithistogram(
			player.minihist,
			{
				'columns': 10,
				'colwidth': 25,
				'offset': 6.5
			}
		);

		player.time = w('m-playback-time');
		player.time.digits = w('m-playback-time div');

		player.time.mode = 'elapsed';

		player.time.timer = setInterval(() => {
			var time = player.seek.elapsed;
			var minutes = Math.floor(time/60);
			var seconds = time - minutes*60;
			
			var minarr = minutes.toString().split('');
			if(minarr.length == 1) minarr.unshift('0');
			var secarr = seconds.toString().split('');
			if(secarr.length == 1) secarr.unshift('0');


			var arr = minarr.concat(secarr);
			arr.unshift(' ');

			for(var i=0; i<player.time.digits.length; i++) 
				player.time.digits[i].innerHTML = arr[i];
				
		}, 1000);

		addEventListener('stop', () => {
			player.status.clear();
			player.status.addcls('stop');
			player.time.digits.forEach((i) => i.innerHTML = '');
		});
		addEventListener('play', () => {
			player.status.clear();
			player.status.addcls('play');
		});
	}

	player.inithistogram = (element, options) => {
		element.ctx = element.getContext('2d');

		element.cols = options.columns;
		element.colw = options.colwidth;
		element.offset = options.offset;
		element.minhz = 200;
		element.maxhz = 22050;

		element.tdlen = player.anal.frequencyBinCount;
		element.tddata = new Uint8Array(element.tdlen);
		element.octavebuckets = new Array(element.cols);
		element.step = Math.pow(
			element.maxhz/element.minhz,
			1/element.cols
		);

		element.octavebuckets[0] = 0;
		element.octavebuckets[1] = element.minhz;

		for(var i=2; i<element.cols-1; i++)
			element.octavebuckets[i] = element.octavebuckets[i-1] * element.step;

		element.octavebuckets[element.cols-1] = element.maxhz;

		for(var i=0; i<element.cols; i++)
			element.octavebuckets[i] = Math.floor(
				(element.octavebuckets[i]/element.maxhz) * element.tdlen
			);

		element.draw = function () {
			var grad = element.ctx.createLinearGradient(0,element.height*2,0,0);
			var xoffset = 0;
			var colh = 0;

			player.anal.getByteFrequencyData(element.tddata);

			element.ctx.clearRect(0, 0, element.width, element.height);

			grad.addColorStop(0, 'rgba(49,156,8,1)');
			grad.addColorStop(0.50, 'rgba(41,206,16,1)');
			grad.addColorStop(0.63, 'rgba(222,165,24,1)');
			grad.addColorStop(0.80, 'rgba(214,90,0,1)');
			grad.addColorStop(1, 'rgba(206,41,16,1)');
			element.ctx.fillStyle = grad;

			for(var i=0; i<element.cols-1; i++) {
				colh = 0;
				for(var j=element.octavebuckets[i]; j<element.octavebuckets[i+1]; j++)
					colh += element.tddata[j];
			
				colh /= element.octavebuckets[i+1] - element.octavebuckets[i];
				colh *= element.height/256;
				element.ctx.fillRect(xoffset, element.height-colh, element.colw, colh);
				xoffset += element.colw + element.offset;
			}
			requestAnimationFrame(element.draw);
		}

		element.draw(element);
	}

	player.initvolumebar = () => {
		player.volume = w('m-volume-bar');
		player.volume.bar = w('m-volume-bar div');

		player.volume.lock = false;

		player.volume.get = () => {
			return Math.round(player.audio.volume*100);
		}

		player.volume.set = (vol) => {
			if(vol>=1) vol=1;
			if(vol<=0) vol=0;

			player.volume.val = vol*100;
			player.volume.bar.css({'margin-right': `${100-vol*100}%`});

			var m = 0;
			var R = 0;
			var G = 0;

			if(vol>=0 && vol<=0.15) {
				m = (255-130)/0.15;
				G = 130 + vol*m;
			}
			if(vol>0.15 && vol<=0.85) {
				m = 255;
				R = vol*m;
				G = 255 - vol*m;
			}
			if(vol>0.85 && vol<=1) {
				m = 255;
				R = 255;
				G = 255-vol*m;
			}
			
			player.volume.css({'background-color':`RGB(${R},${G},0)`});
			player.audio.volume = vol;

			dispatchEvent(new Event('volumechange'));
		}

		player.volume.drag = (e) => {
			var vol = (e.clientX-player.volume.offsetLeft)/player.volume.offsetWidth;
			player.volume.set(vol);
		}

		player.volume.click = (e) => {
			player.volume.lock = true;

			player.volume.drag(e);

			window.ev('mousemove', player.volume.drag);
			window.ev('mouseup', () => {
				if(!player.volume.lock)	return;
				window.rmev('mousemove', player.volume.drag);
				player.volume.lock = false;
				dispatchEvent(new Event('volumestop'))
			}, {'once':true});
		}

		player.volume.wheel = (e) => {
			if(player.volume.lock) return;

			var vol = player.audio.volume;
			if(e.deltaY < 0) {
				vol+=0.05;
			} else {
				vol-=0.05;
			}
			player.volume.set(vol);
		}
	}

	player.initpanbar = () => {

	}

	player.initseekbar = () => {
		player.seek = w('m-content m-seek-bar');
		player.seek.bar = w('m-content m-seek-bar div');

		player.seek.lock = true;
		player.seek.elapsed = 0 ;
		player.seek.duration = 0;

		player.seek.get = () => {
			return 100-parseInt(player.seek.bar.css().marginRight);
		}

		player.seek.set = (pos) => {
			if(pos>=100) pos=100;
			if(pos<=0) pos=0;

			player.seek.bar.css({'margin-right':`${100-pos}%`});

			dispatchEvent(new Event('seek'));
		}

		player.seek.drag = (e) => {
			var pos = (e.clientX-player.seek.offsetLeft)*100/player.seek.offsetWidth;
			player.seek.set(pos);
		}

		player.seek.click = (e) => {
			player.seek.lock = true;
			player.seek.drag(e);

			window.ev('mousemove', player.seek.drag);
			window.ev('mouseup', () => {
				if(!player.seek.lock) return;

				window.rmev('mousemove', player.seek.drag);
				player.seek.lock = false;

				player.seek.elapsed = (player.seek.duration/100) * player.seek.get();
				pipe.seek(player.seek.elapsed);

				dispatchEvent(new Event('seekstop'));
			}, {'once': true});
		}

		setInterval(() => {
			if(
				player.seek.duration && 
				!player.audio.paused && 
				!player.seek.lock
			) {
				player.seek.elapsed++;
				player.seek.set(
					(player.seek.elapsed/player.seek.duration)*100
				);
			}
		}, 1000);

		addEventListener('play', () => {
			player.seek.lock = false;
			player.seek.bar.rmcls('hidden');
			player.seek.duration = state.song.duration;
			player.seek.elapsed = state.song.elapsed;
		});
		addEventListener('stop', () => {
			player.seek.lock = true;
			player.seek.bar.addcls('hidden');
		})
	}

	player.initminiseekbar = () => {
		player.miniseek = w('m-mini-title m-seek-bar');
		player.miniseek.bar = w('m-mini-title m-seek-bar div');

		player.miniseek.lock = true;

		player.miniseek.get = () => {
			return 100-parseInt(player.miniseek.bar.css().marginRight);
		}

		player.miniseek.clear = () => {
			player.miniseek.rmcls('rise');
			player.miniseek.rmcls('middle');
			player.miniseek.rmcls('fall');
		}

		player.miniseek.set = (pos) => {
			if(pos>=100) pos=100;
			if(pos<=0) pos=0;

			player.miniseek.clear();
			if(pos<=33) player.miniseek.addcls('rise');
			if((pos>33) && (pos<66)) player.miniseek.addcls('middle');
			if(pos>=66) player.miniseek.addcls('fall');

			player.miniseek.bar.css({'margin-right':`${100-pos}%`});
		}

		player.miniseek.drag = (e) => {
			var pos = (e.clientX-player.miniseek.offsetLeft)*100/player.miniseek.offsetWidth;
			player.miniseek.set(pos);
		}

		player.miniseek.click = (e) => {
			player.miniseek.lock = true;
			player.miniseek.drag(e);

			window.ev('mousemove', player.miniseek.drag);
			window.ev('mouseup', () => {
				if(!player.miniseek.lock) return;

				window.rmev('mousemove', player.miniseek.drag);
				player.miniseek.lock = false;

				player.miniseek.elapsed = (player.miniseek.duration/100) * player.miniseek.get();
				//pipe.seek(player.miniseek.elapsed);
			}, {'once': true});
		}
	
		//setInterval(() => {}, 100);

		addEventListener('play', () => {
			player.miniseek.lock = false;
			player.miniseek.bar.rmcls('hidden');
		});
		addEventListener('stop', () => {
			player.miniseek.lock = true;
			player.miniseek.bar.addcls('hidden');
		})
	}

	player.initsongtitle = () => {
		player.songtitle = w('m-black-area.songtitle div');
		
		player.songtitle.lock = false;
		player.songtitle.num = '';
		player.songtitle.text = '';
		player.songtitle.time = '';

		setInterval(() => {
			if(player.songtitle.lock) return;

			if(player.songtitle.text.length == 0) {
				player.songtitle.innerHTML = '';
				return;
			}

			var margin = parseInt(player.songtitle.css().marginLeft);
			var owidth = player.songtitle.offsetWidth;

			var num = player.songtitle.num;
			var text = player.songtitle.text;
			var time = player.songtitle.time;

			player.songtitle.innerHTML = `*** ${num}. ${text} (${time}) *** ${num}. ${text} (${time}) ***`;
				
			if(margin > -owidth/2) {
				player.songtitle.css({'margin-left':`${margin-5}px`});
			} else {
				player.songtitle.css({'margin-left':'-15px'});
			}
		},200);

		addEventListener('play', () => {
			player.songtitle.time = time2str(state.song.info.Time);
			player.songtitle.text = state.song.info.file.slice(0,-4);
			player.songtitle.num = state.song.info.Id;
		});

		addEventListener('volumechange', () => {
			var vol = player.volume.get();

			player.songtitle.lock = true;
			player.songtitle.css({'margin-left':'0px'});
			player.songtitle.innerHTML = `VOLUME: ${vol}%`;
		});
		addEventListener('volumestop', () => {
			player.songtitle.lock = false;
		});

		addEventListener('seek', () => {
			var elapsed = 0;
			var duartion = 0;
			var percent = 0;

			player.songtitle.lock = true;
			player.songtitle.css({'margin-left':'0px'});
			player.songtitle.innerHTML = `SEEK TO: ${vol}%`;
		});
		addEventListener('seekstop', () => {
			player.songtitle.lock = false;
		})

	}

	player.load('/player/neoplayer.html');
});