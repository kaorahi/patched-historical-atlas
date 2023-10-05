'use strict';

function YearText()
{
	const ganzhi10 = "甲乙丙丁戊已庚辛壬癸";
	const ganzhi12 = "子丑寅卯辰巳午未申酉戌亥";

	const year_text = document.getElementById('year-text');
	const year_input = document.getElementById('year-input');
	const year_text_sub = document.getElementById('year-sub');
	let on_changed_handler = null;

	// 2"nd" century
	function suffix(i)
	{
		if (i >= 10 && i < 20) {
			return 'th';
		}

		switch (i % 10){
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
		}
	}
	// 1000年→10th century
	function get_century_text(yr)
	{
		let c;
		if (yr < 0) {
			c = Math.floor((-yr-1) / 100) + 1;
			return c + suffix(c) + ' century BC';
		} else {
			c = Math.floor((yr-1) / 100) + 1;
			return c + suffix(c) + ' century';
		}
	}
	// 干支
	function get_ganzhi_text(y)
	{
		if (y < 0) {
			y++;
		}
		y += 8036;
		return ganzhi10.charAt(y % 10) + ganzhi12.charAt(y % 12);
	}
	// 元号(末尾に/を付ける)
	function get_era_name(era, year)
	{
		let ret = '';

		for (let i = 0; i < era.length; i++) {
			let er = era[i];
			for (let j = er.length-1; j >= 0; j--) {
				let e = er[j];
				if (year >= e[0]) {
					if (e[1] !== null) {
						ret += e[1] + (year-e[0]+1) + '年 / ';
					}
					break;
				}
			}
		}
		return ret;
	}

	function update_text()
	{
		switch (data.lang) {
		case 'ja':
		case 'zh':
			if (data.year < 0) {
				year_text.innerText = "前" + (-data.year) + "年";
			} else {
				year_text.innerText = data.year + "年";
			}
			break;
		case 'en':
			if (data.year < 0) {
				year_text.innerText = (-data.year) + " BC";
			} else {
				year_text.innerText = "AD " + data.year;
			}
			break;
		}

		switch (data.lang) {
		case 'ja':
			year_text_sub.innerText = get_era_name(era_jp, data.year) + get_ganzhi_text(data.year);
			break;
		case 'zh':
			year_text_sub.innerText = get_era_name(era_cn, data.year) + get_ganzhi_text(data.year);
			break;
		case 'en':
			year_text_sub.innerText = get_century_text(data.year);
			break;
		}
	}

    function enter_year_text()
    {
		hide_input();
		let text = year_input.value;
		// 年が直接入力された場合
		if (text.match(/^-?\d{1,4}$/)) {
			data.year = Number(year_input.value);
			data.year_clamp();
			update_text();
			if (on_changed_handler) {
				on_changed_handler();
			}
		}
    }

	function hide_input()
	{
		year_text.style.display = '';
		year_input.style.display = '';
	}

	this.update = update_text;

	this.onchanged = function(f)
	{
		on_changed_handler = f;
	};

	year_text.addEventListener('mousedown', function()
	{
		year_text.style.display = 'none';
		year_input.style.display = 'inline';
		year_input.value = data.year;

		// この時点ではyear_inputは表示されていないため、
		// すぐ呼び出すとsetFocusに失敗する
		setTimeout(function() {
			year_input.focus();
			year_input.select();
        }, 100);
	});

	year_input.addEventListener('blur', hide_input);
	document.getElementById('year').addEventListener('submit', function(e) {
	    enter_year_text();
	    e.preventDefault();

	    // 以後のキー操作が混乱しないように（たとえば Esc キーの挙動）
	    year_input.blur();
	});

	this.update();
}
