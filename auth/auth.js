auth_init = () => {
	w('#auth').css({'display':'block'});

	button('#auth .titlebtn-close', 
		{},
		() => {
			window.ev('mouseup', () => w('#auth').css({'display':'none'}), { once:true });
		}
	);

}