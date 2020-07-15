document.ready(() => {
	playlist = w('m-window.playlist');

	playlist.drawer = (element) => {
		element.addcls('expanded');
		window.ev('mousedown', () => { element.rmcls('expanded'); }, {'once':true});
	}

	playlist.init = () => {
		console.debug('init');
		
		playlist.list = w('m-black-area.playlist');
		addEventListener('cursong', (e) => {
			var prev = w(`m-window.playlist m-track.highlighted`);
			var current = w(`m-window.playlist m-track:nth-of-type(${e.detail.cursong.Id})`);

			if(prev) prev.rmcls('highlighted');
			if(current) current.addcls('highlighted'); 
		});
		addEventListener('stop', () => {
			var track = w(`m-window.playlist m-track.highlighted`);
			if(track) track.rmcls('highlighted');
		});
		addEventListener('plinfo', (e) => {
			var html = '';
			e.detail.info.forEach((track) => {
				html+= `<m-track><div>${track.Id}. </div><div>${track.file.slice(0,-4)}</div><div>${time2str(track.Time)}</div></m-track>`;
			});
			playlist.list.innerHTML = html;
		});

		pipe.plinfo();
		pipe.cursong();
	}
});