'use strict';

const BOX_WIDTH = 160;
const REGION_WIDTH = BOX_WIDTH + 48 + 10;

function Region(a)
{
	let region_name = [null, null, null];
	let region_abbr = [null, null, null];
	let region_period = [null, null];
	let person_list = [];
	let flag = null;

	this.pos_x = 0;
	this.pos_y = 0;
	this.disp_level = 0;

	function create_region_box()
	{
		let node = document.createElement('div');
		node.classList.add('region');

		let title = document.createElement('div');
		title.classList.add('region-title');
		node.appendChild(title);

		return node;
	}

	this.node = create_region_box();


	function lang_name_to_id(lang)
	{
		switch (lang) {
		case 'ja':
			return 0;
		case 'en':
			return 1;
		case 'zh':
			return 2;
		}
	}
	function set_default_name(a, offset)
	{
		if (a[offset + 0] === '$') {
			a[offset + 0] = a[offset + 1];
		}
		if (a[offset + 1] === '@') {
			a[offset + 1] = a[offset + 0];
		}
		if (a[offset + 2] === '$') {
			a[offset + 2] = a[offset + 1];
		}
		if (a[offset + 2] === '@') {
			a[offset + 2] = a[offset + 0];
		}
	}
	function period_bar_segment(len, years_per_em, height_em, color) {
		const css = (key, val) => key + ': ' + val + ';';
		const geom = [height_em, len / years_per_em, 0, 0];
		const display = css('display', 'inline-block');
		const padding = css('padding', geom.map(s => s + 'em').join(' '));
		const background_color = css('background-color', color);
		const style = [display, padding, background_color].join(' ');
		return '<div style="' + style + '"></div>';
	}
	function period_bar(beg, end, years_per_em, height_em, past_color, future_color, outer_style)
	{
		const past_years = data.year - beg;
		const future_years = Math.min(end, MAX_YEAR) - data.year;
		const past = period_bar_segment(past_years, years_per_em, height_em, past_color);
		const future = period_bar_segment(future_years, years_per_em, height_em, future_color);
		return '<div style="' + outer_style + '">' + past + future + '</div>';
	}

	this.update_year = function()
	{
		let year = data.year;
		let title = null;
		let i;
		let prev_region_name0 = null;

		// 国名
		for (i = 3; i < a.length && a[i].length > 3; i++) {
			let b = a[i];
			flag = b[2];
			if (b[3]) {
				set_default_name(b, 3);
				region_name[0] = b[3];
				region_name[1] = b[4];
				region_name[2] = b[5];
			}
			if (b.length >= 9 && b[6]) {
				set_default_name(b, 6);
				region_abbr[0] = b[6];
				region_abbr[1] = b[7];
				region_abbr[2] = b[8];
			}
			if (b.length >= 12) {
				this.pos_x = b[9];
				this.pos_y = b[10];
				this.disp_level = b[11];
			}
			if (region_name[0] !== prev_region_name0) {
				prev_region_name0 = region_name[0];
				region_period[0] = b[0];
			}
			region_period[1] = b[1];
			if (year < b[1]) {
				break;
			}
		}
		for (; i < a.length && a[i].length > 3; i++) {
			let b = a[i];
			if (b[3]) {
				set_default_name(b, 3);
				if (b[3] !== prev_region_name0) {
					break;
				}
			}
			region_period[1] = b[1];
		}
		for (; i < a.length && a[i].length > 3; i++) {
		}
		// 人名
		person_list = [];
		for (; i < a.length; i++) {
			let b = a[i];
			if (b.length == 3) {
				set_default_name(b, 0);
				title = b;
			} else {
				if (year >= b[0] && year < b[1]) {
					set_default_name(b, 3);
					person_list.push([title, b]);
				}
			}
		}
		this.node.style.zIndex = this.pos_y - this.disp_level * 100 + 400;
	};
	this.update = function(x, y)
	{
		this.node.style.left = x + 'px';
		this.node.style.top = (y - 8) + 'px';

		let lang = lang_name_to_id(data.lang);
		let html = '';
		html += period_bar(region_period[0], region_period[1], 100, 0.2, 'red', 'blue', 'white-space: nowrap;');
		if (flag && data.zoom >= 1){
			html += '<img src="sym/' + flag + '.png" alt="">';
		}
		if (data.zoom - this.disp_level >= 2) {
			html += region_name[lang];
		} else {
			html += region_abbr[lang];
		}
		let n = this.node.childNodes[0];
		n.innerHTML = html;

		if (data.zoom - this.disp_level >= 2) {
			let body;
			if (this.node.childNodes.length == 2) {
				body = this.node.childNodes[1];
				body.innerHTML = '';
			} else {
				body = document.createElement('div');
				body.classList.add('person-list');
				this.node.appendChild(body);
			}
			for (let i = 0; i < person_list.length; i++) {
				let a_title = person_list[i][0];
				let a_person = person_list[i][1];
				html = '';

				let item = document.createElement('div');
				item.classList.add('person');
				if (a_person[2]) {
					html = '<img src="f/' + a_person[2] + '.png" alt="">';
				} else {
					html = '<img src="f/0.png" alt="">';
				}
				html += '<div>' + a_title[lang] + '</div><div>' + a_person[3 + lang] + '</div>';
				html += period_bar(a_person[0], a_person[1], 10, 0.5, '#484', '#6c6', 'padding-top: 0;');
				item.innerHTML = html;
				body.appendChild(item);
			}
		} else {
			if (this.node.childNodes.length == 2) {
				this.node.removeChild(this.node.childNodes[1]);
			}
		}
	};
}
