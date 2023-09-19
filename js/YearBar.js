'use strict';

function YearBar()
{
	const _SIZE = 32;

	const year_bar = document.getElementById('year-bar');
	const arrow_l = document.getElementById('year-arrow-left');
	const arrow_r = document.getElementById('year-arrow-right');
	const scale = document.getElementById('year-bar-scale');
	const cursor = document.getElementById('year-bar-cursor');
	const year_text = document.getElementById('year-text');
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

	function increment_year(delta) {
		const old_year = data.year;
		const new_year = data.year + delta;
		const across_zero = (Math.sign(old_year) !== Math.sign(new_year));
		data.year = new_year + (across_zero ? Math.sign(delta) : 0);
	}

	this.onchanged = function(f)
	{
		on_changed_handler = f;
	};
	this.update = update_cursor;

	function updated() {
		update_cursor();
		if (on_changed_handler) {
			on_changed_handler();
		}
	}

	document.addEventListener('mouseup', e => {is_dragging_year = false;});
	document.addEventListener('mouseleave', e => {is_dragging_year = false;});
	document.addEventListener('mousemove', e => {
		onMouseMove(e);
		e.preventDefault();
	});
	function onMouseMove(e) {
		if (is_dragging_year) {
			onMouseDown(e);
		}
	}

	document.addEventListener('touchend', e => {is_dragging_year = false;});
	document.addEventListener('touchcancel', e => {is_dragging_year = false;});
	document.addEventListener('touchmove', e => {
		if (e.touches.length !== 1) {
			is_dragging_year = false;
			return;
		}
		onMouseMove(e.changedTouches[0]);
	});

	year_bar.addEventListener('touchstart', e => {
		if (e.touches.length !== 1) {
			is_dragging_year = false;
			return;
		}
		onMouseDown(e.changedTouches[0]);
	});
	year_bar.addEventListener('mousedown', onMouseDown);
	function onMouseDown(e) {
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
		updated();
		is_dragging_year = true;
	}
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
	document.addEventListener('keydown', e => {
		if (e.target.id === 'year-input') {return;}
		const step = e.shiftKey ? 100 : e.ctrlKey ? 1 : 10;
		switch (e.key) {
		case 'ArrowLeft': case ',': case '<': increment_year(- step); break;
		case 'ArrowRight': case '.': case '>': increment_year(step); break;
		case '[': increment_year(-1); break;
		case ']': increment_year(+1); break;
		case 'A': e.ctrlKey && (e.preventDefault(), toggle_auto()); break;
		case '(': e.ctrlKey && accelerate_auto(1/2); break;
		case ')': e.ctrlKey && accelerate_auto(2); break;
		case '|': e.ctrlKey && reset_auto_speed(); break;
		case 'Escape': stop_auto(); break;
		case 'Home': goto_year(-4000); break;
		case 'End': goto_year(MAX_YEAR); break;
		case '0': !e.ctrlKey && goto_year(1); break;
		case '1': !e.ctrlKey && goto_year(1000); break;
		case 'Enter': year_text.dispatchEvent(new Event('mousedown')); return;
		default: return;
		}
		updated();
	});
	function goto_year(y) {
		push_url();
		data.year = y;
	}
	const default_auto_millisec = 1000;
	let auto_millisec = default_auto_millisec, auto_timer = null;
	function start_auto() {
		stop_auto();
		document.getElementById('auto-sec').innerText = `${auto_millisec / 1000}sec ▶ `;
		auto_timer = setTimeout(() => {
			increment_year(1);
			updated();
			data.year < MAX_YEAR ? start_auto() : stop_auto();
		}, auto_millisec);
	}
	function stop_auto() {
		clearTimeout(auto_timer);
		auto_timer = null;
		document.getElementById('auto-sec').innerText = '';
	}
	function toggle_auto() {
		auto_timer ? stop_auto() : start_auto();
	}
	function accelerate_auto(coef) {
		auto_millisec /= coef;
		start_auto();
	}
	function reset_auto_speed() {auto_millisec = default_auto_millisec; start_auto();}
}
