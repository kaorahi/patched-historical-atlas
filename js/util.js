'use strict';

	function push_url() {
		history.pushState(null, document.title, location.href);
	}
