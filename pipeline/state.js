state = {};

state.authenticated = true;

state.song = {};
state.song.info = {};
state.song.duration = 0;
state.song.elapsed = 0;
state.song.time = setInterval(() => {
	if(state.song.duration>state.song.elapsed)
		state.song.elapsed++;
},1000);

state.client = 'nonresumed';

state.status = {};

addEventListener('cursong', (e) => { state.song.info = e.detail.cursong; });
addEventListener('status', (e) => { state.status = e.detail.status; });

addEventListener('play', () => { state.client = 'play'; });
addEventListener('stop', (e) => { state.client = 'stop'; });

addEventListener('watcher', (e) => {
	if(e.detail.sys == 'player') {
		pipe.status();
		pipe.cursong();
	}
});