'use strict';

function LangButton()
{
	let on_changed_handler = null;
	const label_table = {
		ja: {ja: '日本語', en: '英語', zh: '中国語'},
		en: {ja: 'Japanese', en: 'English', zh: 'Chinese'},
		zh: {ja: '日文', en: '英文', zh: '中文'},
	};

	function update()
	{
		const label = label_table[data.lang];
		Object.keys(label).forEach(lang => {
			const option = document.querySelector(`#lang-select option[value="${lang}"]`);
			option.innerText = label[lang];
		});
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
