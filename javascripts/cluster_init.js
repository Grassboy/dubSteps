var str_between = function(str, start, end) {
	var p = str.indexOf(start);
	if (p == - 1) {
		return null;
	}
	str = str.substr(p + start.length);
	p = str.indexOf(end);
	if (p == - 1) {
		return null;
	}
	return str.substr(0, p);
};

var cached = cached || {
    users: {},
    maps: {}
};
var places = {}; //index by id
var markers = {}; //index by latLng
var users = {};

var updateMarkerIcon = function(marker){
    var url_tpl = [
        "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=$|FF6000|000000",    //2
        "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=$|FF0000|000000",    //5
        "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=$|FFA000|000000",   //10
        "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=$|FFCC00|AE2828",   //15
        "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=$|FFFF00|FF0000",   //20
        "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E5%A4%AF%7CFFFF00|FF0000" //爆
    ];
    marker.setZIndex(marker.userCount);
    marker.setTitle(marker.titles[0]);
    if(marker.userCount >= 100) {
        marker.setIcon(url_tpl[5]);
    } else if(marker.userCount >= 20) {
        marker.setIcon(url_tpl[4].replace('$', marker.userCount));
    } else if(marker.userCount >= 15) {
        marker.setIcon(url_tpl[3].replace('$', marker.userCount));
    } else if(marker.userCount >= 10) {
        marker.setIcon(url_tpl[2].replace('$', marker.userCount));
    } else if(marker.userCount >= 5) {
        marker.setIcon(url_tpl[1].replace('$', marker.userCount));
    } else if(marker.userCount >= 2) {
        marker.setIcon(url_tpl[0].replace('$', marker.userCount));
    }
};

var file_put_contents = function (file_name, obj) {
    var blob = new Blob(["\ufeff", JSON.stringify(obj)], {type: "text/plain;charset=utf-8"})
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = file_name;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
    }, 200);
};
var ignoreStoryType = function(storyType){
    return ([
        "timelinemapstoryphoto",
        "timelinemapstoryhometown",
        "timelinemapstorycurrentcity",
        "timelinemapstorylocationunit"
    ].indexOf(storyType.toLowerCase())!=-1);
};
var getCacheInBound = function(bounds){
    var sw = bounds.getSouthWest(), ne = bounds.getNorthEast(),
        lat_start = sw.lat(), lat_end = ne.lat(),
        lng_start = sw.lng(), lng_end = ne.lng();
    var new_cached = {
        user_id: cached.user_id,
        friends: [],
        users: {},
        maps: {}
    };

    var between = function(value, start, end) {
        if(start > end) {
            return (value >= start || value <= end);
        } else {
            return (value >= start && value <= end);
        }
    };
    for(var key in places) {
        if(
            between(places[key].lat, lat_start, lat_end) &&
            between(places[key].lng, lng_start, lng_end)
        ) {
            places[key].valid = true;
        } else {
            delete places[key].valid;
        }
    }
    for(var k in cached.maps) {
        var map = cached.maps[k], has_data = false;
        var valid_places = {};
        for(var i = 0, n = map.stories.length; i < n; ++i){
            var story = map.stories[i];
            if(places[story.placeID] && places[story.placeID].valid && !ignoreStoryType(story.storyType)) {
                has_data = true;
                new_cached.maps[k] = new_cached.maps[k] || {};
                new_cached.maps[k].stories = new_cached.maps[k].stories || [];
                new_cached.maps[k].stories.push(JSON.parse(JSON.stringify(story)));
                valid_places[story.placeID] = true;
            }
        }
        for(var i = 0, n = map.places.length; i < n; ++i){
            var place = map.places[i];
            if(places[place.id] && places[place.id].valid && valid_places[place.id]) {
                has_data = true;
                new_cached.maps[k] = new_cached.maps[k] || {};
                new_cached.maps[k].places = new_cached.maps[k].places || [];
                new_cached.maps[k].places.push(JSON.parse(JSON.stringify(place)));
            }
        }
        if(has_data) {
            new_cached.friends.push(k);
            new_cached.users[k] = cached.users[k];
        }
    }
    return new_cached;
};

var loadData = function () {
	var $ = jQuery;
    var $progress_bar_inner = $('.ds-progress-bar-inner');
    $('.ds-progress-bar').addClass('ds-active');
    (function() { //取得朋友清單
        var deferred = $.Deferred();
        if(cached.friends) {
            deferred.resolve(cached.friends);
        } else {
            deferred.resolve([]);
        }
        return deferred.promise();
    })().then(function(friend_list) {
        if(cached.comment){
            document.title = cached.comment + '【dubSteps 步步】看看朋友都去哪！';
        }
        (function process(i) {
            if (i >= friend_list.length) {
                for(var i in markers) {
                    updateMarkerIcon(markers[i]);
                }
                $('.ds-progress-bar').removeClass('ds-active');
                return;
            }
            $progress_bar_inner.css('width', (i*100/friend_list.length)+'%');
            processUser(friend_list[i], i).always(function() {
                setTimeout(function(){
                    process(i + 1);
                }, 100);
            });
        })(0);
    });
    window.onbeforeunload = window.onbeforeunload || function(){
        return 'dubSteps 貼心提示：為防止下次進來這頁時，還要重新載入資料，建議您直接按 home 鍵回到主畫面，不需關掉這頁~';
    };
};

var processUser = function(uid, now_progress) {
	var $ = jQuery;
    var current_user;
    var deferred = $.Deferred();
	$.when((function(){
        if(cached.users[uid]) {
            return 'cached';
        } else {
            console.log(uid, 'none user');
            return null;
        }
    })()).then(function(user) {
        if(user == 'cached') {
            current_user = users[uid] = cached.users[uid];
        } else {
            console.log(uid, 'none user');
            return null;
        }
        if(cached.maps[uid]) {
            return 'cached';
        } else {
            console.log(uid, 'none maps');
		    return null;
        }
	}).then(function(r) {
        var result;
        if(r == 'cached') {
            result = cached.maps[uid];
        } else {
            console.log(uid, 'none maps');
            return null;
        }
        //載入造訪地點資訊
        for (var i = 0, n = result.places.length; i < n; ++i) {
            var place = result.places[i];
            if (places[place.id]) continue;
            if (place.id && place.latitude && place.longitude) {
                places[place.id] = {
                    name: place.name,
                    lat: place.latitude.toFixed(4),
                    lng: place.longitude.toFixed(4)
                }
            }
        }
        //載入足跡
        tmp_markers = [];
        for (var i = 0, n = result.stories.length; i < n; ++i) {
            var story = result.stories[i];
            if(ignoreStoryType(story.storyType)) continue;

            var place = places[story.placeID];
            if (!place) continue; //skip unknown place
            var index = place.lat + '-' + place.lng;
            var marker = markers[index];
            if (!marker) {
                marker = markers[index] = new google.maps.Marker({
                    icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FE7569',
                    position: new google.maps.LatLng(place.lat, place.lng)
                });
                marker.index = index;
                marker.titles = [];
                marker.stories = {};
                marker.userCount = 0;
                marker.previusUser = null;
                marker.addListener('click', function() {
                    placeInfoWindow.clear();
                    placeInfoWindow.loadMarker(this, true);
                    placeInfoWindow.open(this.getPosition());
                });
                tmp_markers.push(marker);
            }
            if (marker.titles.indexOf(place.name) == - 1) {
                marker.titles.push(place.name);
            }
            var stories = marker.stories[uid] = marker.stories[uid] || [];
            stories.push({
                id: story.id,
                storyType: story.storyType,
                timestamp: story.timestamp
            });
            marker.stories[uid].sort(function(a, b){
                return a.timestamp < b.timestamp?1:-1;
            });
            if(marker.previusUser != current_user.id) {
                marker.previusUser = current_user.id;
                marker.userCount++;
            }
        }
        console.log(uid, ' has ', tmp_markers.length, ' markers added');
        if(tmp_markers.length) {
            markerCluster.addMarkers(tmp_markers);
        }
	}).always(function(){
        deferred.resolve();
    });
    return deferred.promise();
};


function loadScript(url){
    var newRequest = document.createElement("script");
    newRequest.type = "text/javascript";
    newRequest.src = url;
    document.getElementsByTagName("head")[0].appendChild(newRequest);
}

var markerCluster, map;
var current_pos_marker = null, current_pos_circle = null;
var initialize = function() {
    var geo_handler = function(pos) {
        try {
            var c = pos.coords;
            if(!current_pos_marker) {
                current_pos_marker = new google.maps.Marker({
                    map: map,
                    icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2%7C0088DD',
                    zIndex: 2000,
                    position: new google.maps.LatLng(c.latitude, c.longitude)
                });
                current_pos_marker.addListener('click', function() {
                    map.fitBounds(current_pos_circle.getBounds());
                    var max_zoom = 18;
                    if(map.zoom > max_zoom) {
                        map.setZoom(max_zoom);
                    }
                });

                current_pos_circle = new google.maps.Circle({
                    strokeColor: "#0000FF",
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    fillColor: "#0000FF",
                    fillOpacity: 0.15,
                    map: map,
                    center: current_pos_marker.getPosition(),
                    radius: c.accuracy
                });
            } else {
                current_pos_marker.setPosition(new google.maps.LatLng(c.latitude, c.longitude));
                current_pos_circle.setCenter(new google.maps.LatLng(c.latitude, c.longitude));
                current_pos_circle.setRadius(c.accuracy);
            }
        } catch(e) {
            alert(e);
        }
        /*
        var result = [
          '海拔: ',c.altitude,
          '<br/>海拔精確度: ',c.altitudeAccuracy,
          '<br/>方向: ',c.heading,
          '<br/>緯度: ',c.latitude,
          '<br/>經度: ',c.longitude,
          '<br/>精確度: ',c.accuracy,
          '<br/>速度: ',c.speed
        ].join('');
        */

    };
    var geo_error = function(e) {
        alert(e+"囧");
    };
    var last_lat = parseFloat(localStorage['last_lat']) || 22.99448691570212;
    var last_lng = parseFloat(localStorage['last_lng']) || 120.22831619213855;
    var last_zoom = parseFloat(localStorage['last_zoom']) || 13;

	var center = new google.maps.LatLng(last_lat, last_lng);

    map = new google.maps.Map($('#ds-map-container')[0], {
        panControl: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        zoom: last_zoom,
        center: center
    });

	markerCluster = new MarkerClusterer(map, [], {maxZoom: 14, minimumClusterSize: 2});

    var triggerTimer = null;
    markerCluster.addListener('clusterover', function(cluster){
        if(triggerTimer) clearTimeout(triggerTimer);
        triggerTimer = setTimeout(function(){
            placeInfoWindow.clear();
            placeInfoWindow.loadCluster(cluster);
            placeInfoWindow.open(cluster.center_);
        }, 1200);
    });
    markerCluster.addListener('clusterout', function(cluster){
        if(triggerTimer) clearTimeout(triggerTimer);
    });
    markerCluster.addListener('clusterclick', function(cluster){
        if(triggerTimer) clearTimeout(triggerTimer);
    });

    var wpid = navigator.geolocation.watchPosition(
        geo_handler, geo_error, {
            enableHighAccuracy: true,
            maximumAge: 3600000,
            timeout: 27000
        }
    );

    google.maps.event.addListener(map, 'idle', function() {
        var center = map.getCenter();
        var lat = localStorage['last_lat'] = center.lat();
        var lng = localStorage['last_lng'] = center.lng();
        var zoom = localStorage['last_zoom'] = map.getZoom();
        var prev_zoom = $('.ds-scale-now').data('zoom');
        var new_point = $('.ds-scale-point[data-zoom="'+zoom+'"]');
        if(new_point.length == 0){
            var after_dom = $('.ds-scale-button:first');
            while(after_dom.next('.ds-scale-point').length){
                if(after_dom.next('.ds-scale-point').data('zoom') < zoom) {
                    break;
                } else {
                    after_dom = after_dom.next('.ds-scale-point');
                }
            }
            new_point = $('<li class="ds-scale-point" data-zoom="'+zoom+'"></li>').insertAfter(after_dom);
        }
        new_point.data('center', {
            lat: lat, lng: lng
        });
        if(prev_zoom) {
            if(zoom > prev_zoom) {
                $('.ds-scale-now').prevAll('.ds-scale-point').filter(function(){
                    return $(this).data('zoom') < zoom;
                }).remove();
            } else if(zoom < prev_zoom) {
                $('.ds-scale-now').nextAll('.ds-scale-point').filter(function(){
                    return $(this).data('zoom') > zoom;
                }).remove();
            }
        }
        if(zoom != prev_zoom) {
            $('.ds-scale-now').removeClass('ds-scale-now');
            new_point.addClass('ds-scale-now');
        }
    });
    (function fixInfoWindow() { //disable google map's POI info window
        //ref: https://gist.github.com/thiphariel/9951998
        //Here we redefine set() method.
        //If it is called for map option, we hide InfoWindow, if "noSupress" option isnt true.
        //As Google doesn't know about this option, its InfoWindows will not be opened.
        var set = google.maps.InfoWindow.prototype.set;
        google.maps.InfoWindow.prototype.set = function (key, val) {
            if (key === 'map') {
                if (!this.get('noSupress')) {
                    //console.log('This InfoWindow is supressed. To enable it, set "noSupress" option to true');
                    return;
                }
            }
            set.apply(this, arguments);
        }
    })();


    window.placeInfoWindow = new PlaceInfoWindow(map, {
        dom_url: 'tpl.php'
    });
    var matches = location.href.match(/\?data=([a-f0-9]{32})/);
    if(matches) {
        if(localStorage['prev_load'] && localStorage['prev_load'].substr(0, 32) == matches[1]) {
            r = JSON.parse(localStorage['prev_load'].substr(32));
            if(r && r.user_id) {
                cached = r;
                loadData();
                $('.ds-top-header').addClass('ds-loaded ds-inactive');
            }
        } else {
            $.get('http://grassboy.tw/dubSteps/getCache.php?cached_file='+matches[1], function(r){
                if(r.length < 3000000) {
                    localStorage['prev_load'] = matches[1]+r;
                }
                r = JSON.parse(r);
                if(r && r.user_id) {
                    cached = r;
                    loadData();
                    $('.ds-top-header').addClass('ds-loaded ds-inactive');
                }
            });
        }
    }
};

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/maps/google_maps_api_v3_3.js
// ==/ClosureCompiler==

/**
 * @name MarkerClusterer for Google Maps v3
 * @version version 1.0.1
 * @author Luke Mahe
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of
 * markers.
 * <br/>
 * This is a v3 implementation of the
 * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
 * >v2 MarkerClusterer</a>.
 */

/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Wether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'styles': (object) An object that has style properties:
 *       'url': (string) The image url.
 *       'height': (number) The image height.
 *       'width': (number) The image width.
 *       'anchor': (Array) The anchor position of the label text.
 *       'textColor': (string) The text color.
 *       'textSize': (number) The text size.
 *       'backgroundPosition': (string) The position of the backgound x, y.
 * @constructor
 * @extends google.maps.OverlayView
 */
function MarkerClusterer(map, opt_markers, opt_options) {
  // MarkerClusterer implements google.maps.OverlayView interface. We use the
  // extend function to extend MarkerClusterer with google.maps.OverlayView
  // because it might not always be available when the code is defined so we
  // look for it at the last possible moment. If it doesn't exist now then
  // there is no point going ahead :)
  this.extend(MarkerClusterer, google.maps.OverlayView);
  this.map_ = map;

  /**
   * @type {Array.<google.maps.Marker>}
   * @private
   */
  this.markers_ = [];

  /**
   *  @type {Array.<Cluster>}
   */
  this.clusters_ = [];

  this.sizes = [53, 56, 66, 78, 90];

  /**
   * @private
   */
  this.styles_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  var options = opt_options || {};

  /**
   * @type {number}
   * @private
   */
  this.gridSize_ = options['gridSize'] || 60;

  /**
   * @private
   */
  this.minClusterSize_ = options['minimumClusterSize'] || 2;


  /**
   * @type {?number}
   * @private
   */
  this.maxZoom_ = options['maxZoom'] || null;

  this.styles_ = options['styles'] || [];

  /**
   * @type {string}
   * @private
   */
  this.imagePath_ = options['imagePath'] ||
      this.MARKER_CLUSTER_IMAGE_PATH_;

  /**
   * @type {string}
   * @private
   */
  this.imageExtension_ = options['imageExtension'] ||
      this.MARKER_CLUSTER_IMAGE_EXTENSION_;

  /**
   * @type {boolean}
   * @private
   */
  this.zoomOnClick_ = true;

  if (options['zoomOnClick'] != undefined) {
    this.zoomOnClick_ = options['zoomOnClick'];
  }

  /**
   * @type {boolean}
   * @private
   */
  this.averageCenter_ = false;

  if (options['averageCenter'] != undefined) {
    this.averageCenter_ = options['averageCenter'];
  }

  this.setupStyles_();

  this.setMap(map);

  /**
   * @type {number}
   * @private
   */
  this.prevZoom_ = this.map_.getZoom();

  // Add the map event listeners
  var that = this;
  google.maps.event.addListener(this.map_, 'zoom_changed', function() {
    // Determines map type and prevent illegal zoom levels
    var zoom = that.map_.getZoom();
    var minZoom = that.map_.minZoom || 0;
    var maxZoom = Math.min(that.map_.maxZoom || 100,
                         that.map_.mapTypes[that.map_.getMapTypeId()].maxZoom);
    zoom = Math.min(Math.max(zoom,minZoom),maxZoom);

    if (that.prevZoom_ != zoom) {
      that.prevZoom_ = zoom;
      that.resetViewport();
    }
  });

  google.maps.event.addListener(this.map_, 'idle', function() {
    that.redraw();
  });
  google.maps.event.addDomListener(this.map_.getDiv(), 'click', function(e) {
    var target = e.target;
    if(target.className == 'cluster-icon') {
        target.clusterIcon_.triggerClusterClick.apply(target.clusterIcon_, []);
        e.preventDefault();
    }
  });
  var clusterOverHandler = function(e) {
    var target = e.target;
    if(target.className == 'cluster-icon') {
        var that = target.clusterIcon_;
        if(parseInt(that.text_) < 10) {
            google.maps.event.trigger(that.cluster_.markerClusterer_, 'clusterover', that.cluster_);
        }
        e.preventDefault();
    }
  };
  var clusterOutHandler = function(e) {
    var target = e.target;
    if(target.className == 'cluster-icon') {
        var that = target.clusterIcon_;
        if(parseInt(that.text_) < 10) {
            google.maps.event.trigger(that.cluster_.markerClusterer_, 'clusterout', that.cluster_);
        }
        e.preventDefault();
    }
  };
  google.maps.event.addDomListener(this.map_.getDiv(), 'mouseover', clusterOverHandler);
  google.maps.event.addDomListener(this.map_.getDiv(), 'touchstart', clusterOverHandler);
  google.maps.event.addDomListener(this.map_.getDiv(), 'mouseout', clusterOutHandler);
  google.maps.event.addDomListener(this.map_.getDiv(), 'touchend', clusterOutHandler);

  // Finally, add the markers
  if (opt_markers && (opt_markers.length || Object.keys(opt_markers).length)) {
    this.addMarkers(opt_markers, false);
  }
}


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ =
    'https://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/' +
    'images/m';


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
MarkerClusterer.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.onAdd = function() {
  this.setReady_(true);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.draw = function() {};

/**
 * Sets up the styles object.
 *
 * @private
 */
MarkerClusterer.prototype.setupStyles_ = function() {
  if (this.styles_.length) {
    return;
  }

  for (var i = 0, size; size = this.sizes[i]; i++) {
    this.styles_.push({
      url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
      height: size,
      width: size
    });
  }
};

/**
 *  Fit the map to the bounds of the markers in the clusterer.
 */
MarkerClusterer.prototype.fitMapToMarkers = function() {
  var markers = this.getMarkers();
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }

  this.map_.fitBounds(bounds);
};


/**
 *  Sets the styles.
 *
 *  @param {Object} styles The style to set.
 */
MarkerClusterer.prototype.setStyles = function(styles) {
  this.styles_ = styles;
};


/**
 *  Gets the styles.
 *
 *  @return {Object} The styles object.
 */
MarkerClusterer.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * Whether zoom on click is set.
 *
 * @return {boolean} True if zoomOnClick_ is set.
 */
MarkerClusterer.prototype.isZoomOnClick = function() {
  return this.zoomOnClick_;
};

/**
 * Whether average center is set.
 *
 * @return {boolean} True if averageCenter_ is set.
 */
MarkerClusterer.prototype.isAverageCenter = function() {
  return this.averageCenter_;
};


/**
 *  Returns the array of markers in the clusterer.
 *
 *  @return {Array.<google.maps.Marker>} The markers.
 */
MarkerClusterer.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 *  Returns the number of markers in the clusterer
 *
 *  @return {Number} The number of markers.
 */
MarkerClusterer.prototype.getTotalMarkers = function() {
  return this.markers_.length;
};


/**
 *  Sets the max zoom for the clusterer.
 *
 *  @param {number} maxZoom The max zoom level.
 */
MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
  this.maxZoom_ = maxZoom;
};


/**
 *  Gets the max zoom for the clusterer.
 *
 *  @return {number} The max zoom level.
 */
MarkerClusterer.prototype.getMaxZoom = function() {
  return this.maxZoom_;
};


/**
 *  The function for calculating the cluster icon image.
 *
 *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
 *  @param {number} numStyles The number of styles available.
 *  @return {Object} A object properties: 'text' (string) and 'index' (number).
 *  @private
 */
MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
  var index = 0;
  var count = markers.length;
  var dv = count;
  while (dv !== 0) {
    dv = parseInt(dv / 10, 10);
    index++;
  }

  index = Math.min(index, numStyles);
  return {
    text: count,
    index: index
  };
};


/**
 * Set the calculator function.
 *
 * @param {function(Array, number)} calculator The function to set as the
 *     calculator. The function should return a object properties:
 *     'text' (string) and 'index' (number).
 *
 */
MarkerClusterer.prototype.setCalculator = function(calculator) {
  this.calculator_ = calculator;
};


/**
 * Get the calculator function.
 *
 * @return {function(Array, number)} the calculator function.
 */
MarkerClusterer.prototype.getCalculator = function() {
  return this.calculator_;
};


/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
  if (markers.length) {
    for (var i = 0, marker; marker = markers[i]; i++) {
      this.pushMarkerTo_(marker);
    }
  } else if (Object.keys(markers).length) {
    for (var marker in markers) {
      this.pushMarkerTo_(markers[marker]);
    }
  }
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
  marker.isAdded = false;
  if (marker['draggable']) {
    // If the marker is draggable add a listener so we update the clusters on
    // the drag end.
    var that = this;
    google.maps.event.addListener(marker, 'dragend', function() {
      marker.isAdded = false;
      that.repaint();
    });
  }
  this.markers_.push(marker);
};


/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
  this.pushMarkerTo_(marker);
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
MarkerClusterer.prototype.removeMarker_ = function(marker) {
  var index = -1;
  if (this.markers_.indexOf) {
    index = this.markers_.indexOf(marker);
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        index = i;
        break;
      }
    }
  }

  if (index == -1) {
    // Marker is not in our list of markers.
    return false;
  }

  marker.setMap(null);

  this.markers_.splice(index, 1);

  return true;
};


/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
  var removed = this.removeMarker_(marker);

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  } else {
   return false;
  }
};


/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
  var removed = false;

  for (var i = 0, marker; marker = markers[i]; i++) {
    var r = this.removeMarker_(marker);
    removed = removed || r;
  }

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  }
};


/**
 * Sets the clusterer's ready state.
 *
 * @param {boolean} ready The state.
 * @private
 */
MarkerClusterer.prototype.setReady_ = function(ready) {
  if (!this.ready_) {
    this.ready_ = ready;
    this.createClusters_();
  }
};


/**
 * Returns the number of clusters in the clusterer.
 *
 * @return {number} The number of clusters.
 */
MarkerClusterer.prototype.getTotalClusters = function() {
  return this.clusters_.length;
};


/**
 * Returns the google map that the clusterer is associated with.
 *
 * @return {google.maps.Map} The map.
 */
MarkerClusterer.prototype.getMap = function() {
  return this.map_;
};


/**
 * Sets the google map that the clusterer is associated with.
 *
 * @param {google.maps.Map} map The map.
 */
MarkerClusterer.prototype.setMap = function(map) {
  this.map_ = map;
};


/**
 * Returns the size of the grid.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getGridSize = function() {
  return this.gridSize_;
};


/**
 * Sets the size of the grid.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setGridSize = function(size) {
  this.gridSize_ = size;
};


/**
 * Returns the min cluster size.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getMinClusterSize = function() {
  return this.minClusterSize_;
};

/**
 * Sets the min cluster size.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setMinClusterSize = function(size) {
  this.minClusterSize_ = size;
};


/**
 * Extends a bounds object by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 */
MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
  var projection = this.getProjection();

  // Turn the bounds into latlng.
  var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
  var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

  // Convert the points to pixels and the extend out by the grid size.
  var trPix = projection.fromLatLngToDivPixel(tr);
  trPix.x += this.gridSize_;
  trPix.y -= this.gridSize_;

  var blPix = projection.fromLatLngToDivPixel(bl);
  blPix.x -= this.gridSize_;
  blPix.y += this.gridSize_;

  // Convert the pixel points back to LatLng
  var ne = projection.fromDivPixelToLatLng(trPix);
  var sw = projection.fromDivPixelToLatLng(blPix);

  // Extend the bounds to contain the new bounds.
  bounds.extend(ne);
  bounds.extend(sw);

  return bounds;
};


/**
 * Determins if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 * @private
 */
MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
  return bounds.contains(marker.getPosition());
};


/**
 * Clears all clusters and markers from the clusterer.
 */
MarkerClusterer.prototype.clearMarkers = function() {
  this.resetViewport(true);

  // Set the markers a empty array.
  this.markers_ = [];
};


/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
MarkerClusterer.prototype.resetViewport = function(opt_hide) {
  // Remove all the clusters
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    cluster.remove();
  }

  // Reset the markers to not be added and to be invisible.
  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    marker.isAdded = false;
    if (opt_hide) {
      marker.setMap(null);
    }
  }

  this.clusters_ = [];
};

/**
 *
 */
MarkerClusterer.prototype.repaint = function() {
  var oldClusters = this.clusters_.slice();
  this.clusters_.length = 0;
  this.resetViewport();
  this.redraw();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(function() {
    for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
      cluster.remove();
    }
  }, 0);
};


/**
 * Redraws the clusters.
 */
MarkerClusterer.prototype.redraw = function() {
  this.createClusters_();
};


/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
*/
MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
  if (!p1 || !p2) {
    return 0;
  }

  var R = 6371; // Radius of the Earth in km
  var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
  var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
  var distance = 40000; // Some large number
  var clusterToAddTo = null;
  var pos = marker.getPosition();
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    var center = cluster.getCenter();
    if (center) {
      var d = this.distanceBetweenPoints_(center, marker.getPosition());
      if (d < distance) {
        distance = d;
        clusterToAddTo = cluster;
      }
    }
  }

  if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
    clusterToAddTo.addMarker(marker);
  } else {
    var cluster = new Cluster(this);
    cluster.addMarker(marker);
    this.clusters_.push(cluster);
  }
};


/**
 * Creates the clusters.
 *
 * @private
 */
MarkerClusterer.prototype.createClusters_ = function() {
  if (!this.ready_) {
    return;
  }

  // Get our current map view bounds.
  // Create a new bounds object so we don't affect the map.
  var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
      this.map_.getBounds().getNorthEast());
  var bounds = this.getExtendedBounds(mapBounds);

  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
      this.addToClosestCluster_(marker);
    }
  }
};


/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function Cluster(markerClusterer) {
  this.markerClusterer_ = markerClusterer;
  this.map_ = markerClusterer.getMap();
  this.gridSize_ = markerClusterer.getGridSize();
  this.minClusterSize_ = markerClusterer.getMinClusterSize();
  this.averageCenter_ = markerClusterer.isAverageCenter();
  this.center_ = null;
  this.markers_ = [];
  this.bounds_ = null;
  this.clusterIcon_ = new ClusterIcon(this, markerClusterer.getStyles(),
      markerClusterer.getGridSize());
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
  if (this.markers_.indexOf) {
    return this.markers_.indexOf(marker) != -1;
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Add a marker the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Cluster.prototype.addMarker = function(marker) {
  if (this.isMarkerAlreadyAdded(marker)) {
    return false;
  }

  if (!this.center_) {
    this.center_ = marker.getPosition();
    this.calculateBounds_();
  } else {
    if (this.averageCenter_) {
      var l = this.markers_.length + 1;
      var lat = (this.center_.lat() * (l-1) + marker.getPosition().lat()) / l;
      var lng = (this.center_.lng() * (l-1) + marker.getPosition().lng()) / l;
      this.center_ = new google.maps.LatLng(lat, lng);
      this.calculateBounds_();
    }
  }

  marker.isAdded = true;
  this.markers_.push(marker);

  var len = this.markers_.length;
  if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
    // Min cluster size not reached so show the marker.
    marker.setMap(this.map_);
  }

  if (len == this.minClusterSize_) {
    // Hide the markers that were showing.
    for (var i = 0; i < len; i++) {
      this.markers_[i].setMap(null);
    }
  }

  if (len >= this.minClusterSize_) {
    marker.setMap(null);
  }

  this.updateIcon();
  return true;
};


/**
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
 */
Cluster.prototype.getMarkerClusterer = function() {
  return this.markerClusterer_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Cluster.prototype.getBounds = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  var markers = this.getMarkers();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }
  return bounds;
};


/**
 * Removes the cluster
 */
Cluster.prototype.remove = function() {
  this.clusterIcon_.remove();
  this.markers_.length = 0;
  delete this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Cluster.prototype.getSize = function() {
  return this.markers_.length;
};


/**
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
 */
Cluster.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Cluster.prototype.getCenter = function() {
  return this.center_;
};


/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Cluster.prototype.calculateBounds_ = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};


/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isMarkerInClusterBounds = function(marker) {
  return this.bounds_.contains(marker.getPosition());
};


/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Cluster.prototype.getMap = function() {
  return this.map_;
};


/**
 * Updates the cluster icon
 */
Cluster.prototype.updateIcon = function() {
  var zoom = this.map_.getZoom();
  var mz = this.markerClusterer_.getMaxZoom();

  if (mz && zoom > mz) {
    // The zoom is greater than our max zoom so show all the markers in cluster.
    for (var i = 0, marker; marker = this.markers_[i]; i++) {
      marker.setMap(this.map_);
    }
    return;
  }

  if (this.markers_.length < this.minClusterSize_) {
    // Min cluster size not yet reached.
    this.clusterIcon_.hide();
    return;
  }

  var numStyles = this.markerClusterer_.getStyles().length;
  var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
  this.clusterIcon_.setCenter(this.center_);
  this.clusterIcon_.setSums(sums);
  this.clusterIcon_.show();
};


/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {Object} styles An object that has style properties:
 *     'url': (string) The image url.
 *     'height': (number) The image height.
 *     'width': (number) The image width.
 *     'anchor': (Array) The anchor position of the label text.
 *     'textColor': (string) The text color.
 *     'textSize': (number) The text size.
 *     'backgroundPosition: (string) The background postition x, y.
 * @param {number=} opt_padding Optional padding to apply to the cluster icon.
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
function ClusterIcon(cluster, styles, opt_padding) {
  cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

  this.styles_ = styles;
  this.padding_ = opt_padding || 0;
  this.cluster_ = cluster;
  this.center_ = null;
  this.map_ = cluster.getMap();
  this.div_ = null;
  this.sums_ = null;
  this.visible_ = false;

  this.setMap(this.map_);
}


/**
 * Triggers the clusterclick event and zoom's if the option is set.
 */
ClusterIcon.prototype.triggerClusterClick = function() {
  var markerClusterer = this.cluster_.getMarkerClusterer();

  // Trigger the clusterclick event.
  google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_);

  if (markerClusterer.isZoomOnClick()) {
    var getBoundsZoomLevel = function (bounds, mapDim) {
        var WORLD_DIM = { height: 256, width: 256 };
        var ZOOM_MAX = 21;

        function latRad(lat) {
            var sin = Math.sin(lat * Math.PI / 180);
            var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
            return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        }

        function zoom(mapPx, worldPx, fraction) {
            return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        }

        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();

        var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

        var lngDiff = ne.lng() - sw.lng();
        var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

        var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
        var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

        return Math.min(latZoom, lngZoom, ZOOM_MAX);
    }
    var predict_zoom = (getBoundsZoomLevel(this.cluster_.getBounds(), {
        width: parseFloat(getComputedStyle(this.map_.getDiv()).width),
        height: parseFloat(getComputedStyle(this.map_.getDiv()).height)
    }));
    var maxZoom = this.cluster_.markerClusterer_.maxZoom_;
    if(predict_zoom > maxZoom && this.map_.getZoom() < maxZoom) {
        this.map_.setCenter(this.cluster_.getBounds().getCenter());
        this.map_.setZoom(maxZoom+1);
    } else {
        // Zoom into the cluster.
        this.map_.fitBounds(this.cluster_.getBounds());
    }
  }
};


/**
 * Adding the cluster icon to the dom.
 * @ignore
 */
ClusterIcon.prototype.onAdd = function() {
  this.div_ = document.createElement('DIV');
  this.div_.className = 'cluster-icon';
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.innerHTML = this.sums_.text;
  }

  var panes = this.getPanes();
  panes.overlayMouseTarget.appendChild(this.div_);
  this.div_.clusterIcon_ = this;
};


/**
 * Returns the position to place the div dending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 * @private
 */
ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
  var pos = this.getProjection().fromLatLngToDivPixel(latlng);
  pos.x -= parseInt(this.width_ / 2, 10);
  pos.y -= parseInt(this.height_ / 2, 10);
  return pos;
};


/**
 * Draw the icon.
 * @ignore
 */
ClusterIcon.prototype.draw = function() {
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.top = pos.y + 'px';
    this.div_.style.left = pos.x + 'px';
  }
};


/**
 * Hide the icon.
 */
ClusterIcon.prototype.hide = function() {
  if (this.div_) {
    this.div_.style.display = 'none';
  }
  this.visible_ = false;
};


/**
 * Position and show the icon.
 */
ClusterIcon.prototype.show = function() {
  if (this.div_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.style.display = '';
  }
  this.visible_ = true;
};


/**
 * Remove the icon from the map
 */
ClusterIcon.prototype.remove = function() {
  this.setMap(null);
};


/**
 * Implementation of the onRemove interface.
 * @ignore
 */
ClusterIcon.prototype.onRemove = function() {
  if (this.div_ && this.div_.parentNode) {
    this.hide();
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};


/**
 * Set the sums of the icon.
 *
 * @param {Object} sums The sums containing:
 *   'text': (string) The text to display in the icon.
 *   'index': (number) The style index of the icon.
 */
ClusterIcon.prototype.setSums = function(sums) {
  this.sums_ = sums;
  this.text_ = sums.text;
  this.index_ = sums.index;
  if (this.div_) {
    this.div_.innerHTML = sums.text;
  }

  this.useStyle();
};


/**
 * Sets the icon to the the styles.
 */
ClusterIcon.prototype.useStyle = function() {
  var index = Math.max(0, this.sums_.index - 1);
  index = Math.min(this.styles_.length - 1, index);
  var style = this.styles_[index];
  this.url_ = style['url'];
  this.height_ = style['height'];
  this.width_ = style['width'];
  this.textColor_ = style['textColor'];
  this.anchor_ = style['anchor'];
  this.textSize_ = style['textSize'];
  this.backgroundPosition_ = style['backgroundPosition'];
};


/**
 * Sets the center of the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
ClusterIcon.prototype.setCenter = function(center) {
  this.center_ = center;
};


/**
 * Create the css text based on the position of the icon.
 *
 * @param {google.maps.Point} pos The position.
 * @return {string} The css style text.
 */
ClusterIcon.prototype.createCss = function(pos) {
  var style = [];
  style.push('background-image:url(' + this.url_ + ');');
  var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
  style.push('background-position:' + backgroundPosition + ';');

  if (typeof this.anchor_ === 'object') {
    if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
        this.anchor_[0] < this.height_) {
      style.push('height:' + (this.height_ - this.anchor_[0]) +
          'px; padding-top:' + this.anchor_[0] + 'px;');
    } else {
      style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
          'px;');
    }
    if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
        this.anchor_[1] < this.width_) {
      style.push('width:' + (this.width_ - this.anchor_[1]) +
          'px; padding-left:' + this.anchor_[1] + 'px;');
    } else {
      style.push('width:' + this.width_ + 'px; text-align:center;');
    }
  } else {
    style.push('height:' + this.height_ + 'px; line-height:' +
        this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
  }

  var txtColor = this.textColor_ ? this.textColor_ : 'black';
  var txtSize = this.textSize_ ? this.textSize_ : 11;

  style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
      pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
      txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
  return style.join('');
};


// Export Symbols for Closure
// If you are not going to compile with closure then you can remove the
// code below.
window['MarkerClusterer'] = MarkerClusterer;
MarkerClusterer.prototype['addMarker'] = MarkerClusterer.prototype.addMarker;
MarkerClusterer.prototype['addMarkers'] = MarkerClusterer.prototype.addMarkers;
MarkerClusterer.prototype['clearMarkers'] =
    MarkerClusterer.prototype.clearMarkers;
MarkerClusterer.prototype['fitMapToMarkers'] =
    MarkerClusterer.prototype.fitMapToMarkers;
MarkerClusterer.prototype['getCalculator'] =
    MarkerClusterer.prototype.getCalculator;
MarkerClusterer.prototype['getGridSize'] =
    MarkerClusterer.prototype.getGridSize;
MarkerClusterer.prototype['getExtendedBounds'] =
    MarkerClusterer.prototype.getExtendedBounds;
MarkerClusterer.prototype['getMap'] = MarkerClusterer.prototype.getMap;
MarkerClusterer.prototype['getMarkers'] = MarkerClusterer.prototype.getMarkers;
MarkerClusterer.prototype['getMaxZoom'] = MarkerClusterer.prototype.getMaxZoom;
MarkerClusterer.prototype['getStyles'] = MarkerClusterer.prototype.getStyles;
MarkerClusterer.prototype['getTotalClusters'] =
    MarkerClusterer.prototype.getTotalClusters;
MarkerClusterer.prototype['getTotalMarkers'] =
    MarkerClusterer.prototype.getTotalMarkers;
MarkerClusterer.prototype['redraw'] = MarkerClusterer.prototype.redraw;
MarkerClusterer.prototype['removeMarker'] =
    MarkerClusterer.prototype.removeMarker;
MarkerClusterer.prototype['removeMarkers'] =
    MarkerClusterer.prototype.removeMarkers;
MarkerClusterer.prototype['resetViewport'] =
    MarkerClusterer.prototype.resetViewport;
MarkerClusterer.prototype['repaint'] =
    MarkerClusterer.prototype.repaint;
MarkerClusterer.prototype['setCalculator'] =
    MarkerClusterer.prototype.setCalculator;
MarkerClusterer.prototype['setGridSize'] =
    MarkerClusterer.prototype.setGridSize;
MarkerClusterer.prototype['setMaxZoom'] =
    MarkerClusterer.prototype.setMaxZoom;
MarkerClusterer.prototype['onAdd'] = MarkerClusterer.prototype.onAdd;
MarkerClusterer.prototype['draw'] = MarkerClusterer.prototype.draw;

Cluster.prototype['getCenter'] = Cluster.prototype.getCenter;
Cluster.prototype['getSize'] = Cluster.prototype.getSize;
Cluster.prototype['getMarkers'] = Cluster.prototype.getMarkers;

ClusterIcon.prototype['onAdd'] = ClusterIcon.prototype.onAdd;
ClusterIcon.prototype['draw'] = ClusterIcon.prototype.draw;
ClusterIcon.prototype['onRemove'] = ClusterIcon.prototype.onRemove;

Object.keys = Object.keys || function(o) {
    var result = [];
    for(var name in o) {
        if (o.hasOwnProperty(name))
          result.push(name);
    }
    return result;
};

(function () {
    var $ = window.jQuery;
    var PlaceInfoWindow = function(map, opts) {
        var that = this;
        this.map_ = map;
        if(opts.dom_url) {
            $.get(opts.dom_url, function(html){
                that.$dom = $(html);
                that.initTplItem();
            });
            return;
        }
        if(opts.html) {
            this.initTplItem();
        }
    };
    PlaceInfoWindow.prototype = {
        constructor: PlaceInfoWindow,
        clear: function (preserve_places) {
            if(!preserve_places) {
                this.$dom.removeClass('ds-place-view').find(
                    '.ds-place-item,'+
                    '.ds-title-item,'+
                    '.ds-friend-item,'+
                    '.ds-single-time').remove();
            } else {
                this.$dom.removeClass('ds-place-view').find(
                    '.ds-title-item,'+
                    '.ds-friend-item,'+
                    '.ds-single-time').remove();
            }
        },
        loadCluster: function (cluster) {
            var markers = cluster.markers_;
            if(!markers) {
                return;
            }
            for(var i = 0, n = markers.length; i < n; ++i){
                var item = this.addPlaceItem(markers[i].titles[0]);
                item.data('marker', markers[i]);
            }
        },
        loadMarker: function (marker, is_single) {
            this.$dom.addClass('ds-place-view');
            var titles = marker.titles, count = 0;
            if(is_single) {
                this.addPlaceItem(marker.titles[0]);
            }
            for(var i = 0, n = titles.length; i < n; ++i){
                this.addTitleItem(titles[i]);
            }
            if(titles.length > 1) {
                this.$dom.find('.ds-other-title').show();
            } else {
                this.$dom.find('.ds-other-title').hide();
            }
            var item;
            for(var friend_id in marker.stories) {
                count++;
                item = this.addFriendItem(friend_id), stories = marker.stories[friend_id];
                for(var i = 0, n = stories.length; i < n; ++i){
                    var story = stories[i];
                    this.addTimeItem(item, story);
                }
            }
            this.$dom.find('.ds-status').text('共 '+count+' 人造訪...');
            if(count == 1) {
                item.addClass('ds-expanded');
            }
        },
        open: function(position) {
            this.infowindow_.setPosition(position);
            this.infowindow_.open(this.map_);
        },
        initTplItem: function () {
            var that = this;
            var disable_zoom = function (e) {
                e.stopPropagation();
            };
            that.$dom.bind('wheel', disable_zoom);
            that.$dom.bind('DOMMouseScroll', disable_zoom);
            that.$dom.bind('mousewheel', disable_zoom);
            that.$dom.on('click', '.ds-other-title', function(e){
                e.preventDefault();
                $(this).prev().children(':first').appendTo($(this).prev())
            });
            that.$dom.on('click', '.ds-friend-item:not(.ds-expanded)', function(e){
                that.$dom.find('.ds-expanded').removeClass('ds-expanded');
                $(this).addClass('ds-expanded');
                that.$dom.find('.ds-general-view').scrollTop(0);
            });
            that.$dom.on('click', '.ds-place-item:not(.ds-place-selected)', function(e){
                var $this = $(this);
                var marker = $this.data('marker');
                that.$dom.find('.ds-place-selected').removeClass('ds-place-selected');
                $this.addClass('ds-place-selected');
                placeInfoWindow.clear(true);
                placeInfoWindow.loadMarker(marker);
                placeInfoWindow.open(marker.getPosition());
            });
            that.infowindow_ = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(0, -30),
                noSupress: true,
                content: that.$dom[0]
            });
            that.$dom.find(
                '.ds-place-item:not(.tpl-item),'+
                '.ds-title-item:not(.tpl-item),'+
                '.ds-friend-item:not(.tpl-item),'+
                '.ds-single-time:not(.tpl-item)').remove();
            that.$dom.find('.tpl-item').removeClass('tpl-item');
            that.$dom.find('.ds-expanded').removeClass('ds-expanded');

            that.time_item_ = that.$dom.find('.ds-single-time').detach();
            that.place_item_ = that.$dom.find('.ds-place-item').detach();
            that.title_item_ = that.$dom.find('.ds-title-item').detach();
            that.friend_item_ = that.$dom.find('.ds-friend-item').detach();
        },
        addTimeItem: function (parent_node, story) {
            var timestamp = story.timestamp;
            var t = new Date();
            var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            t.setTime(timestamp*1000);
            var item = this.time_item_.clone().appendTo(parent_node);
            item.find('.ds-time-y').text(t.getFullYear());
            item.find('.ds-time-m').text(month_names_short[t.getMonth()]);
            item.find('.ds-time-d').text(t.getDate());
            item.attr({
                'data-storytype': story.storyType,
                'href': 'http://facebook.com/'+story.id,
                'title': t.toString().substr(0, t.toString().lastIndexOf(' '))
            });
            return item;
        },
        addTitleItem: function (title) {
            var item = this.title_item_.clone().appendTo(this.$dom.find('.ds-title-list'));
            item.text(title).attr('title', title);
            item.click(function(){
                window.open('http://www.google.com.tw/search?q='+encodeURIComponent(title));
            });
            return item;
        },
        addPlaceItem: function (place_name) {
            var item = this.place_item_.clone().appendTo(this.$dom.find('.ds-place-list'));
            item.text(place_name);
            return item;
        },
        addFriendItem: function (friend_id) {
            var item = this.friend_item_.clone().appendTo(this.$dom.find('.ds-friend-list'));
            item.attr({
                'title': cached.users[friend_id] && cached.users[friend_id].name,
                'data-sn': friend_id
            });
            item.find('img').attr({
                'src': 'http://graph.facebook.com/'+friend_id+'/picture?type=square'
            }).css({
                'background-image': 'url(http://graph.facebook.com/'+friend_id+'/picture?type=normal)'
            });
            return item;
        }
    };
    window.PlaceInfoWindow = PlaceInfoWindow;
})();
$(function(){
    loadScript('https://maps.googleapis.com/maps/api/js?v=3.exp&signed_in=false&callback=initialize');
});

