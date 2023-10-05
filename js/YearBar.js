'use strict';

function YearBar()
{
	const _SIZE = 32;

	const year_bar = document.getElementById('year-bar');
	const scale = document.getElementById('year-bar-scale');
	const cursor = document.getElementById('year-bar-cursor');
	const year_text = document.getElementById('year-text');
	let scale_width = 1;
	let on_changed_handler = null;

	// conversion between year and x on year-bar-scale
	const scale_year_min = -4000;
	const scale_year_max = MAX_YEAR;
	const scale_param = [
		{ // original
			year_labels: [-4000, -3000, -2000, -1000, 0, 1000, 2000],
			year_knots: [-4200, -1000, 2100],
			r_knots: [0, 0.33, 1],
		},
		{ // flat
			year_labels: [-4000, -3000, -2000, -1000, 0, 1000, 2000],
			year_knots: [-4200, 2300],
			r_knots: [0, 1],
		},
		{ // very uneven
			year_labels: [-1000, 0, 1000, 1500, 2000],
			year_knots: [-4200, -1000, 0, 1000, 1500, 2050],
			r_knots: [0, 0.03, 0.1, 0.3, 0.5, 1],
		},
	];
	let sp = scale_param[0];
	function cycle_scale_mode() {
		const cur = scale_param.indexOf(sp);
		sp = scale_param[(cur + 1) % scale_param.length];
		draw_scale();
	}
	function year_from_x(x)
	{
		const r = x / scale_width;
		const year = Math.round(piecewise_linear(r, sp.r_knots, sp.year_knots));
		return year === 0 ? 1 : year;
	}
	function x_from_year(year)
	{
		const r = piecewise_linear(year, sp.year_knots, sp.r_knots);
		return r * scale_width;
	}
	function piecewise_linear(input, from, to)
	{
		const k = from.findIndex(z => input < z);
		return k > 0 ? linear(input, from[k - 1], from[k], to[k - 1], to[k]) :
			k === 0 ? to[0] : to[to.length - 1];
	}
	function linear(input, from0, from1, to0, to1)
	{
		const s = (input - from0) / (from1 - from0);
		return (1 - s) * to0 + s * to1;
	}

	this.set_width = function(width)
	{
		if (width < 1) {
			width = 1;
		}
		scale_width = width;
		scale.setAttribute('width', width);
		draw_scale();
	}

	function draw_scale()
	{
		const width = scale_width;
		let ctx = scale.getContext('2d');
		ctx.clearRect(0, 0, width, _SIZE);
		ctx.fillStyle = '#e0e0e0';
		ctx.fillRect(0, 0, width, _SIZE);

		ctx.fillStyle = '#c0c0c0';
		for (let year = scale_year_min; year < scale_year_max; year += 200) {
			const x1 = x_from_year(year);
			const x2 = x_from_year(year + 100);
			ctx.fillRect(x1, 0, x2 - x1, _SIZE);
		}

		ctx.fillStyle = 'black';
		ctx.font = '9px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		sp.year_labels.forEach(year => {
			const x = x_from_year(year);
			ctx.fillText(String(year), x, _SIZE / 2);
		});

		update_cursor();
	}
	function update_cursor()
	{
		data.year_clamp();
		cursor.style.left = (x_from_year(data.year) - 6) + 'px';
	}

	function increment_year(delta)
	{
		stop_auto();
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

	function updated()
	{
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
	year_bar.addEventListener('mousedown', onMouseDown);
	function onMouseMove(e)
	{
		if (is_dragging_year) {
			if (e.clientY < 0) {
				// vertical drag beyond the top of the viewport
				cycle_scale_mode();
				is_dragging_year = false;
				return;
			}
			onMouseDown(e);
		}
	}
	function onMouseDown(e)
	{
		stop_auto();
		let xpos = e.clientX;
		data.year = year_from_x(xpos);
		updated();
		is_dragging_year = true;
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
	scale.addEventListener('touchstart', e => {
		if (e.touches.length !== 1) {
			is_dragging_year = false;
			return;
		}
		onMouseDown(e.changedTouches[0]);
	});
	document.addEventListener('keydown', e => {
		if (e.target.tagName === 'INPUT') {return;}
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
	function goto_year(y)
	{
		stop_auto();
		push_url();
		data.year = y;
	}
	const default_auto_millisec = 1000;
	let auto_millisec = default_auto_millisec, auto_timer = null;
	function start_auto()
	{
		stop_auto();
		if (data.year >= MAX_YEAR) {
			return;
		}
		auto_millisec = Math.max(10, Math.min(auto_millisec, 1e+8))
		const auto_sec = auto_millisec / 1000;
		const auto_sec_decimals = auto_sec >= 1 ? 1 : - Math.floor(Math.log(auto_sec) / Math.log(10));
		const rounded_auto_sec = auto_sec >= 10 ? Math.round(auto_sec) : auto_sec.toFixed(auto_sec_decimals).replace(/[.]?0+$/, '');
		document.getElementById('auto-sec').innerText = `${rounded_auto_sec}s ▶`;
		auto_timer = setTimeout(() => {
			increment_year(1);
			data.year < MAX_YEAR ? start_auto() : stop_auto();
		}, auto_millisec);
		updated();
	}
	function stop_auto()
	{
		clearTimeout(auto_timer);
		auto_timer = null;
		document.getElementById('auto-sec').innerText = '';
		updated();
	}
	function toggle_auto()
	{
		auto_timer ? stop_auto() : start_auto();
	}
	function accelerate_auto(coef)
	{
		auto_millisec /= coef;
		start_auto();
	}
	function reset_auto_speed()
	{
		auto_millisec = default_auto_millisec;
		start_auto();
	}

	function with_update(func)
	{
		return arg => {func(arg); updated();};
	}
	this.increment_year = with_update(increment_year);
	this.in_auto = () => !!auto_timer;
	this.start_auto = with_update(start_auto);
	this.stop_auto = with_update(stop_auto);
	this.accelerate_auto = with_update(accelerate_auto);
	this.reset_auto_speed = with_update(reset_auto_speed);
}
