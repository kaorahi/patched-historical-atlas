'use strict';

function ZoomBar()
{
	const zoom_bar = document.getElementById('scale-zoom');
	const cursor = document.getElementById('scale-zoom-cursor');
	let on_changed_handler = null;

	// 「つまみ」を動かす
	function update_cursor()
	{
		cursor.style.left = (101 - data.zoom * 16) + 'px';
	}
	function zoom_limit()
	{
		if (data.zoom < 0) {
			data.zoom = 0;
		} else if (data.zoom > 4) {
			data.zoom = 4;
		}
	}

	this.update = update_cursor;

	this.onchanged = function(f)
	{
		on_changed_handler = f;
	};

	let is_dragging = false;
	function on_mousedown(e) {
		is_dragging = true;
		update_zoom(e);
	}
	function on_mousemove(e) {
		if (is_dragging) {
			update_zoom(e);
		}
	}
	function on_mouseup() {
		is_dragging = false;
	}
	function for_touch(handler) {
		return e => {
			if (e.touches.length === 1) {
				handler(e.changedTouches[0])
			} else {
				on_mouseup();
			}
		}
	}
	zoom_bar.addEventListener('mousedown', on_mousedown);
	zoom_bar.addEventListener('mousemove', on_mousemove);
	zoom_bar.addEventListener('mouseup', on_mouseup);
	document.body.addEventListener('mouseup', on_mouseup);
	document.body.addEventListener('mouseleave', on_mouseup);
	zoom_bar.addEventListener('touchstart', for_touch(on_mousedown));
	zoom_bar.addEventListener('touchmove', for_touch(on_mousemove));
	zoom_bar.addEventListener('touchend', on_mouseup);
	zoom_bar.addEventListener('touchcancel', on_mouseup);

	function update_zoom(e) {
		// マウス座標からつまみ位置を求める
		data.zoom = (121 - e.clientX) / 16;
		zoom_limit();
		update_cursor();
		if (on_changed_handler) {
			on_changed_handler();
		}
	}

	update_cursor();
}
