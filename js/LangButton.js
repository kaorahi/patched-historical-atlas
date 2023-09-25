'use strict';

function LangButton()
{
	let on_changed_handler = null;

	function update()
	{
		if (on_changed_handler) {
			on_changed_handler();
		}
	}

	this.onchanged = function(f)
	{
		on_changed_handler = f;
	};

	document.getElementById('lang-select').addEventListener('change', function() {
		data.lang = this.value;
		update();
	});

	update();
}
