document.ready(() => {
	player = w('#player');
	playlist = w('#playlist');

	player.audio = {};
	player.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
	player.audio.analyser = player.audio.ctx.createAnalyser();
	player.audio.analyser.fftSize = 2048;

	player.audio.track = new Audio('/stream');
	player.audio.src = player.audio.ctx.createMediaElementSource(
		player.audio.track
	);

	player.audio.src.connect(
		player.audio.analyser
	);
	player.audio.analyser.connect(
		player.audio.ctx.destination
	);

	player.init = () => {
		/* init song title */
		player.stitle = w('#songtitle div');
		player.stitle.artist = 'Dubmood';
		player.stitle.track = 'Force De Frappe';
		player.stitle.time = '3:45';
		player.stitle.set = (artist, track, time) => {
			player.stitle.artist = artist;
			player.stitle.track = track;
			player.stitle.time = time;
		}
		player.stitle.interval = () => {
			var margin = parseInt(player.stitle.css().marginLeft);
			var artist = player.stitle.artist;
			var track = player.stitle.track;
			var time = player.stitle.time;
			player.stitle.innerHTML = `*** ${artist} - ${track} ${time} *** ${artist} - ${track} ${time} ***`;

			if(margin > -player.stitle.offsetWidth/2) {
				player.stitle.css({'margin-left':`${margin-5}px`});
			} else {
				player.stitle.css({'margin-left':'-15px'});
			}
		}
		setInterval(player.stitle.interval, 200);

		/* init bitrate status */
		player.bitrt = w('#bitrt');
		player.bitrt.set = (bitrt) => player.bitrt.innerHTML = bitrt;

		/* init sample rate status */
		player.samplert = w('#samplert');
		player.samplert.set = (samplert) => player.samplert.innerHTML = samplert;

		/* init volume bar */
		player.volume = w('#volbar');
		player.volume.bar = w('#volbar>div');
		player.volume.set = (vol) => {
			if(vol>=1) vol=1;
			if(vol<=0) vol=0;

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
			player.audio.track.volume = vol;
		}
		player.volume.ev('mousedown', (e) => {
			drag = (e) => {
				var vol = (e.clientX-player.volume.offsetLeft)/player.volume.offsetWidth;
				player.volume.set(vol); 
			}
			drag(e);

			window.ev('mousemove', drag);
			window.ev('mouseup', () => window.rmev('mousemove', drag));
		});
		player.ev('wheel', (e) => {
			var vol = player.audio.track.volume;

			if(e.deltaY < 0) {
				vol+=0.05;
			} else {
				vol-=0.05;
			}

			player.volume.set(vol);
		});
		player.volume.set(0.33);

		/* init position bar */
		player.position = w('#posbar');
		player.position.bar = w('#posbar>div');
		player.position.lock = false;
		player.position.set = (pos) => {
				if(pos>=100) pos=100;
				if(pos<=0) pos=0;

				player.position.bar.css({'margin-right':`${100-pos}%`});
		}
		player.position.ev('mousedown', (e) => {
			player.position.lock = true;
			drag = (e) => {
				var pos = (e.clientX-player.position.offsetLeft)*100/player.position.offsetWidth;
				player.position.set(pos);
			}
			drag(e);

			window.ev('mousemove', drag);
			window.ev('mouseup', () => {
				if(player.position.lock) {
					window.rmev('mousemove', drag);
					var pos = 100-parseInt(player.position.bar.css().marginRight);
					var t = (player.position.duration/100)*pos;
					player.position.elapsed = t;
					pipe.seek(t);
					player.position.lock = false;
				}
			});
		});
		player.position.duration = 0;
		player.position.elapsed = 0;
		player.position.timer = setInterval(() => {
			var p = player.position;
			if(p.duration && !player.audio.track.paused && !player.position.lock) {
				p.elapsed++;
				p.set((p.elapsed/p.duration)*100);
			}
		},1000);

		/* init histogram */
		player.hist = w('#hist')
		player.hist.ctx = player.hist.getContext('2d');
		
		player.hist.cols = 20;
		player.hist.colw = 12;
		player.hist.minhz = 200;
		player.hist.maxhz = 22050;

		player.hist.tdlen = player.audio.analyser.frequencyBinCount;
		player.hist.tddata = new Uint8Array(player.hist.tdlen);
		player.hist.octavebuckets = new Array(player.hist.cols);
		player.hist.step = Math.pow(
			player.hist.maxhz / player.hist.minhz,
			1 / player.hist.cols
		);

		player.hist.octavebuckets[0] = 0;
		player.hist.octavebuckets[1] = player.hist.minhz;

		for(var i=2; i<player.hist.cols-1; i++)
			player.hist.octavebuckets[i] = player.hist.octavebuckets[i-1] * player.hist.step;
		player.hist.octavebuckets[player.hist.cols-1] = player.hist.maxhz;

		for(var i=0; i<player.hist.cols; i++)
			player.hist.octavebuckets[i] = Math.floor(
				(player.hist.octavebuckets[i] / player.hist.maxhz) * player.hist.tdlen
			);

		player.hist.draw = () => {
			var grad = player.hist.ctx.createLinearGradient(0,player.hist.height*2,0,0);
			var xoffset = 0;
			var colh = 0;

			player.audio.analyser.getByteFrequencyData(
				player.hist.tddata
			);

			player.hist.ctx.clearRect(0, 0, player.hist.width, player.hist.height);

			grad.addColorStop(0, 'rgba(49,156,8,1)');
			grad.addColorStop(0.50, 'rgba(41,206,16,1)');
			grad.addColorStop(0.63, 'rgba(222,165,24,1)');
			grad.addColorStop(0.80, 'rgba(214,90,0,1)');
			grad.addColorStop(1, 'rgba(206,41,16,1)');
			player.hist.ctx.fillStyle = grad;

			for(var i=0; i<player.hist.cols-1; i++) {
				colh = 0;
				for(var j=player.hist.octavebuckets[i]; j<player.hist.octavebuckets[i+1]; j++) {
					colh += player.hist.tddata[j];
				}
				colh /= player.hist.octavebuckets[i+1] - player.hist.octavebuckets[i];
				colh *= player.hist.height/256;
				player.hist.ctx.fillRect(xoffset, player.hist.height-colh, player.hist.colw, colh);
				xoffset += player.hist.colw + 4;
			}

			requestAnimationFrame(player.hist.draw);
		}
		player.hist.draw();

		/* init buttons */
		player.btn = {
			mini: w('#player .titlebtn-mini'),
			max: w('#player .titlebtn-max'),

			auth: w('#atbtn'),
			list: w('#plbtn'),

			prev: w('#prevbtn'),
			play: w('#playbtn'),
			pause: w('#pausebtn'),
			stop: w('#stopbtn'),
			next: w('#nextbtn'),

			//shuffle:
			//reperat:

			lib: w('#logobtn')
		};

		player.btn.mini.ev('mousedown', () => {});
		player.btn.max.ev('mousedown', () => {});

		player.btn.auth.ev('mousedown', () => {
			//auth.load('/auth/auth.html', auth.init);
		});
		player.btn.list.ev('mousedown', () => {
			list.load('/playlist/playlist.html', playlist_init);
		})

		player.btn.prev.ev('mousedown', pipe.prev);
		player.btn.play.ev('mousedown', () => {
			player.audio.ctx.resume();
			player.audio.track.load();
			player.audio.track.play();

			pipe.play();
		});
		player.btn.pause.ev('mousedown', () => {
			if(
				player.audio.track.paused &&
				player.audio.track.currentTime != 0
			) {
				player.audio.track.play();
			} else {
				player.audio.track.pause();
			}
		});
		player.btn.stop.ev('mousedown', () => {
			player.audio.track.pause();
			player.audio.track.load();

			pipe.stop();
		});
		player.btn.next.ev('mousedown', pipe.next);

		player.btn.lib.ev('mousedown', () => {
			//lib.load('/library/library.html', lib.init);
		});

		pipe.cursong();
		pipe.status();
	}

	player.load('/player/player.html', player.init);
});