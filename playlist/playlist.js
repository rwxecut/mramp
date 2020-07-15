document.ready(() => {
	playlist = w('#playlist');

	playlist.init = () => {
		playlist.inittribtn();

		playlist.table = w('#playlist table');

		playlist.css({'display':'block'});

		playlist.closebtn = w('#playlist .titlebtn-close');
		playlist.closebtn.ev('mousedown', () => {
			playlist.css({'display':'none'});
		},{once:true});

		playlist.minibtn = w('#playlist .titlebtn-mini');
		playlist.minibtn.ev('mousedown', () => {
			w('#playlist .title').css({'display':'none'});
			w('#playlist .title.mini').css({'display':'flex'});
			w('#playlist .content').css({'display':'none'});
			w('#playlist').css({'padding-bottom':'0px'});
		});

		playlist.maxbtn = w('#playlist .titlebtn-max');
		playlist.maxbtn.ev('mousedown', () => {
			w('#playlist .title').css({'display':'flex'});
			w('#playlist .title.mini').css({'display':'none'});
			w('#playlist .content').css({'display':'block'});
			w('#playlist').css({'padding-bottom':'5px'});
		});

		playlist.playbtn = w('#playplbtn');
		playlist.playbtn.ev('mousedown', () => {
			player.audioctx.resume();
			player.audio.load();
			player.audio.play();
			pipe.play();
		});

		playlist.pausebtn = w('#pauseplbtn');
		playlist.pausebtn.ev('mousedown', () => {
			if(
					player.audio.paused &&
					player.audio.currentTime != 0
			) {
					player.audio.play();
			} else {
					player.audio.pause();
			}
		});

		playlist.stopbtn = w('#stopplbtn');
		playlist.stopbtn.ev('mousedown', () => {
			player.audio.pause();
			player.audio.load();
			pipe.stop();
		});
	}

	playlist.inittribtn = () => {
		plbtn = (sel, auxsel) => {
			w(sel).ev('mousedown', (e) => {
				w(sel).css({'display':'none'});

				auxsel.forEach((s) => {
					w(s).css({'display':'block'});
				});

				w(sel).parentElement.parentElement.css({'margin-top':`-${18*auxsel.length-18-7}px`});

				e.stopPropagation();

				window.ev('mousedown', () => {
					w(sel).css({'display':'block'});

					auxsel.forEach((s) => {
						console.log(s);
						w(s).css({'display':'none'});
					});

					w(sel).parentElement.parentElement.css({'margin-top':''});
				}, {once:true});
			});
		}

		plbtn('#addplbtn', [
			'#urlplbtn',
			'#dirplbtn',
			'#fileplbtn'
		]);

		plbtn('#remplbtn', [
			'#rmiscplbtn',
			'#rallplbtn',
			'#cropplbtn',
			'#rselplbtn'
		]);

		plbtn('#selplbtn', [
			'#invplbtn',
			'#zeroplbtn',
			'#sallplbtn'
		]);

		plbtn('#miscplbtn', [
			'#msortplbtn',
			'#infplbtn',
			'#optsplbtn'
		]);

		plbtn('#listplbtn', [
			'#nlistplbtn',
			'#slistplbtn',
			'#ldlistplbtn'
		]);
	}
});