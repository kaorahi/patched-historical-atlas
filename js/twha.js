(function(fn)
{
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
})(function()
{
	const touch_handler = {
		touchstart: pinch_start,
		touchmove: pinch_move,
		touchend: pinch_end,
		touchcancel: pinch_end,
	};

	const lang_button = new LangButton();
	const year_text = new YearText();
	const year_bar = new YearBar();
	const map = new Map();

	let screen_width = 0;
	let screen_height = 0;
	let resize_timer = -1;

	data.year_clamp = function()
	{
		if (this.year < -4000) {
			this.year = -4000;
		} else if (this.year == 0) {
			this.year = 1;
		} else if (this.year > MAX_YEAR) {
			this.year = MAX_YEAR;
		}
	};

	const max_zoom = 4;

	function zoom(delta)
	{
		zoom_around(null, delta);
	}
	function zoom_around(point, delta)
	{
		if (delta === 0) {  // avoid useless call on android
			return;
		}
		const new_zoom = Math.max(0, Math.min(data.zoom + delta, max_zoom));
		if (new_zoom === data.zoom) {
			map.toast('!');
			return;
		}
		const shift = point ? vector_from_map_center(point) : null;
		map.set_zoom_with_shift(new_zoom, shift);
		update_button();
	}
	function vector_from_map_center(point)
	{
		const [x, y] = point;
		const x0 = screen_width * 0.5;
		const y0 = screen_height * 0.5;
		return [x - x0, y - y0];
	}

	function resize()
	{
		let body = document.getElementsByTagName('body')[0];

		screen_width = body.offsetWidth;
		screen_height = body.offsetHeight;
		let canbas_h = screen_height;

		map.set_size(screen_width, canbas_h);

		year_bar.set_width(screen_width);

		// workaround for android:
		// 100vh includes the browser address bar
		const viewportHeight = window.innerHeight;
		document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);

		map.update();
	}

	function open_new_tab(url)
	{
		window.open(url || location.href, '_blank');
	}

	const wikipedia_url = {
		ja: {
			base: 'https://ja.wikipedia.org/wiki/',
			century: '{___}%E4%B8%96%E7%B4%80',
			decade: '{___}%E5%B9%B4%E4%BB%A3',
			year: '{___}%E5%B9%B4',
			bc_century: '%E7%B4%80%E5%85%83%E5%89%8D{___}%E4%B8%96%E7%B4%80',
			bc_decade: '%E7%B4%80%E5%85%83%E5%89%8D{___}%E5%B9%B4%E4%BB%A3',
			bc_year: '%E7%B4%80%E5%85%83%E5%89%8D{___}%E5%B9%B4',
		},
		en: {
			// not yet
			// https://en.wikipedia.org/wiki/1st_century
			// https://en.wikipedia.org/wiki/0s
			// https://en.wikipedia.org/wiki/AD_1
			// https://en.wikipedia.org/wiki/1st_century_BC
			// https://en.wikipedia.org/wiki/0s_BC
			// https://en.wikipedia.org/wiki/1_BC
		},
		zh: {
			// not yet
		},
	}

	function open_wikipedia(key, calculator)
	{
		const is_bc = (data.year < 0)
		const val = calculator(Math.abs(data.year))
		const u = wikipedia_url[data.lang]
		if (!u.base) {
			alert("Unsupported.")
			return
		}
		const k = is_bc ? `bc_${key}` : key
		const page = u[k].replace('{___}', val)
		open_new_tab(u.base + page)
	}

	function open_wikipedia_century()
	{
		open_wikipedia('century', y => 1 + Math.floor((y - 1) / 100))
	}

	function open_wikipedia_decade()
	{
		open_wikipedia('decade', y => 10 * Math.floor(y / 10))
	}

	function open_wikipedia_year()
	{
		open_wikipedia('year', y => y)
	}

	year_bar.onchanged(function()
	{
		year_text.update();
		map.update();
		update_button();
	});
	lang_button.onchanged(function()
	{
		year_text.update();
		map.update_style();
	});
	year_text.onchanged(function()
	{
		year_bar.update();
		map.update();
	});

	Array.prototype.forEach.call(document.querySelectorAll('input[type="text"]'), elem => {
		elem.addEventListener('focus', year_bar.stop_auto);
		elem.addEventListener('keydown', e => {
			switch (e.key) {
			case 'Escape': elem.blur(); break;
			}
		});
	});

	window.addEventListener('resize', function()
	{
        if (resize_timer !== -1) {
            clearTimeout(resize_timer);
        }

        resize_timer = setTimeout(function() {
            resize_timer = -1;
			resize();
        }, 250);
	});

	(function(callback)
	{
		if (window.addEventListener) {
			window.addEventListener('DOMMouseScroll', callback, false);
			window.addEventListener('mousewheel', callback, false);
		}
	})(function(e)
	{
		let delta = e.wheelDelta ? e.wheelDelta : e.deltaY ? -e.deltaY : -e.detail;
		const point = [e.clientX, e.clientY];
		zoom_around(point, Math.sign(delta) * 0.1);
	});

	document.addEventListener('keydown', e => {
		if (e.key === 'Escape') {close_tool_dialog();}
		if (e.target.tagName === 'INPUT') {return;}
		switch (e.key) {
		case 'z': case 'i': zoom(+0.5); break;
		case 'Z': case 'x': case 'o': zoom(-0.5); break;
		case 'd': open_new_tab(); break;
		case 'C': open_wikipedia_century(); break;
		case 'D': open_wikipedia_decade(); break;
		case 'Y': open_wikipedia_year(); break;
		case '?': open_new_tab('HELP.md'); break;
		}
	});

	// footer buttons
	const buttons_in_pause = ['back3-btn', 'back2-btn', 'back1-btn', 'play-btn', 'fwd1-btn', 'fwd2-btn', 'fwd3-btn'];
	const buttons_in_play = ['dummy1-btn', 'dummy2-btn', 'dummy3-btn', 'pause-btn', 'slow-btn', 'fast-btn', 'reset-btn'];
	function button(id)
	{
		return document.getElementById(id);
	}
	function set_buttons_state(ids, state)
	{
		ids.forEach(id => button(id).dataset.state = state);
	}
	function enable_button_if(bool, id)
	{
		set_buttons_state([id], bool ? '' : 'disabled');
	}
	function update_button()
	{
		if (year_bar.in_auto()) {
			set_buttons_state(buttons_in_play, '');
			set_buttons_state(buttons_in_pause, 'hidden');
		} else {
			set_buttons_state(buttons_in_play, 'hidden');
			set_buttons_state(buttons_in_pause, '');
			enable_button_if(data.year < MAX_YEAR, 'play-btn');
		}
		enable_button_if(data.zoom < max_zoom, 'zoom-in-btn');
		enable_button_if(data.zoom > 0, 'zoom-out-btn');
		button('lang-select').value = data.lang;
	}
	function play()
	{
		year_bar.start_auto();
		update_button();
	}
	function pause()
	{
		year_bar.stop_auto();
		update_button();
	}
	function toggle_full_screen(bool)
	{
		const to_full = (bool === undefined) ? !document.fullscreenElement : bool;
		to_full ? document.body.requestFullscreen() : document.exitFullscreen();
	}
	document.addEventListener('fullscreenchange', () => {
		document.getElementById('fullscr-ckbox').checked = !!document.fullscreenElement;
	});
	let btn_repeat_timer = null;
	const btn_repeat_delay_millsec = 800;
	const btn_repeat_interval_millsec = 200;
	function cancel_button_repeat()
	{
		if (btn_repeat_timer !== null) {
			clearTimeout(btn_repeat_timer);
			btn_repeat_timer = null;
		}
	}
	cancel_button_repeat();
	function set_button_repeat(handler)
	{
		const delay = (btn_repeat_timer === null) ? btn_repeat_delay_millsec : btn_repeat_interval_millsec;
		cancel_button_repeat();
		btn_repeat_timer = setTimeout(handler, delay);
	}
	function add_button_handler(id, repeatable, handler)
	{
		const btn = button(id);
		const cancel_events = ['pointerup', 'pointerleave', 'pointerout', 'pointercancel'];
		const on_fire = () => {handler(); repeatable && set_button_repeat(on_fire);};
		const on_first_fire = e => {e.preventDefault(); on_fire()};
		btn.addEventListener('pointerdown', on_first_fire, {passive: false});
		cancel_events.forEach(ev => btn.addEventListener(ev, cancel_button_repeat));
	}
	add_button_handler('zoom-out-btn', true, () => zoom(-0.5));
	add_button_handler('zoom-in-btn', true, () => zoom(+0.5));
	add_button_handler('back3-btn', true, () => year_bar.increment_year(-100));
	add_button_handler('back2-btn', true, () => year_bar.increment_year(-10));
	add_button_handler('back1-btn', true, () => year_bar.increment_year(-1));
	add_button_handler('play-btn', false, play);
	add_button_handler('fwd1-btn', true, () => year_bar.increment_year(+1));
	add_button_handler('fwd2-btn', true, () => year_bar.increment_year(+10));
	add_button_handler('fwd3-btn', true, () => year_bar.increment_year(+100));
	add_button_handler('pause-btn', false, pause);
	add_button_handler('auto-sec', false, pause);  // for safety
	add_button_handler('slow-btn', false, () => year_bar.accelerate_auto(0.5));
	add_button_handler('fast-btn', false, () => year_bar.accelerate_auto(2));
	add_button_handler('reset-btn', false, year_bar.reset_auto_speed);
	pause();
	update_button();

	function set_tool_dialog(should_show)
	{
		const ids = ['tool-dialog', 'dialog-overlay'];
		const display = should_show ? 'block' : 'none';
		ids.forEach(id => document.getElementById(id).style.display = display);
	}
	function open_tool_dialog() {
		set_tool_dialog(true);
	}
	function close_tool_dialog(e) {
		set_tool_dialog(false);
	}
	document.getElementById('tool-btn').addEventListener('click', open_tool_dialog);
	document.getElementById('close-tool-btn').addEventListener('click', close_tool_dialog);
	document.getElementById('dialog-overlay').addEventListener('click', close_tool_dialog);
	const ckbox_rule = [
		// [id, onclick],
		['fullscr-ckbox', toggle_full_screen],
		['hide-ckbox', toggle_hiding_ui],
	];
	ckbox_rule.forEach(([id, onclick]) => {
		const checkbox = document.getElementById(id);
		checkbox.addEventListener('change', () => {
			onclick(checkbox.checked);
			map.update();
		});
	});

	// pinch zoom
	let pinch_distance = null
	let pinch_center = null
	let pinch_type = null
	function pinch_start(e)
	{
		switch (e.touches.length) {
		case 2: break;
		case 3: toggle_immersion(); // fall thru
		default: pinch_end(); return;
		}
		e.preventDefault();
		pinch_distance = get_pinch_distance(e);
		pinch_center = get_pinch_center(e);
		pinch_type = null;
	}
	function pinch_move(e)
	{
		if (e.touches.length !== 2 || pinch_distance === null) {
			pinch_end();
			return;
		}
		e.preventDefault();
		two_finger_swipe(e) || pinch_zoom(e);
	}

	function pinch_zoom(e)
	{
		const min_distance = 100;
		const min_distance_change = 10;
		const new_distance = get_pinch_distance(e);
		const is_pinch = (pinch_type === 'pinch') || (
			new_distance > min_distance &&
			Math.abs(new_distance - pinch_distance) > min_distance_change
		);
		if (!is_pinch) {
			return;
		}
		if (pinch_distance > 0) {
			const delta = Math.log(new_distance / pinch_distance) / Math.log(2);
			zoom_around(pinch_center, delta);
		}
		pinch_distance = new_distance;
		pinch_type = 'pinch';
	}

	function two_finger_swipe(e)
	{
		const max_distance = 200;
		const max_distance_change = 20;
		const min_center_change = 10;
		const rule = [
			{direction: [1, 0], speed: -0.02},
			{direction: [0, 1], speed: -0.2},
		];
		const edge_speed = -2.0;
		const edge_px = 32;
		const argmax = a => a.indexOf(Math.max(...a));
		const inner_prod = (a, b) => a[0] * b[0] + a[1] * b[1];
		const new_distance = get_pinch_distance(e);
		const new_center = get_pinch_center(e);
		const distance_change = Math.abs(new_distance - pinch_distance);
		const center_change = get_distance(pinch_center, new_center, 0, 1);
		const is_swipe = pinch_type !== 'pinch' &&
			new_distance < max_distance &&
			distance_change < max_distance_change &&
			(pinch_type === 'swipe' || center_change > min_center_change);
		if (!is_swipe) {
			return false;  // no side effect
		}
		const dc = [new_center[0] - pinch_center[0], new_center[1] - pinch_center[1]];
		const prod = rule.map(h => inner_prod(h.direction, dc));
		const k = argmax(prod.map(Math.abs));
		const near_edge = (z, size) => (z < edge_px || size - edge_px < z);
		const is_edge = (k === 0 && near_edge(new_center[1], window.innerHeight)) ||
			  (k === 1 && near_edge(new_center[0], window.innerWidth));
		const speed = is_edge ? edge_speed : rule[k].speed;
		const delta_year = Math.round(prod[k] * speed);
		if (Math.abs(delta_year) > 0) {
			year_bar.increment_year(delta_year);
			pinch_center = new_center;
			pinch_distance = new_distance;
			pinch_type = 'swipe';
		}
		return true;
	}

	function get_pinch_distance(e)
	{
		const t = e.touches;
		return get_distance(t[0], t[1], 'clientX', 'clientY');
	}
	function get_distance(p, q, i, j)
	{
		return Math.sqrt((p[i] - q[i])**2 + (p[j] - q[j])**2);
	}
	function get_pinch_center(e)
	{
		const t0 = e.touches[0];
		const t1 = e.touches[1];
		return [(t0.clientX + t1.clientX) * 0.5, (t0.clientY + t1.clientY) * 0.5];
	}
	function pinch_end()
	{
		pinch_distance = null;
		pinch_type = null;
	}
	const infoLayer = document.getElementById('layer-info');
	Object.keys(touch_handler).forEach(key => infoLayer.addEventListener(key, touch_handler[key], {passive: false}));

	function toggle_immersion()
	{
		toggle_hiding_ui();
		toggle_full_screen(data.hide_ui);
	}

	// hide buttons etc.
	function toggle_hiding_ui(bool)
	{
		data.hide_ui = (bool === undefined) ? !data.hide_ui : bool;
		document.querySelectorAll('.hidable').forEach(elem => {
			elem.dataset.hidden = data.hide_ui ? 'yes' : ''
		});
		document.getElementById('hide-ckbox').checked = data.hide_ui;
	}
	toggle_hiding_ui(!!data.hide_ui);

	resize();
});
