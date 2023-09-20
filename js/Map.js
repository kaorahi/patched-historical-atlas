'use strict';

function Map()
{
	const landLayer = document.getElementById('layer-land');
	const tertLayer = document.getElementById('layer-tert');
	const infoLayer = document.getElementById('layer-info');

	const MAP_SIZE = 450;
	const MAP_X = 8;
	const MAP_Y = 4;

	const mpLandCache = new Array(MAP_X * MAP_Y);
	const mpTertCache = new Array(MAP_X * MAP_Y);
	// 指定した年のRegionパネル全て
	let regions_this_year = [];
	// 画面上に見えているRegionパネル全て
	let visible_regions = [];

	let curWidth, curHeight;
	let curWidth2, curHeight2;
	let mousedown_x = null;
	let mousedown_y = null;
	let prev_zoom = data.zoom;
	let prev_year = -9999;


	function scale_for(zoom) {
		return 2**(zoom - 1);
	}

	function getMapLandPart(i, j)
	{
		let idx = i + j * MAP_X;
		let ld = mpLandCache[idx];
		if (!ld){
			ld = document.createElement('img');
			ld.setAttribute('alt', '');
			ld.setAttribute('src', 'sf/' + i + j + '.png');
			mpLandCache[idx] = ld;
		}
		return ld;
	}
	function getMapTertYear(year, i, j)
	{
		let a = territory[i][j];
		let lb = 0, ub = a.length;
		while (lb < ub) {
			let m = Math.floor((lb + ub) / 2);
			if (year >= a[m]) {
				if (m + 1 == ub || year < a[m + 1]) {
					return a[m];
				}
				lb = m + 1;
			} else {
				ub = m;
			}
		}
		return -4000;
	}
	function getMapTertPart(i, j)
	{
		let idx = i + j * MAP_X;
		let mp = mpTertCache[idx];
		if (!mp){
			mp = document.createElement('img');
			mp.setAttribute('alt', '');
			mpTertCache[idx] = mp;
		}
		mp.setAttribute('src', 't/' + i + j + '/' + getMapTertYear(data.year, i, j) + '.png');
		return mp;
	}

	function set_zoom_with_shift(new_zoom, shift) {
		if (new_zoom === data.zoom) {
			return false;
		}
		const [dx, dy] = shift || [];
		if (shift) {
		    scroll_internally(dx, dy);
		}
		data.zoom = new_zoom;
		update_center();
		if (shift) {
			scroll_internally(- dx, - dy);
		}
		update();
		return true;
	}
	this.set_zoom_with_shift = set_zoom_with_shift;

	function update_center() {
		// zoomが変化している場合、座標中心も変化する
		if (prev_zoom !== data.zoom) {
			data.map_x = Math.round(data.map_x * scale_for(data.zoom) / scale_for(prev_zoom));
			data.map_y = Math.round(data.map_y * scale_for(data.zoom) / scale_for(prev_zoom));
			prev_zoom = data.zoom;
		}
	}

	function update_map()
	{
		update_center();

		// マップの表示範囲を計算
		let curX = data.map_x;
		let curY = data.map_y;
		let mapSize = MAP_SIZE * scale_for(data.zoom);
		let maxW = Math.ceil(curWidth / mapSize);
		let maxH = Math.ceil(curHeight / mapSize);

		let rev = false;

		let ox = curX - curWidth2;
		if (ox < 0) {
			ox += mapSize * MAP_X;
		}
		let mx = ox % mapSize;
		let px = Math.floor(ox / mapSize);
		let ex = px + maxW;
		if (ex >= MAP_X) {
			ex -= MAP_X;
			rev = true;
		}

		let oy = curY - curHeight2;
		let my, py;
		if (oy < 0) {
			my = mapSize - (-oy % mapSize) - 1;
			py = -Math.floor(-oy / mapSize) - 1;
		} else {
			my = oy % mapSize;
			py = Math.floor(oy / mapSize);
		}
		let ey = py + maxH;

		// マップを表示
		for (let i = 0; i < MAP_X; i++) {
			let vi = (i >= px && i <= ex);
			if (rev) {
				vi = !vi;
			}
			for (let j = 0; j < MAP_Y; j++) {
				let idx = i + j * MAP_X;
				let mpLand;
				let mpTert;

				if (vi && j >= py && j <= ey) {
					mpLand = getMapLandPart(i, j);
					mpTert = getMapTertPart(i, j);

					if (!mpLand.parentNode) {
						landLayer.appendChild(mpLand);
					}
					if (!mpTert.parentNode) {
						tertLayer.appendChild(mpTert);
					}

					let dx = i - px;
					if (dx < 0) {
						dx += MAP_X;
					}
					let dy = j - py;

					mpLand.style.left = (dx * mapSize - mx) + 'px';
					mpLand.style.top = (dy * mapSize - my) + 'px';
					mpLand.setAttribute('width', mapSize);
					mpLand.setAttribute('height', mapSize);

					mpTert.style.left = (dx * mapSize - mx) + 'px';
					mpTert.style.top = (dy * mapSize - my) + 'px';
					mpTert.setAttribute('width', mapSize);
					mpTert.setAttribute('height', mapSize);
				} else {
					mpLand = mpLandCache[idx];
					mpTert = mpTertCache[idx];

					if (mpLand && mpLand.parentNode) {
						landLayer.removeChild(mpLand);
					}
					if (mpTert && mpTert.parentNode) {
						tertLayer.removeChild(mpTert);
					}
				}
			}
		}
		update_url();
		toast(data.year);
	}

	// 全Regionから、指定した年に含まれるものだけを抽出
	function update_region_of_year(yr)
	{
		let ret = [];

		for (let i = 0; i < region_list.length; i++) {
			let a = region_list[i];
			let rg = a[0];
			if (rg) {
				if (rg.node && rg.node.parentNode) {
					infoLayer.removeChild(rg.node);
				}
				if (yr >= a[1] && yr < a[2]) {
					rg.update_year();
				} else {
					a[0] = rg = null;
				}
			} else {
				if (yr >= a[1] && yr < a[2]) {
					a[0] = rg = new Region(a);
					rg.update_year();
				}
			}
			if (rg) {
				ret.push(rg);
			}
		}

		return ret;
	}

	// infoLayerに追加
	function insert_visible_regions(nt)
	{
		visible_regions.push(nt);
		infoLayer.appendChild(nt.node);
	}
	// infoLayerから削除
	function remove_visible_region(rg)
	{
		infoLayer.removeChild(rg.node);
		let i = visible_regions.indexOf(rg);
		if (i >= 0) {
			visible_regions.splice(i, 1);
		}
	}

	function update_info()
	{
		if (prev_year !== data.year) {
			regions_this_year = update_region_of_year(data.year);
			visible_regions = [];
			prev_year = data.year;
		}
		let scale = scale_for(data.zoom);
		let mapSize = MAP_SIZE * scale;
		let curX = data.map_x;
		let curY = data.map_y;

		for (let i = 0; i < regions_this_year.length; i++) {
			let nt = regions_this_year[i];
			let px = nt.pos_x * scale - curX;
			let py = nt.pos_y * scale - curY;

			if (px > mapSize * 4) {
				px -= mapSize * 8;
			} else if (px < -mapSize * 4) {
				px += mapSize * 8;
			}

			if (px > -curWidth2 - REGION_WIDTH && px < curWidth2 + 20 &&
				py > -curHeight2 - 210 && py < curHeight2 + 15 && data.zoom >= nt.disp_level)
			{
				// 見えている
				nt.update(px + curWidth2, py + curHeight2);

				if (!nt.node.parentNode) {
					insert_visible_regions(nt);
				}
			} else {
				// 見えなくなった
				if (nt.node.parentNode) {
					remove_visible_region(nt);
				}
			}
		}
	}

	// スクロール位置を合わせる
	function limit_map_center()
	{
		let mapSize = MAP_SIZE * scale_for(data.zoom);
		let maxX = MAP_X * mapSize;
		let maxY = MAP_Y * mapSize;

		// 左右限度を超えた場合、1周回る
		if (data.map_x < 0) {
			data.map_x += maxX;
		} else if (data.map_x >= maxX) {
			data.map_x -= maxX;
		}

		// 上下限を超えないようにする
		if (data.map_y < 0) {
			data.map_y = 0;
		} else if (data.map_y > maxY) {
			data.map_y = maxY;
		}
	}

	function scroll(dx, dy) {
		scroll_internally(dx, dy);
		update_map();
		update_info();
	}
	function scroll_internally(dx, dy) {
		data.map_x += dx;
		data.map_y += dy;
		limit_map_center();
	}

	// https://github.com/kaorahi/lizgoban/releases/tag/v0.6.0-pre2
	// から流用
	let last_toast_message = null;
	let last_toast_animation = null;
	function toast(message) {
		if (message === last_toast_message) {return;}
		last_toast_message = message;
		last_toast_animation && last_toast_animation.finish();
		document.getElementById('toast_message').textContent = message;
		const keyframes = [{opacity: 0.2}, {opacity: 0.2}, {opacity: 0}];
		last_toast_animation = document.getElementById('toast').animate(keyframes, 1000);
	}

	let url_timer = null;
	function update_url() {
		// skip too frequent updates
		clearTimeout(url_timer);
		url_timer = setTimeout(update_url_now, 100);
	}
	function update_url_now() {
		const recorded_types = ['string', 'number'];
		const decimals = {zoom: 1};
		const params = new URLSearchParams('');
		Object.keys(data).forEach(key => {
			const value = data[key];
			const type = typeof value;
			if (recorded_types.includes(type)) {
				const rounded = (type === 'number') ? value.toFixed(decimals[key] || 0) : value;
				params.append(key, rounded);
			}
		});
		const url = location.protocol + '//' + location.host + location.pathname + '?' + params.toString();
		history.replaceState(null, document.title, url);
	}

	document.addEventListener('keydown', e => {
		const u = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.1);
		switch (e.key) {
		case ' ': e.ctrlKey && (push_url(), toast(''), toast(data.year)); break;
		case 'h': scroll(-u, 0); break;
		case 'j': scroll(0, +u); break;
		case 'k': scroll(0, -u); break;
		case 'l': scroll(+u, 0); break;
		case 'y': scroll(-u, -u); break;
		case 'u': scroll(+u, -u); break;
		case 'b': scroll(-u, +u); break;
		case 'n': scroll(+u, +u); break;
		}
	});

	window.addEventListener('popstate', e => location.reload());

	this.set_size = function(width, height)
	{
		curWidth = width;
		curHeight = height;
		curWidth2 = Math.floor(width / 2);
		curHeight2 = Math.floor(height / 2);

		let w = width + 'px';
		let h = height + 'px';

		landLayer.style.width = w;
		landLayer.style.height = h;
		tertLayer.style.width = w;
		tertLayer.style.height = h;
		infoLayer.style.width = w;
		infoLayer.style.height = h;
	};
	function update() {
		update_map();
		update_info();
	};
	this.update = update;
	this.update_style = function()
	{
		for (let i = 0; i < visible_regions.length; i++) {
			visible_regions[i].update();
		}
		update_url();
	};

	infoLayer.addEventListener('mousedown', function(e)
	{
		mousedown_x = e.clientX;
		mousedown_y = e.clientY;
        e.preventDefault();
	});
	infoLayer.addEventListener('mouseup', function(e)
	{
		mousedown_x = null;
		mousedown_y = null;
        e.preventDefault();
	});
	infoLayer.addEventListener('mousemove', function(e)
	{
		if (e.buttons != 0 && !is_dragging_year && mousedown_x !== null && (mousedown_x !== e.clientX || mousedown_y !== e.clientY)) {
			// マウスドラッグによるスクロール
			scroll(mousedown_x - e.clientX, mousedown_y - e.clientY);
			mousedown_x = e.clientX;
			mousedown_y = e.clientY;
		}
        e.preventDefault();
	});

	let prevPoint = null;
	function touchedPoint(e) {
		const t = e.changedTouches[0];  // ignore multi-touch
		return {x: t.clientX, y: t.clientY};
	}
	function onTouchStart(e) {
		if (e.touches.length !== 1) {
			prevPoint = null;
			return;
		}
		prevPoint = touchedPoint(e);
		// (workaround for Firefox)
		// In Firefox, mousemove is fired before mousedown by a tap???
		mousedown_x = prevPoint.x;
		mousedown_y = prevPoint.y;
	}
	function onTouchMove(e) {
		if (is_dragging_year || e.touches.length !== 1) {
			prevPoint = null;
			return;
		}
		const point = touchedPoint(e);
		scroll(prevPoint.x - point.x, prevPoint.y - point.y);
		prevPoint = point;
	}
	infoLayer.addEventListener('touchstart', onTouchStart);
	infoLayer.addEventListener('touchmove', onTouchMove);
}
