EventTarget.prototype.ev = EventTarget.prototype.addEventListener;
EventTarget.prototype.rmev = EventTarget.prototype.removeEventListener;

HTMLElement.prototype.css = function (styles) {
	if (styles) {
		for (s in styles)
			this.style[s] = styles[s];
	} else {
		return this.style;
	}
}
HTMLElement.prototype.load = function (url) {
	if(this.classList.contains('loaded')) {
		this.rmcls('hidden');
		return;
	}

	request = new XMLHttpRequest();
	request.open('GET', url);
	request.send();
	request.onload = () => {
		if (request.status >= 200 && request.status < 400)
			this.innerHTML = request.responseText;
			this.init();
			this.addcls('loaded');
			this.rmcls('hidden');
	}
}

HTMLElement.prototype.attr = function (attribute) {
	return this.getAttribute(attribute);
}

HTMLElement.prototype.setattr = function (attribute, value) {
	return this.setAttribute(attribute);
}

HTMLElement.prototype.rmcls = function (clsname) {
	this.classList.remove(clsname);
}
HTMLElement.prototype.addcls = function (clsname) {
	this.classList.add(clsname);
}

HTMLElement.prototype.up = function () {
	return this.parentElement;
}

HTMLElement.prototype.upto = function (levels) {
	if(levels) {
		var elem = this;
		for (var i=0; i<levels; i++) {
			if(elem.parentElement) {
				elem = elem.parentElement;
			} else {
				break;
			}
		}
		return elem;
	} else {
		return this;
	}
}

document.ready = (cb) => document.ev("DOMContentLoaded", cb);

w = (selector) => {
	elements = document.querySelectorAll(selector);

	if (elements.length == 0) return null;
	if (elements.length == 1) return elements[0];

	/* set methods over whole array */
	elements.css = (styles) => {
		for (i=0; i<elements.length; i++) {
			e = elements[i];
			e.css(styles);
	}}
	elements.ev = (evtype, cb) => {
		for (i=0; i<elements.length; i++) {
			e = elements[i];
			e.ev(evtype, cb);
	}}
	elements.rmcls = (clsname) => {
		for (i=0; i<elements.length; i++) {
			var e = elements[i];
			e.rmcls(clsname);
	}}
	elements.addcls = (clsname) => {
		for (i=0; i<elements.length; i++) {
			var e = elements[i];
			e.addcls(clsname);
	}}
	return elements;
}

wtree = (root, tree) => {

}

time2str = function (time, lz=false) {
	var minutes = Math.floor(time/60);
	var seconds = time - minutes*60;

	minutes = minutes.toString();
	if(lz) {
		for(var i=minutes.length; i<2; i++)
			minutes = '0' + minutes;
	}

	seconds = seconds.toString();
	for(var i=seconds.length; i<2; i++)
		seconds = '0' + seconds;

	return `${minutes}:${seconds}`;
}
