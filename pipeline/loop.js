/*pipe = pipeline(
	'ws://192.168.2.3:8080/ws',
	(data) => {
		console.log(data);

		if(data.act == 'keepalive')
			console.debug('keepalive');

		if(data.act == 'cursong') {
			
			var prev = w(`m-window.playlist m-track.highlighted`);
			var track = w(`m-window.playlist m-track:nth-of-type(${data.cursong.Id})`);

			if(prev) prev.rmcls('highlighted');
			if(track) track.addcls('highlighted'); 
			dispatchEvent(
				new CustomEvent(data.act, {detail: data})
			);
		}

		if(data.act == 'status') {
			var audio = data.audio.split(':');

			player.bitrate.innerHTML = data.bitrate;
			player.samplerate.innerHTML = Math.floor(audio[0] / 1000);

			player.seek.duration = parseInt(data.duration);
			player.seek.elapsed = parseInt(data.elapsed);
		}

		if(data.act == 'plinfo') {
			var html = '';
			data.info.forEach((track) => {
				html += `<m-track><div>${track.Id}. </div><div>${track.file.slice(0,-4)}</div><div>${time2str(track.Time)}</div></m-track>`;
			});
			playlist.list.innerHTML = html;
		}

		if(data.act == 'watcher') {
			if(data.sys == 'player') {
				pipe.status()
				pipe.cursong();
				player.audio.load();
				player.audio.addEventListener('canplaythrough', () => player.audio.play(), {'once': true});
				player.audio.play();
			}
		}
	}
);*/

pipe = pipeline(
	'ws://192.168.2.3:8080/ws',
	(data) => dispatchEvent(
		new CustomEvent(data.act, {detail:data});
	)
);