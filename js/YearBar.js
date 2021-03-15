'use strict';

function YearBar()
{
	const _SIZE = 32;

	const year_bar = document.getElementById('year-bar');
	const arrow_l = document.getElementById('year-arrow-left');
	const arrow_r = document.getElementById('year-arrow-right');
	const scale = document.getElementById('year-bar-scale');
	const cursor = document.getElementById('year-bar-cursor');
	let scale_width = 1;
	let on_changed_handler = null;
	this.SIZE = _SIZE;


	this.set_top = function(top)
	{
		year_bar.style.top = top + 'px';
	};
	this.set_width = function(width)
	{
		if (width < 1) {
			width = 1;
		}
		scale_width = width;
		scale.setAttribute('width', width);

		let ctx = scale.getContext('2d');
		ctx.clearRect(0, 0, width, _SIZE);
		ctx.fillStyle = '#e0e0e0';
		ctx.fillRect(0, 0, width, _SIZE);

		let pattern = [
			0, 0,
			1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
			1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 
			1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
			1, 1,
		];
		let length = pattern.length;
		ctx.fillStyle = '#c0c0c0';
		for (let i = 0; i < length; i++) {
			if (pattern[i]) {
				let x1 = width * i / length;
				let x2 = width * (i + 1) / length;
				ctx.fillRect(x1, 0, x2 - x1, _SIZE);
			}
		}
		ctx.fillStyle = 'black';
		ctx.font = '9px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (let i = 0; i < 4; i++) {
			ctx.fillText(String(-4000 + i * 1000), (2 + i * 10) * width / length, _SIZE / 2);
		}
		for (let i = 0; i < 6; i++) {
			ctx.fillText(String(-500 + i * 500), (42 + i * 10) * width / length, _SIZE / 2);
		}

		update_cursor();
	};
	function update_cursor()
	{
		data.year_clamp();

		let yr = data.year + 4000;
		if (yr > 3000) {
			yr = yr * 2 - 3000;
		}
		cursor.style.left = ((yr + 200) * scale_width / 9400 + 26) + 'px';
	}

	this.onchanged = function(f)
	{
		on_changed_handler = f;
	};
	this.update = update_cursor;

	year_bar.addEventListener('mousedown', e =>
	{
		let xpos = e.clientX;
		if (xpos < _SIZE) {
			data.year--;
		} else if (xpos > scale_width + _SIZE) {
			data.year++;
		} else {
			let yr = (xpos - 32) * 9400 / scale_width - 200;
			if (yr > 3000) {
				yr = (yr + 3000) / 2;
			}
			yr -= 4000;
			data.year = Math.round(yr);
		}
		update_cursor();
		if (on_changed_handler) {
			on_changed_handler();
		}
	});
	arrow_l.addEventListener('mouseenter', function(e)
	{
		arrow_l.src = 'img/arrow-left2.png';
	});
	arrow_l.addEventListener('mouseleave', function(e)
	{
		arrow_l.src = 'img/arrow-left.png';
	});
	arrow_r.addEventListener('mouseenter', function(e)
	{
		arrow_r.src = 'img/arrow-right2.png';
	});
	arrow_r.addEventListener('mouseleave', function(e)
	{
		arrow_r.src = 'img/arrow-right.png';
	});
}
