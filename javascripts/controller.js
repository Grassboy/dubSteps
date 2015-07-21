$(function(){
    var $menu = $('.ds-toolbar');
    var $top_header = $('.ds-top-header');
    var rectangle = null, bound_infowindow = null;
    var setDialog = function(dialog){
        $('.ds-dialog.ds-active').removeClass('ds-active');
        if(dialog) dialog.addClass('ds-active');
    };
    $menu.on('click', 'li', function(e){
        e.stopPropagation();
        switch($(this).attr('class')){
        case "ds-load-fb":
            setDialog($('.ds-fb-import'));
            break;
        case "ds-import":
            $('.ds-import-file').click();
            setDialog(null);
            break;
        case "ds-export":
            setDialog(null);
            var new_bounds = (function(){
                var midLng = function(w, e){
                    var result;
                    if(w > e) {
                        result = (w+e+360)/2;
                        if(result>180) result = result - 360;
                    } else {
                        result = (w + e)/2;
                    }
                    return result;
                };
                var c = map.getCenter();
                var b = map.getBounds();
                var sw = b.getSouthWest(), ne = b.getNorthEast();
                var new_w = midLng(sw.lng(), c.lng()), new_e = midLng(c.lng(), ne.lng());
                var new_s = (c.lat() + sw.lat())/2, new_n = (c.lat() + ne.lat()) / 2;
                return new google.maps.LatLngBounds(
                    new google.maps.LatLng(new_s, new_w),
                    new google.maps.LatLng(new_n, new_e)
                );
            })();
            var geoDecode = function(){
                var d = $.Deferred();
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    'location': rectangle.getBounds().getCenter()
                },
                function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        for(var i = 0, n = results.length; i < n; ++i){
                            var addr = results[i].formatted_address;
                            if((addr.length <= 10) || (addr.split(' ').length <= 10 && /^[\x00-\xff]+$/i.test(addr)) || (i + 1 == n)) {
                                d.resolve(addr);
                                break;
                            }
                        }
                    } else {
                        d.resolve(cached.comment || '朋友的打卡記錄');
                    }
                });
                return d.promise();
            };
            if(!rectangle) {
                var $box = $([
                        '<div class="ds-export-iw">',
                            '請用紅色方框畫出要匯出的範圍',
                            '<ul class="ds-export-fn-list">',
                                '<li class="ds-export-fn ds-export-download" title="將範圍內的地點下載以便未來局部載入"><i class="icon-download2"></i>存到本機</li>',
                                '<li class="ds-export-fn ds-export-upload" title="將範圍內的地點上傳至雲端，未來可直接透過網址存取 (手機可直接存取)"><i class="icon-upload"></i>存到雲端</li>',
                                '<li class="ds-export-fn ds-export-cancel" title="取消"><i class="icon-cancel"></i>取消</li>',
                            '</ul>',
                        '</div>'
                    ].join(''));
                $box.find('.ds-export-download').click(function(){
                    geoDecode().then(function(addr){
                        rectangle.setVisible(false);
                        bound_infowindow.close();
                        var new_cached = getCacheInBound(rectangle.getBounds());
                        new_cached.comment = prompt('請為這份打卡記錄命名，您可輸入一個方便您辨識的名稱，未來載入此記錄時，將會顯示於頁面標題', addr) || '朋友的打卡記錄';
                        var d = new Date();
                        file_put_contents(['FBdata', d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()].join('-')+'.txt', new_cached);
                    });
                });
                $box.find('.ds-export-upload').click(function(){
                    if(confirm('紅色方框選取範圍內的打卡資訊將會上傳至網路上，\n您將會取得一個(非公開的)超連結，\n有此網址的裝置(包括手機)皆可存取此範圍的打卡資訊，要繼續嗎？')) {
                        geoDecode().then(function(addr){
                            rectangle.setVisible(false);
                            bound_infowindow.close();
                            var new_cached = getCacheInBound(rectangle.getBounds());
                            new_cached.comment = prompt('請為這份打卡記錄命名，您可輸入一個方便您辨識的名稱，未來載入此記錄時，將會顯示於頁面標題', addr) || '朋友的打卡記錄';
                            var blob = new Blob(["\ufeff", JSON.stringify(new_cached)], {type: "text/plain;charset=utf-8"});
                            var formData = new FormData();
                            formData.append('cached_file', blob);
                            var request = new XMLHttpRequest();
                            request.open('POST', 'http://grassboy.tw/dubSteps/genURL.php');
                            request.onreadystatechange = function(){
                                if (request.readyState == 4 && request.status == 200) {
                                    var r = JSON.parse(request.responseText);
                                    if(r.ok) {
                                        var url = 'http://grassboy.tw/dubSteps/?data='+r.rsp;
                                        $('.ds-upload-url').val(url);
                                        $('.ds-upload-link').attr('href', url);
                                        qr.canvas({
                                            canvas: $('.ds-upload-canvas')[0],
                                            value: url,
                                            size: 6
                                        });
                                        setDialog($('.ds-upload-result'));
                                    } else {
                                        alert(r && r.msg);
                                    }
                                }
                            };
                            request.send(formData);
                        });
                    }
                });
                $box.find('.ds-export-cancel').click(function(){
                    rectangle.setVisible(false);
                    bound_infowindow.close();
                });
                bound_infowindow = new google.maps.InfoWindow({
                    noSupress: true,
                    content: $box[0]
                });
                rectangle = new google.maps.Rectangle({
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    map: map,
                    draggable: true,
                    editable: true,
                    bounds: new_bounds
                });
                google.maps.event.addListener(rectangle, 'bounds_changed', function() {
                    var b = this.getBounds();
                    bound_infowindow.setPosition(new google.maps.LatLng(
                        b.getSouthWest().lat(), b.getCenter().lng()
                    ));
                    bound_infowindow.open(map);
                });
                bound_infowindow.setPosition(new google.maps.LatLng(
                    new_bounds.getSouthWest().lat(), new_bounds.getCenter().lng()
                ));
                bound_infowindow.open(map);
            } else {
                rectangle.setBounds(new_bounds);
                rectangle.setVisible(true);
            }
            break;
        case "ds-help":
            setDialog($('.ds-about'));
            break;
        }
    });
    $('.ds-fb-load-file-directly,.ds-fb-load-file').click(function(){
        $('.ds-import-file').click();
    });
    $menu.bind('click', function(e){
        e.preventDefault();
        $menu.toggleClass('ds-active');
        $top_header.toggleClass('ds-inactive');
        $top_header.addClass('ds-loaded');
        return false;
    });

    var $fb_import = $('.ds-fb-import');
    $('.ds-fb-prev').click(function(){
        var $item = $fb_import.find('.ds-active:first').removeClass('ds-active').prev('li');
        if($item.length == 0) {
            $item = $fb_import.find('li:first');
        }
        $item.addClass('ds-active');
    });
    $('.ds-fb-next').click(function(){
        var $item = $fb_import.find('.ds-active:first').removeClass('ds-active').next('li');
        if($item.length == 0) {
            $item = $fb_import.find('li:last');
        }
        $item.addClass('ds-active');
    });
    $('.ds-fb-close,.ds-about-close').click(function(){
        setDialog(null);
    });
    $('.ds-about-fb-import').click(function(){
        setDialog($('.ds-fb-import'));
    });

    $.get('http://grassboy.tw/dubSteps/GetFBData.php').then(function(r){
        $('.ds-fb-textarea').val(r).click(function(){
            this.select();
        });
    });

    $('.ds-scale-list').on('click', '.ds-scale-point,.ds-scale-button',function(){
        var $this = $(this);
        if($this.is('.ds-scale-point')) {
            //no-op
        } else if($this.find('.ds-scale-prev').length > 0){
            $this = $('.ds-scale-now').next('.ds-scale-point:first');
        } else if($this.find('.ds-scale-next').length > 0) {
            $this = $('.ds-scale-now').prev('.ds-scale-point:last');
        }
        if($this.is('.ds-scale-point')){
            var center = $this.data('center');
            map.panTo(
                    new google.maps.LatLng(center.lat, center.lng)
            );
            map.setZoom($this.data('zoom'));
            $('.ds-scale-now').removeClass('ds-scale-now');
            $this.addClass('ds-scale-now');
        }
    });

    $('.ds-logo').click(function(){
        (document.body.requestFullScreen || document.body.mozRequestFullScreen || document.body.webkitRequestFullScreen).apply(document.body, []);
    });

    $('.ds-upload-url').click(function(){
        this.select();
    });
    $('.ds-upload-close').click(function(){
        setDialog(null);
    });
    $('.ds-current-location').click(function(){
        map.panTo(current_pos_marker.getPosition());
        return false;
    });
    (function(){ //Drag/FileInput Handler
        var html = document.body.parentNode;
        var loadFile = function(file){
            var reader = new FileReader();
            reader.addEventListener('load', function (e) {
                var text = e.target.result;
                eval("window.cached = "+text);
                alert('已載入打卡資訊，即將顯示於地圖上…');
                loadData();
                $top_header.addClass('ds-loaded ds-inactive');
            });
            reader.readAsText(file);
        };
        html.addEventListener('drop', function (e) {
            e.preventDefault();
            $('.ds-drag-area').removeClass('ds-active');
            setDialog(null);
            var dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length) {
                alert('開始讀取檔案');
                var file = dt.files[0];
                loadFile(file);
            }
        });
        html.addEventListener('dragover', function (e) {
            e.preventDefault();
            $('.ds-drag-area').addClass('ds-active');
        });
        $('.ds-drag-area')[0].addEventListener('dragleave', function (e) {
            e.preventDefault();
            $('.ds-drag-area').removeClass('ds-active');
        });
        $('.ds-import-file').change(function(){
            if(this.files.length) {
                loadFile(this.files[0]);
            }
        });
    })();
});
