pipeline = (url, cb) => {
	var obj = {};

	obj.url = url;

	obj.ws = new WebSocket(obj.url);
	obj.ws.onerror = () => {
		obj.ws = new WebSocket(obj.url);
	}
	obj.ws.onclose = () => {
		obj.ws = new WebSocket(obj.url);
	}
	obj.ws.onmessage = (e) => cb(JSON.parse(e.data));

	obj.send = (json) => {
		if (obj.ws.readyState == 1) {
			obj.ws.send(JSON.stringify(json));
		} else {
			obj.ws.onopen = () => obj.ws.send(JSON.stringify(json));
		}
	}

	obj.keepalive = setInterval(() => {
		obj.send({'act':'keepalive'});
	}, 10*1000);

	obj.cursong = () => obj.send({'act':'cursong'});
	obj.status = () => obj.send({'act':'status'});
	obj.plinfo = (num) => obj.send({'act':'plinfo', 'num':num});
	obj.plsongcount = () => obj.send({'act':'plsongcount'});

	obj.seek = (t) => {
		time = Math.round(t).toString() + 's';
		obj.send({'act':'seek', 'time':time});
		console.debug(time);
	}

	obj.prev = () => obj.send({'act':'prev'});
	obj.play = () => obj.send({'act':'play'});
	obj.pause = () => obj.send({'act':'pause'});
	obj.stop = () => obj.send({'act':'stop'});
	obj.next = () => obj.send({'act':'next'});

	return obj;
}

pipe = pipeline(
	'ws://192.168.2.3:8080/ws',
	(data) => dispatchEvent(
		new CustomEvent(data.act, {detail:data})
	)
);