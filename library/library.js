library_init = () => {
	w('#library').css({'display':'block'});

	w('#library .titlebtn-close').ev('mousedown', () => {
		window.ev('mouseup', () => w('#library').css({'display':'none'}), { once:true });
	})
}